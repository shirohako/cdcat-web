<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'
import type { AggregateRef, AlbumDocument } from '~/types/document'
import type { HarvestCandidateDetail } from '~/types/harvest'
import { buildHarvestDraft } from '~/utils/harvestDraft'
import { compareWithAlbum, type AlbumEditorHandle, type CompareGroup, type CompareRow } from '~/utils/harvestAlbumCompare'
import { providerLabel } from '~/utils/linkProviders'

/**
 * The sources of a decided candidate against its album as the editor below holds it (utils/harvestAlbumCompare):
 * 「采用」 writes a source's value into the editor, which is submitted as an edit of the album.
 */
const props = defineProps<{ detail: HarvestCandidateDetail, editor: AlbumEditorHandle }>()

const { $api } = useNuxtApp()
const harvestError = useHarvestError()
const { schema, roleName } = useCatalogSchema()
const { localeName, formatDate, formatDuration } = useCatalogDisplay()

const GROUPS: Array<{ key: CompareGroup, label: string }> = [
  { key: 'basic', label: '基本信息' }, { key: 'tracks', label: '曲目' }, { key: 'credits', label: '署名' }, { key: 'links', label: '链接' }, { key: 'images', label: '图片' },
]

const built = computed(() => buildHarvestDraft(props.detail))
const source = computed(() => built.value.items[0]!.document as unknown as AlbumDocument)
const sourceItems = computed(() => built.value.items.slice(1))
/** Source draft refs of new artists already added to the editor, so each is created once. */
const created = new Map<string, AggregateRef>()
const catalogImages = reactive<Record<string, number>>({ ...props.detail.catalog_images })

const sourceLabel = (key: string | null | undefined) => key ? props.detail.records.find(record => record.source === key)?.label ?? key : ''
const changedSources = computed(() => new Set(props.detail.records.filter(record => record.changed_at).map(record => record.source)))

const artistName = (ref: AggregateRef) => {
  if (typeof ref === 'number' || !String(ref).startsWith('@')) {
    const row = props.editor.references.artist?.[String(ref)] ?? props.detail.references.artist?.[String(ref)]
    return String(row?.name ?? `#${ref}`)
  }
  const key = String(ref).slice(1)
  return props.editor.pending[key] ?? String(sourceItems.value.find(item => item.ref === key)?.document?.name ?? key)
}
const createArtist = (sourceRef: string) => {
  const known = created.get(sourceRef)
  if (known) return known
  const item = sourceItems.value.find(row => `@${row.ref}` === sourceRef)
  const ref = props.editor.createItem('artist', JSON.parse(JSON.stringify(item?.document ?? { name: sourceRef })) as Record<string, unknown>)
  created.set(sourceRef, ref)
  return ref
}
const storeImage = async (url: string) => {
  const image = await $api<CatalogImage>(`/v1/admin/harvest/candidates/${props.detail.candidate.id}/images`, { method: 'POST', body: { url } })
  props.editor.remember('images', image.id, image)
  const sha = props.detail.candidate.merged.images.find(row => row.url === url)?.sha256
  if (sha) catalogImages[sha] = image.id
  return image.id
}

const merged = computed(() => props.detail.candidate.merged)
const rows = computed(() => compareWithAlbum({
  album: props.editor.album,
  source: source.value,
  sourceItems: sourceItems.value,
  picked: {
    title: merged.value.title.source, catalog: merged.value.catalog_numbers.source, barcode: merged.value.barcode.source,
    price: merged.value.price.source, tracks: merged.value.tracklist.source, description: merged.value.descriptions[0]?.source ?? null,
  },
  images: merged.value.images,
  catalogImages,
  artistName,
  createArtist,
  storeImage,
  roleName,
  localeName,
  providerName: id => providerLabel(schema.value?.link_providers.find(provider => provider.id === id)?.name) || '链接',
  formatDate: (date, precision) => formatDate(date, precision),
  formatDuration: seconds => formatDuration(seconds),
}))
const grouped = computed(() => GROUPS.map(group => ({ ...group, rows: rows.value.filter(row => row.group === group.key) })).filter(group => group.rows.length))

const applying = ref<string | null>(null)
const message = ref('')
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
      <Icon name="lucide:git-compare" class="size-4 text-slate-400" />来源和专辑的不同
      <span class="text-xs font-normal text-slate-500">{{ rows.length ? `${rows.length} 处` : '' }}</span>
      <span class="ml-auto text-xs font-normal text-slate-500">「采用」写进下面的编辑器，提交后才改专辑</span>
    </h3>
    <p v-if="rows.length" class="hidden gap-x-3 px-4 pt-2 text-xs text-slate-400 sm:grid sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)_3.5rem]">
      <span>项目</span><span>专辑现在</span><span>来源</span>
    </p>
    <p v-if="message" role="alert" class="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{{ message }}</p>
    <p v-if="!rows.length" class="px-4 py-6 text-center text-xs text-slate-500">来源说的和编辑器里的专辑没有不同。</p>
    <div v-for="group in grouped" :key="group.key" class="border-b border-slate-100 last:border-b-0">
      <p class="flex items-center gap-2 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600">
        {{ group.label }}<span class="font-normal tabular-nums text-slate-400">{{ group.rows.length }}</span>
        <UiButton v-if="group.rows.length > 1" size="xs" class="ml-auto font-normal" :disabled="!!applying" @click="apply(group.rows)">全部采用</UiButton>
      </p>
      <ul class="divide-y divide-slate-100">
        <li v-for="row in group.rows" :key="row.key" class="grid items-start gap-x-3 gap-y-1 px-4 py-2 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <span class="text-xs text-slate-500 sm:pt-0.5">{{ row.label }}</span>
          <p class="min-w-0 break-words text-slate-500">
            <span class="text-xs text-slate-400 sm:hidden">专辑：</span>
            <span v-if="row.album">{{ row.album }}</span><span v-else class="text-slate-300">（没有）</span>
          </p>
          <p class="min-w-0 break-words text-slate-900">
            <span class="text-xs text-slate-400 sm:hidden">来源：</span>{{ row.source }}
            <span v-if="row.from" class="ml-1 whitespace-nowrap text-xs text-slate-500">· {{ sourceLabel(row.from) }}</span>
            <span v-if="row.from && changedSources.has(row.from)" class="ml-1 whitespace-nowrap rounded bg-sky-50 px-1 text-xs text-sky-800">有更新</span>
          </p>
          <UiButton size="xs" :loading="applying === row.key" :disabled="!!applying" @click="apply([row])">采用</UiButton>
        </li>
      </ul>
    </div>
  </section>
</template>
