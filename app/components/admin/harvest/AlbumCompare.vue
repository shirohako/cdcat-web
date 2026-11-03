<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import type { AggregateRef, AlbumDocument } from '~/types/document'
import type { HarvestCandidateDetail, HarvestRemerge } from '~/types/harvest'
import { buildHarvestDraft, withMerge } from '~/utils/harvestDraft'
import { compareWithAlbum, type AlbumEditorHandle, type CompareGroup, type CompareRow } from '~/utils/harvestAlbumCompare'
import { sameName } from '~/utils/harvestPeople'
import { providerLabel } from '~/utils/linkProviders'

/**
 * The sources of a candidate against what the editor below holds (utils/harvestAlbumCompare): the album of a decided
 * candidate, submitted as an edit of it, or the review draft of an open one (`target="draft"`). It compares the merge of
 * all sources or one source alone (GET …/merged?only=), picked above the rows; 「采用」 writes the value into the editor.
 */
const props = withDefaults(defineProps<{ detail: HarvestCandidateDetail, editor: AlbumEditorHandle, target?: 'album' | 'draft' }>(), { target: 'album' })

const { $api } = useNuxtApp()
const harvestError = useHarvestError()
const { schema, roleName } = useCatalogSchema()
const { localeName, formatDate, formatDuration } = useCatalogDisplay()

const GROUPS: Array<{ key: CompareGroup, label: string }> = [
  { key: 'basic', label: '基本信息' }, { key: 'tracks', label: '曲目' }, { key: 'credits', label: '署名' }, { key: 'links', label: '链接' }, { key: 'images', label: '图片' },
]
const what = computed(() => props.target === 'draft' ? '草稿' : '专辑')

const sourceLabel = (key: string | null | undefined) => key ? props.detail.records.find(record => record.source === key)?.label ?? key : ''
const changedSources = computed(() => new Set(props.detail.records.filter(record => record.changed_at).map(record => record.source)))
/** The sources once each, in priority order. */
const sourceKeys = computed(() => [...new Set(props.detail.records.map(record => record.source))])

/** The source compared, alone; '' for the merge of all. The draft starts as that merge, so it is compared with the first source. */
const picked = ref(props.target === 'draft' && sourceKeys.value.length > 1 ? sourceKeys.value[0]! : '')
const remerges = reactive<Record<string, HarvestRemerge | 'loading' | undefined>>({})
const message = ref('')
watch(picked, async (source) => {
  message.value = ''
  if (!source || remerges[source]) return
  remerges[source] = 'loading'
  try {
    remerges[source] = await $api<HarvestRemerge>(`/v1/admin/harvest/candidates/${props.detail.candidate.id}/merged`, { query: { only: source } })
  } catch (error) {
    remerges[source] = undefined
    message.value = harvestError(error)
  }
}, { immediate: true })
const view = computed(() => {
  if (!picked.value) return props.detail
  const found = remerges[picked.value]
  return typeof found === 'object' ? withMerge(props.detail, found) : null
})

const built = computed(() => view.value ? buildHarvestDraft(view.value) : null)
/** Source draft refs of new artists already added to the editor, so each is created once. */
const created = new Map<string, AggregateRef>()
/** Images stored from here, by sha256. */
const stored = reactive<Record<string, number>>({})

const artistName = (ref: AggregateRef) => {
  if (typeof ref === 'number' || !String(ref).startsWith('@')) {
    const row = props.editor.references.artist?.[String(ref)] ?? view.value?.references.artist?.[String(ref)]
    return String(row?.name ?? `#${ref}`)
  }
  const key = String(ref).slice(1)
  return props.editor.pending[key] ?? String(built.value?.items.find(item => item.ref === key)?.document?.name ?? key)
}
/** A new artist of the source draft, added to the editor's revision; one the editor already creates by that name is used instead. */
const createArtist = (sourceRef: string) => {
  const known = created.get(sourceRef)
  if (known) return known
  const item = built.value?.items.find(row => `@${row.ref}` === sourceRef)
  const name = String(item?.document?.name ?? sourceRef)
  const same = Object.entries(props.editor.pending).find(([, pending]) => sameName(pending, name))
  const ref = same ? `@${same[0]}` : props.editor.createItem('artist', JSON.parse(JSON.stringify(item?.document ?? { name })) as Record<string, unknown>)
  created.set(sourceRef, ref)
  return ref
}
const storeImage = async (url: string) => {
  const image = await $api<CatalogImage>(`/v1/admin/harvest/candidates/${props.detail.candidate.id}/images`, { method: 'POST', body: { url } })
  props.editor.remember('images', image.id, image)
  const sha = view.value?.candidate.merged.images.find(row => row.url === url)?.sha256
  if (sha) stored[sha] = image.id
  return image.id
}

