<script setup lang="ts">
import { ArrowDown, ArrowUp, Trash2 } from '@lucide/vue'
import type { EditableLink } from '~/components/revision/LinksEditor.vue'
import type { PickedItem } from '~/components/revision/ContentPicker.vue'
import {
  DATE_PRECISIONS, ENTRY_FORMATS, ENTRY_RELATIONS, ENTRY_TYPES, ENTRY_WORK_RELATIONS,
  type DatePrecision, type EntryDetail, type EntryRelation, type EntrySchema, type EntryType, type EntryWorkRelation, type Title,
} from '~/types/entry'

interface WorkRow { id: number, relation_type: EntryWorkRelation, character_name: string, episode: string, note: string }
interface RelationRow { id: number, relation_type: EntryRelation, note: string }

const props = defineProps<{
  /** Revision schema (edit) or a Bangumi preview payload (create). */
  initialData?: EntrySchema | Record<string, unknown> | null
  entryId?: string | number
  // Where to go after a successful submit; a function receives the new revision id.
  redirectTo?: string | ((revisionId: number) => string)
}>()

const { $api } = useNuxtApp()
const { t } = useI18n()
const { typeLabel, formatLabel, relationLabel, workRelationLabel } = useEntryDisplay()

const isEditMode = computed(() => props.entryId !== undefined && props.entryId !== '')

const tabs = computed(() => [
  { id: 'basic', label: t('catalog.form.tab_basic'), icon: 'lucide:tag' },
  { id: 'relations', label: t('catalog.form.tab_relations'), icon: 'lucide:link-2' },
  { id: 'links', label: t('catalog.form.tab_links'), icon: 'lucide:globe' },
  { id: 'meta', label: t('catalog.form.tab_meta'), icon: 'lucide:code' },
])
const currentTab = ref('basic')

const form = reactive({
  titles: [] as Title[],
  slug: '',
  type: 'anime' as EntryType,
  format: '' as string,
  platforms: '',
  release_date: '',
  release_date_precision: 'day' as DatePrecision,
  episodes: '' as string | number,
  description: '',
  image_url: '',
  banner_url: '',
  links: [] as EditableLink[],
  works: [] as WorkRow[],
  relations: [] as RelationRow[],
})
const metaText = ref('{}')
const metaError = ref('')
const errors = reactive<{ titles?: string }>({})
const original = ref<string>()

// Names of linked works and entries; the schema only carries ids.
const labels = reactive<Record<string, { label: string, image_url: string | null }>>({})
const labelOf = (kind: 'work' | 'entry', id: number) => labels[`${kind}:${id}`]

const formats = computed(() => ENTRY_FORMATS[form.type] || [])
const hasPlatforms = computed(() => form.type === 'game')
const hasEpisodes = computed(() => form.type === 'anime' || form.type === 'tv')

watch(() => form.type, () => {
  if (form.format && !formats.value.includes(form.format)) form.format = ''
})

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
    type: form.type,
    format: form.format || null,
    platforms: hasPlatforms.value ? form.platforms.split(',').map(item => item.trim()).filter(Boolean) : null,
    release_date: form.release_date || null,
    release_date_precision: form.release_date_precision,
    episodes: hasEpisodes.value && form.episodes !== '' ? Number(form.episodes) : null,
    description: form.description.trim() || null,
    image_url: form.image_url.trim() || null,
    banner_url: form.banner_url.trim() || null,
    meta: meta && Object.keys(meta).length ? meta : null,
    links: form.links
      .filter(link => link.link_provider_id !== '' && link.url.trim())
      .map(link => ({ ...(link.id ? { id: link.id } : {}), link_provider_id: Number(link.link_provider_id), url: link.url.trim(), ...(link.meta ? { meta: link.meta } : {}) })),
    related_works: form.works.map(row => ({
      id: row.id,
      relation_type: row.relation_type,
      character_name: row.character_name.trim() || null,
      episode: row.episode === '' ? null : Number(row.episode),
      note: row.note.trim() || null,
    })),
    related_entries: form.relations.map(row => ({ id: row.id, relation_type: row.relation_type, note: row.note.trim() || null })),
  }
})

