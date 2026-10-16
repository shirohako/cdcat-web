<script setup lang="ts">
import { ArrowDown, ArrowUp, Check, Trash2, X } from '@lucide/vue'
import type { EditableLink } from '~/components/revision/LinksEditor.vue'
import type { PickedItem } from '~/components/revision/ContentPicker.vue'
import type { FranchiseDetail, FranchiseSchema, Title } from '~/types/entry'

interface Member { id: number }

const props = defineProps<{
  initialData?: FranchiseSchema | Record<string, unknown> | null
  seriesId?: string | number
  // Where to go after a successful submit; a function receives the new revision id.
  redirectTo?: string | ((revisionId: number) => string)
}>()

const { $api } = useNuxtApp()
const { t } = useI18n()

const isEditMode = computed(() => props.seriesId !== undefined && props.seriesId !== '')

const tabs = computed(() => [
  { id: 'basic', label: t('catalog.form.tab_basic'), icon: 'lucide:tag' },
  { id: 'entries', label: t('catalog.form.tab_entries'), icon: 'lucide:film' },
  { id: 'works', label: t('catalog.form.tab_works'), icon: 'lucide:disc-3' },
  { id: 'links', label: t('catalog.form.tab_links'), icon: 'lucide:globe' },
  { id: 'meta', label: t('catalog.form.tab_meta'), icon: 'lucide:code' },
  ...(isEditMode.value ? [{ id: 'json', label: t('catalog.form.tab_json'), icon: 'lucide:braces' }] : []),
])
const currentTab = ref('basic')

const form = reactive({
  titles: [] as Title[],
  slug: '',
  parent_id: null as number | null,
  description: '',
  image_url: '',
  banner_url: '',
  sort_order: 0 as number | string,
  links: [] as EditableLink[],
  entries: [] as Member[],
  works: [] as Member[],
})
const metaText = ref('{}')
const metaError = ref('')
const errors = reactive<{ titles?: string }>({})
const original = ref<string>()

const labels = reactive<Record<string, { label: string, subtitle?: string, image_url: string | null }>>({})
const labelOf = (kind: 'entry' | 'work' | 'franchise', id: number) => labels[`${kind}:${id}`]