const rows = computed(() => {
  if (!view.value || !built.value) return []
  const merged = view.value.candidate.merged
  return compareWithAlbum({
    album: props.editor.album,
    source: built.value.items[0]!.document as unknown as AlbumDocument,
    sourceItems: built.value.items.slice(1),
    picked: {
      title: merged.title.source, catalog: merged.catalog_numbers.source, barcode: merged.barcode.source,
      price: merged.prices?.[0]?.source ?? null, tracks: merged.tracklist.source, description: merged.descriptions[0]?.source ?? null,
    },
    images: merged.images,
    catalogImages: { ...view.value.catalog_images, ...stored },
    artistName,
    createArtist,
    storeImage,
    roleName,
    localeName,
    providerName: id => providerLabel(schema.value?.link_providers.find(provider => provider.id === id)?.name) || '链接',
    formatDate: (date, precision) => formatDate(date, precision),
    formatDuration: seconds => formatDuration(seconds),
    removeExtra: props.target === 'draft' && !!picked.value,
  })
})
const grouped = computed(() => GROUPS.map(group => ({ ...group, rows: rows.value.filter(row => row.group === group.key) })).filter(group => group.rows.length))

const applying = ref<string | null>(null)
const apply = async (list: CompareRow[]) => {
  if (applying.value) return
  message.value = ''
  try {
    for (const row of list) {
      applying.value = row.key
      await row.apply()
    }
  } catch (error) {
    message.value = harvestError(error)
  } finally {
    applying.value = null
  }
}
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-xs">
    <h3 class="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 font-medium text-slate-900">
      <Icon name="lucide:git-compare" class="size-4 text-slate-400" />来源和{{ what }}的不同
      <span class="text-xs font-normal text-slate-500">{{ rows.length ? `${rows.length} 处` : '' }}</span>
      <span class="ml-auto text-xs font-normal text-slate-500">{{ target === 'draft' ? '「采用」写进下面的草稿' : '「采用」写进下面的编辑器，提交后才改专辑' }}</span>
    </h3>
    <div v-if="sourceKeys.length > 1" class="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
      <span class="mr-1">对照</span>
      <UiButton size="xs" :pressed="picked === ''" @click="picked = ''">全部来源合并</UiButton>
      <UiButton v-for="key in sourceKeys" :key="key" size="xs" :pressed="picked === key" :loading="remerges[key] === 'loading'" @click="picked = key">
        {{ sourceLabel(key) }}<span v-if="changedSources.has(key)" class="rounded bg-sky-50 px-1 text-sky-800">有更新</span>
      </UiButton>
    </div>
    <p v-if="rows.length" class="hidden gap-x-3 px-4 pt-2 text-xs text-slate-400 sm:grid sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)_3.5rem]">
      <span>项目</span><span>{{ target === 'draft' ? '草稿' : '专辑现在' }}</span><span>{{ picked ? sourceLabel(picked) : '来源' }}</span>
    </p>
    <p v-if="message" role="alert" class="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{{ message }}</p>
    <p v-if="!view && !message" class="px-4 py-6 text-center text-xs text-slate-400">正在读取这个来源…</p>
    <p v-else-if="view && !rows.length" class="px-4 py-6 text-center text-xs text-slate-500">{{ picked ? sourceLabel(picked) : '来源' }}说的和编辑器里的{{ what }}没有不同。</p>
    <div v-for="group in grouped" :key="group.key" class="border-b border-slate-100 last:border-b-0">
      <p class="flex items-center gap-2 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600">
        {{ group.label }}<span class="font-normal tabular-nums text-slate-400">{{ group.rows.length }}</span>
        <UiButton v-if="group.rows.length > 1" size="xs" class="ml-auto font-normal" :disabled="!!applying" @click="apply(group.rows)">{{ group.key === 'tracks' && target === 'draft' && picked ? '换成这个来源的曲目表' : '全部采用' }}</UiButton>
      </p>
      <ul class="divide-y divide-slate-100">
        <li v-for="row in group.rows" :key="row.key" class="grid items-start gap-x-3 gap-y-1 px-4 py-2 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <span class="text-xs text-slate-500 sm:pt-0.5">{{ row.label }}</span>
          <p class="min-w-0 break-words text-slate-500">
            <span class="text-xs text-slate-400 sm:hidden">{{ what }}：</span>
            <span v-if="row.album">{{ row.album }}</span><span v-else class="text-slate-300">（没有）</span>
          </p>
          <p class="min-w-0 break-words text-slate-900">
            <span class="text-xs text-slate-400 sm:hidden">来源：</span>{{ row.source }}
            <template v-if="!picked">
              <span v-if="row.from" class="ml-1 whitespace-nowrap text-xs text-slate-500">· {{ sourceLabel(row.from) }}</span>
              <span v-if="row.from && changedSources.has(row.from)" class="ml-1 whitespace-nowrap rounded bg-sky-50 px-1 text-xs text-sky-800">有更新</span>
            </template>
          </p>
          <UiButton size="xs" :loading="applying === row.key" :disabled="!!applying" @click="apply([row])">采用</UiButton>
        </li>
      </ul>
    </div>
  </section>
</template>