const init = (data: EntrySchema) => {
  form.titles = data.titles?.length
    ? data.titles.map(title => ({ title: title.title || '', locale: title.locale ?? null, kind: title.kind || 'official', is_primary: !!title.is_primary }))
    : data.name ? [{ title: data.name, locale: null, kind: 'official', is_primary: true }] : []
  form.slug = data.slug || ''
  form.type = (ENTRY_TYPES as readonly string[]).includes(data.type || '') ? data.type as EntryType : 'other'
  form.format = data.format || ''
  form.platforms = Array.isArray(data.platforms) ? data.platforms.join(', ') : ''
  form.release_date = data.release_date || ''
  form.release_date_precision = data.release_date_precision || 'day'
  form.episodes = data.episodes ?? ''
  form.description = data.description || ''
  form.image_url = data.image_url || ''
  form.banner_url = data.banner_url || ''
  metaText.value = JSON.stringify(data.meta || {}, null, 2)
  form.links = (data.links || []).map(link => ({ id: link.id, link_provider_id: link.link_provider_id ?? '', url: link.url || '', meta: link.meta ?? null }))
  form.works = (data.related_works || []).map(row => ({
    id: Number(row.id), relation_type: row.relation_type || 'other', character_name: row.character_name || '', episode: row.episode == null ? '' : String(row.episode), note: row.note || '',
  }))
  form.relations = (data.related_entries || []).map(row => ({ id: Number(row.id), relation_type: row.relation_type || 'related', note: row.note || '' }))
  if (isEditMode.value) original.value = JSON.stringify(payload.value, null, 2)
}

const baselineChecksum = computed(() => (props.initialData as EntrySchema | null | undefined)?.baseline_checksum)

watch(() => props.initialData, (data) => {
  if (data && Object.keys(data).length) init(data as EntrySchema)
}, { immediate: true })

onMounted(async () => {
  if (!isEditMode.value) return
  try {
    const entry = await $api<EntryDetail>(`/v1/entries/${props.entryId}`)
    for (const work of entry.works) labels[`work:${work.id}`] = { label: work.title, image_url: work.image_url }
    for (const related of entry.related_entries) labels[`entry:${related.id}`] = { label: related.name, image_url: related.image_url }
  } catch {
    // Rows still show their ids.
  }
})

const addWork = (item: PickedItem) => {
  labels[`work:${item.id}`] = { label: item.label, image_url: item.image_url }
  form.works.push({ id: item.id, relation_type: 'ost', character_name: '', episode: '', note: '' })
}
const addRelation = (item: PickedItem) => {
  labels[`entry:${item.id}`] = { label: item.label, image_url: item.image_url }
  form.relations.push({ id: item.id, relation_type: 'related', note: '' })
}
function move<T>(list: T[], index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item!)
}