const parseMeta = (): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(metaText.value || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

const payload = computed(() => {
  const meta = parseMeta()
  return {
    titles: form.titles
      .filter(title => title.title.trim())
      .map(title => ({ title: title.title.trim(), locale: title.locale || null, kind: title.kind, is_primary: title.is_primary })),
    slug: form.slug.trim() || null,
    parent_id: form.parent_id,
    description: form.description.trim() || null,
    image_url: form.image_url.trim() || null,
    banner_url: form.banner_url.trim() || null,
    sort_order: Number(form.sort_order) || 0,
    meta: meta && Object.keys(meta).length ? meta : null,
    links: form.links
      .filter(link => link.link_provider_id !== '' && link.url.trim())
      .map(link => ({ ...(link.id ? { id: link.id } : {}), link_provider_id: Number(link.link_provider_id), url: link.url.trim(), ...(link.meta ? { meta: link.meta } : {}) })),
    related_entries: form.entries.map((member, index) => ({ id: member.id, sort_order: index })),
    related_works: form.works.map((member, index) => ({ id: member.id, sort_order: index })),
  }
})

const byOrder = (items: Array<{ id: number | string, sort_order?: number }> = []) =>
  [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(item => ({ id: Number(item.id) }))

const init = (data: FranchiseSchema) => {
  form.titles = data.titles?.length
    ? data.titles.map((title): Title => ({ title: title.title || '', locale: title.locale ?? null, kind: title.kind || 'official', is_primary: !!title.is_primary }))
    : data.name ? [{ title: data.name, locale: null, kind: 'official', is_primary: true }] : []
  form.slug = data.slug || ''
  form.parent_id = data.parent_id ? Number(data.parent_id) : null
  form.description = data.description || ''
  form.image_url = data.image_url || ''
  form.banner_url = data.banner_url || ''
  form.sort_order = data.sort_order ?? 0
  metaText.value = JSON.stringify(data.meta || {}, null, 2)
  form.links = (data.links || []).map(link => ({ id: link.id, link_provider_id: link.link_provider_id ?? '', url: link.url || '', meta: link.meta ?? null }))
  form.entries = byOrder(data.related_entries)
  form.works = byOrder(data.related_works)
}

const baselineChecksum = computed(() => (props.initialData as FranchiseSchema | null | undefined)?.baseline_checksum)

watch(() => props.initialData, (data) => {
  if (data && Object.keys(data).length) {
    init(data as FranchiseSchema)
    if (isEditMode.value) original.value = JSON.stringify(payload.value, null, 2)
  }
}, { immediate: true })

onMounted(async () => {
  if (!isEditMode.value) return
  try {
    const series = await $api<FranchiseDetail>(`/v1/franchises/${props.seriesId}`)
    for (const entry of series.entries) labels[`entry:${entry.id}`] = { label: entry.name, image_url: entry.image_url }
    for (const work of series.works) labels[`work:${work.id}`] = { label: work.title, image_url: work.image_url }
    if (series.parent) labels[`franchise:${series.parent.id}`] = { label: series.parent.name, image_url: null }
  } catch {
    // Rows still show their ids.
  }
})

// Looks the list up on each call: init() replaces form.entries / form.works.
const addMember = (field: 'entries' | 'works', kind: 'entry' | 'work') => (item: PickedItem) => {
  labels[`${kind}:${item.id}`] = { label: item.label, subtitle: item.subtitle, image_url: item.image_url }
  form[field].push({ id: item.id })
}
const addEntry = addMember('entries', 'entry')
const addWork = addMember('works', 'work')
const setParent = (item: PickedItem) => {
  labels[`franchise:${item.id}`] = { label: item.label, image_url: item.image_url }
  form.parent_id = item.id
}
const move = (list: Member[], index: number, offset: number) => {
  const target = index + offset
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item!)
}

const selfId = computed(() => Number(props.seriesId) || 0)

// JSON tab (edit mode): edit the payload directly and apply it back to the form.
const jsonText = ref('')
const jsonState = ref<{ ok: boolean, message: string } | null>(null)
watch(currentTab, (tab) => {
  if (tab === 'json') {
    jsonText.value = JSON.stringify(payload.value, null, 2)
    jsonState.value = null
  }
})
const applyJson = () => {
  try {
    init(JSON.parse(jsonText.value) as FranchiseSchema)
    jsonState.value = { ok: true, message: t('catalog.form.json_applied') }
  } catch {
    jsonState.value = { ok: false, message: t('revision_entry.json_error') }
  }
}

const validate = () => {
  errors.titles = undefined
  metaError.value = ''
  const titles = payload.value.titles
  if (!titles.length) {
    errors.titles = t('catalog.form.title_required')
  } else if (titles.filter(title => title.is_primary).length !== 1) {
    errors.titles = t('catalog.form.primary_required')
  }
  if (errors.titles) {
    currentTab.value = 'basic'
    return false
  }
  if (!parseMeta()) {
    metaError.value = t('revision_entry.meta_object')
    currentTab.value = 'meta'
    return false
  }
  return true
}
</script>

<template>
  <div class="space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
    <RevisionSeriesCreateTabs v-model="currentTab" :tabs="tabs" />

    <!-- 基础信息 -->
    <div v-show="currentTab === 'basic'" class="space-y-6">
      <RevisionTitlesEditor v-model="form.titles" :error="errors.titles" />

      <div class="space-y-2">
        <span class="label-text font-medium">{{ $t('catalog.form.parent') }}</span>
        <div v-if="form.parent_id" class="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <NuxtLink :to="`/series/${form.parent_id}`" target="_blank" class="flex-1 truncate text-sm font-medium hover:text-primary">
            {{ labelOf('franchise', form.parent_id)?.label || $t('catalog.form.unknown_item', { id: form.parent_id }) }}
          </NuxtLink>
          <button type="button" class="btn btn-ghost btn-xs text-gray-400 hover:text-error" :aria-label="$t('catalog.form.remove')" @click="form.parent_id = null">
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
        <RevisionContentPicker
          v-else
          kind="franchise"
          :exclude="[selfId]"
          :extra-query="{ top_level: 1 }"
          :placeholder="`${$t('catalog.form.search_series')} · ${$t('catalog.form.no_parent')}`"
          @select="setParent"
        />
        <p class="text-xs text-gray-500">{{ $t('catalog.form.parent_hint') }}</p>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.slug') }}</span>
          <input v-model="form.slug" type="text" class="input input-bordered w-full" placeholder="final-fantasy" >
          <span class="mt-1 text-xs text-gray-500">{{ $t('catalog.form.slug_hint') }}</span>
        </label>
        <label v-if="form.parent_id" class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.sort_order') }}</span>
          <input v-model="form.sort_order" type="number" min="0" class="input input-bordered w-full" >
        </label>
      </div>

      <label class="form-control">
        <span class="label-text mb-1 font-medium">{{ $t('catalog.form.description') }}</span>
        <textarea v-model="form.description" rows="5" class="textarea textarea-bordered w-full" />
      </label>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.image_url') }}</span>
          <input v-model="form.image_url" type="url" class="input input-bordered w-full" placeholder="https://" >
          <img v-if="form.image_url" :src="form.image_url" alt="" class="mt-2 h-24 w-40 rounded-lg border border-gray-200 object-cover" >
        </label>
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.banner_url') }}</span>
          <input v-model="form.banner_url" type="url" class="input input-bordered w-full" placeholder="https://" >
          <img v-if="form.banner_url" :src="form.banner_url" alt="" class="mt-2 h-24 w-full rounded-lg border border-gray-200 object-cover" >
        </label>
      </div>
    </div>

    <!-- 条目 / 系列整体作品 -->
    <div
      v-for="section in [
        { id: 'entries', kind: 'entry' as const, list: form.entries, add: addEntry, hint: $t('catalog.form.series_entries_hint'), placeholder: $t('catalog.form.search_entry'), path: '/entries' },
        { id: 'works', kind: 'work' as const, list: form.works, add: addWork, hint: $t('catalog.form.series_works_hint'), placeholder: $t('catalog.form.search_work'), path: '/works' },
      ]"
      v-show="currentTab === section.id"
      :key="section.id"
      class="space-y-3"
    >
      <p class="text-sm text-gray-500">{{ section.hint }}</p>
      <RevisionContentPicker :kind="section.kind" :exclude="section.list.map(member => member.id)" :placeholder="section.placeholder" @select="section.add" />
      <ol class="space-y-2">
        <li v-for="(member, index) in section.list" :key="member.id" class="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5">
          <span class="w-6 text-center text-xs text-gray-400">{{ index + 1 }}</span>
          <img v-if="labelOf(section.kind, member.id)?.image_url" :src="labelOf(section.kind, member.id)!.image_url!" alt="" class="h-10 w-10 rounded object-cover" >
          <span v-else class="h-10 w-10 rounded bg-gray-100" />
          <span class="min-w-0 flex-1">
            <NuxtLink :to="`${section.path}/${member.id}`" target="_blank" class="block truncate text-sm font-medium hover:text-primary">
              {{ labelOf(section.kind, member.id)?.label || $t('catalog.form.unknown_item', { id: member.id }) }}
            </NuxtLink>
            <span v-if="labelOf(section.kind, member.id)?.subtitle" class="block truncate text-xs text-gray-500">{{ labelOf(section.kind, member.id)?.subtitle }}</span>
          </span>
          <button type="button" class="btn btn-ghost btn-xs" :disabled="index === 0" :aria-label="$t('catalog.form.move_up')" @click="move(section.list, index, -1)"><ArrowUp class="h-4 w-4" /></button>
          <button type="button" class="btn btn-ghost btn-xs" :disabled="index === section.list.length - 1" :aria-label="$t('catalog.form.move_down')" @click="move(section.list, index, 1)"><ArrowDown class="h-4 w-4" /></button>
          <button type="button" class="btn btn-ghost btn-xs text-gray-400 hover:text-error" :aria-label="$t('catalog.form.remove')" @click="section.list.splice(index, 1)"><Trash2 class="h-4 w-4" /></button>
        </li>
      </ol>
    </div>

    <!-- 外部链接 -->
    <div v-show="currentTab === 'links'">
      <RevisionLinksEditor v-model="form.links" />
    </div>

    <!-- 元数据 -->
    <div v-show="currentTab === 'meta'" class="space-y-2">
      <p class="text-sm text-gray-500">{{ $t('catalog.form.meta_hint') }}</p>
      <textarea v-model="metaText" rows="12" spellcheck="false" class="textarea textarea-bordered w-full bg-gray-50 font-mono text-sm" />
      <p v-if="metaError" class="text-sm text-error">{{ metaError }}</p>
    </div>

    <!-- JSON（仅编辑模式） -->
    <div v-if="isEditMode" v-show="currentTab === 'json'" class="space-y-3">
      <p class="text-sm text-gray-500">{{ $t('catalog.form.json_hint') }}</p>
      <textarea v-model="jsonText" rows="20" spellcheck="false" class="textarea textarea-bordered w-full bg-gray-50 font-mono text-xs" />
      <div class="flex flex-wrap items-center gap-3">
        <button type="button" class="btn btn-sm btn-primary" @click="applyJson">{{ $t('catalog.form.apply_json') }}</button>
        <span v-if="jsonState" class="flex items-center gap-1 text-sm" :class="jsonState.ok ? 'text-green-600' : 'text-red-600'">
          <Check v-if="jsonState.ok" class="h-4 w-4" />
          <X v-else class="h-4 w-4" />
          {{ jsonState.message }}
        </span>
      </div>
    </div>

    <RevisionSubmitFlow
      :payload="payload"
      resource-type="franchise"
      :resource-id="seriesId"
      :baseline-checksum="baselineChecksum"
      :original="original"
      :validate="validate"
      :redirect-to="redirectTo"
      success-type="series"
    />
  </div>
</template>