const selfId = computed(() => Number(props.entryId) || 0)
const excludedEntries = computed(() => [selfId.value])
const excludedWorks = computed(() => form.works.map(row => row.id))

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

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.type') }} <span class="text-error">*</span></span>
          <select v-model="form.type" class="select select-bordered w-full">
            <option v-for="type in ENTRY_TYPES" :key="type" :value="type">{{ typeLabel(type) }}</option>
          </select>
        </label>
        <label v-if="formats.length" class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.format') }}</span>
          <select v-model="form.format" class="select select-bordered w-full">
            <option value="">{{ $t('catalog.form.format_none') }}</option>
            <option v-for="format in formats" :key="format" :value="format">{{ formatLabel(format) }}</option>
          </select>
        </label>
        <label v-if="hasEpisodes" class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.episodes') }}</span>
          <input v-model="form.episodes" type="number" min="0" class="input input-bordered w-full" >
        </label>
        <label v-if="hasPlatforms" class="form-control md:col-span-2">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.platforms') }}</span>
          <input v-model="form.platforms" type="text" class="input input-bordered w-full" :placeholder="$t('catalog.form.platforms_hint')" >
        </label>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.release_date') }}</span>
          <input v-model="form.release_date" type="date" class="input input-bordered w-full" >
        </label>
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.precision') }}</span>
          <select v-model="form.release_date_precision" class="select select-bordered w-full">
            <option v-for="precision in DATE_PRECISIONS" :key="precision" :value="precision">{{ $t(`catalog.precision.${precision}`) }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.slug') }}</span>
          <input v-model="form.slug" type="text" class="input input-bordered w-full" placeholder="final-fantasy-vii" >
        </label>
      </div>
      <p class="-mt-3 text-xs text-gray-500">{{ $t('catalog.form.precision_hint') }} {{ $t('catalog.form.slug_hint') }}</p>

      <label class="form-control">
        <span class="label-text mb-1 font-medium">{{ $t('catalog.form.description') }}</span>
        <textarea v-model="form.description" rows="5" class="textarea textarea-bordered w-full" />
      </label>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.image_url') }}</span>
          <input v-model="form.image_url" type="url" class="input input-bordered w-full" placeholder="https://" >
          <img v-if="form.image_url" :src="form.image_url" alt="" class="mt-2 h-36 w-24 rounded-lg border border-gray-200 object-cover" >
        </label>
        <label class="form-control">
          <span class="label-text mb-1 font-medium">{{ $t('catalog.form.banner_url') }}</span>
          <input v-model="form.banner_url" type="url" class="input input-bordered w-full" placeholder="https://" >
          <img v-if="form.banner_url" :src="form.banner_url" alt="" class="mt-2 h-24 w-full rounded-lg border border-gray-200 object-cover" >
        </label>
      </div>
    </div>

    <!-- 关联 -->
    <div v-show="currentTab === 'relations'" class="space-y-8">
      <section class="space-y-3">
        <div>
          <h3 class="font-medium text-gray-900">{{ $t('catalog.form.related_works') }}</h3>
          <p class="text-xs text-gray-500">{{ $t('catalog.form.related_works_hint') }}</p>
        </div>
        <RevisionContentPicker kind="work" :exclude="excludedWorks" :placeholder="$t('catalog.form.search_work')" @select="addWork" />
        <div v-for="(row, index) in form.works" :key="`work-${row.id}`" class="rounded-lg border border-gray-200 p-3">
          <div class="flex items-center gap-3">
            <img v-if="labelOf('work', row.id)?.image_url" :src="labelOf('work', row.id)!.image_url!" alt="" class="h-10 w-10 rounded object-cover" >
            <NuxtLink :to="`/works/${row.id}`" target="_blank" class="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary">
              {{ labelOf('work', row.id)?.label || $t('catalog.form.unknown_item', { id: row.id }) }}
            </NuxtLink>
            <button type="button" class="btn btn-ghost btn-xs text-gray-400 hover:text-error" :aria-label="$t('catalog.form.remove')" @click="form.works.splice(index, 1)">
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
          <div class="mt-2 grid grid-cols-1 gap-2 md:grid-cols-4">
            <select v-model="row.relation_type" class="select select-bordered select-sm w-full" :aria-label="$t('catalog.form.relation_type')">
              <option v-for="relation in ENTRY_WORK_RELATIONS" :key="relation" :value="relation">{{ workRelationLabel(relation) }}</option>
            </select>
            <input v-model="row.character_name" type="text" class="input input-bordered input-sm w-full" :placeholder="$t('catalog.form.character_name')" >
            <input v-model="row.episode" type="number" min="0" class="input input-bordered input-sm w-full" :placeholder="$t('catalog.form.episode')" >
            <input v-model="row.note" type="text" class="input input-bordered input-sm w-full" :placeholder="$t('catalog.form.note')" >
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <div>
          <h3 class="font-medium text-gray-900">{{ $t('catalog.form.related_entries') }}</h3>
          <p class="text-xs text-gray-500">{{ $t('catalog.form.related_entries_hint') }}</p>
        </div>
        <RevisionContentPicker kind="entry" :exclude="excludedEntries" :placeholder="$t('catalog.form.search_entry')" @select="addRelation" />
        <div
          v-for="(row, index) in form.relations"
          :key="`entry-${index}`"
          class="grid grid-cols-1 items-center gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_11rem_1fr_auto_auto]"
        >
          <NuxtLink :to="`/entries/${row.id}`" target="_blank" class="truncate text-sm font-medium hover:text-primary">
            {{ labelOf('entry', row.id)?.label || $t('catalog.form.unknown_item', { id: row.id }) }}
          </NuxtLink>
          <select v-model="row.relation_type" class="select select-bordered select-sm w-full" :aria-label="$t('catalog.form.relation_type')">
            <option v-for="relation in ENTRY_RELATIONS" :key="relation" :value="relation">{{ relationLabel(relation) }}</option>
          </select>
          <input v-model="row.note" type="text" class="input input-bordered input-sm w-full" :placeholder="$t('catalog.form.note')" >
          <div class="flex">
            <button type="button" class="btn btn-ghost btn-xs" :aria-label="$t('catalog.form.move_up')" @click="move(form.relations, index, -1)"><ArrowUp class="h-4 w-4" /></button>
            <button type="button" class="btn btn-ghost btn-xs" :aria-label="$t('catalog.form.move_down')" @click="move(form.relations, index, 1)"><ArrowDown class="h-4 w-4" /></button>
          </div>
          <button type="button" class="btn btn-ghost btn-xs text-gray-400 hover:text-error" :aria-label="$t('catalog.form.remove')" @click="form.relations.splice(index, 1)">
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>

    <!-- 外部链接 -->
    <div v-show="currentTab === 'links'">
      <RevisionLinksEditor v-model="form.links" />
    </div>

    <!-- 元数据 -->
    <div v-show="currentTab === 'meta'" class="space-y-2">
      <p class="text-sm text-gray-500">{{ $t('catalog.form.meta_hint') }}</p>
      <textarea v-model="metaText" rows="14" spellcheck="false" class="textarea textarea-bordered w-full bg-gray-50 font-mono text-sm" />
      <p v-if="metaError" class="text-sm text-error">{{ metaError }}</p>
    </div>

    <RevisionSubmitFlow
      :payload="payload"
      resource-type="entry"
      :resource-id="entryId"
      :baseline-checksum="baselineChecksum"
      :original="original"
      :validate="validate"
      :redirect-to="redirectTo"
      success-type="entry"
    />
  </div>
</template>
