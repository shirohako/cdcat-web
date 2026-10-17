<template>
  <div v-if="track" class="space-y-3">
    <div>
      <p class="mb-1 text-xs font-semibold text-gray-600">{{ $t('editor.work.song') }}</p>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span v-if="track.work_id === null" class="text-gray-500">{{ $t('editor.work.auto') }}</span>
        <template v-else>
          <EditorRefLabel :id="track.work_id" type="work" :references="references" :pending="editor.pending.value" />
          <span v-if="recordings > 1" class="text-xs text-gray-400">{{ $t('editor.work.recordings', { count: recordings }) }}</span>
          <button v-if="recordings > 1" type="button" class="btn btn-ghost btn-xs" @click="separate">{{ $t('editor.work.separate') }}</button>
        </template>
        <button type="button" class="btn btn-ghost btn-xs" @click="picking = !picking">{{ $t('editor.work.link_other') }}</button>
      </div>
      <EditorEntityPicker v-if="picking" kind="work" class="mt-2 max-w-md" :placeholder="$t('editor.work.search')" :exclude="[track.work_id]" @select="link" />
      <p class="mt-1 text-[11px] text-gray-400">{{ $t('editor.work.hint') }}</p>
    </div>

    <div v-if="candidates.length" class="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
      <p class="mb-1.5 text-xs font-semibold text-amber-800">{{ $t('editor.work.suggestions') }}</p>
      <ul class="space-y-1.5">
        <li v-for="candidate in candidates" :key="candidate.work_id" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <NuxtLink :to="`/works/${candidate.work_id}`" target="_blank" class="font-medium text-gray-800 hover:underline">{{ candidate.title }}</NuxtLink>
          <span class="min-w-0 truncate text-gray-500">{{ $t('editor.work.on_albums', { count: candidate.tracks_count, albums: candidate.albums.map(item => item.title).join(' / ') }) }}</span>
          <span class="ml-auto flex gap-1">
            <button type="button" class="btn btn-xs" @click="link({ id: candidate.work_id, label: candidate.title, subtitle: '', image_url: null }, candidate.tracks_count)">{{ $t('editor.work.same_song') }}</button>
            <button type="button" class="btn btn-ghost btn-xs" @click="dismiss(candidate.work_id)">{{ $t('editor.work.not_same') }}</button>
          </span>
        </li>
      </ul>
    </div>

    <div>
      <p class="mb-1 text-xs font-semibold text-gray-600">{{ $t('editor.work.originals') }}</p>
      <p v-if="loading" class="mb-2 text-xs text-gray-400">{{ $t('common.loading') }}</p>
      <ul v-else-if="originals.length" class="mb-2 space-y-1.5">
        <li v-for="row in originals" :key="row.id" class="flex flex-wrap items-center gap-2 text-sm">
          <select :value="row.relation_type" class="select select-sm h-8 w-36 text-xs" @change="setRelation(row.id, ($event.target as HTMLSelectElement).value)">
            <option v-for="value in ORIGIN_RELATIONS" :key="value" :value="value">{{ enumLabel('work_relation', value) }}</option>
          </select>
          <EditorRefLabel :id="row.related_work_id" type="work" :references="references" :pending="editor.pending.value" class="min-w-0 flex-1" />
          <button type="button" class="btn btn-ghost btn-xs px-1.5" :aria-label="$t('common.delete')" @click="removeOriginal(row.id)"><X :size="12" /></button>
        </li>
      </ul>
      <div class="flex flex-wrap items-center gap-2">
        <select v-model="relation" class="select select-sm h-8 w-36 text-xs" :aria-label="$t('catalog.field.relation_type')">
          <option v-for="value in ORIGIN_RELATIONS" :key="value" :value="value">{{ enumLabel('work_relation', value) }}</option>
        </select>
        <EditorEntityPicker
          kind="work"
          allow-create
          class="min-w-56 flex-1"
          :placeholder="$t('editor.work.search_original')"
          :exclude="[track.work_id, ...originals.map(row => row.related_work_id)]"
          @select="pickOriginal"
          @create="createOriginal"
        />
      </div>
      <p class="mt-1 text-[11px] text-gray-400">{{ $t('editor.work.originals_hint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PickedEntity } from '~/components/editor/EntityPicker.vue'
import type { AggregateRef, RowId, WorkDocument } from '~/types/document'
import type { WorkSuggestion } from '~/types/work'
import { X } from '@lucide/vue'
import { ORIGIN_RELATIONS } from '~/types/work'
import { findTrack } from '~/utils/albumDocument'
import { newKey } from '~/utils/documentKeys'
import { sameId } from '~/utils/documentRows'

/**
 * The song (work) a track records, candidates for the same song, and its 原曲: works it arranges,
 * covers, remixes or quotes. Originals are relations of the track's work, so a new track gets a
 * new work item to hold them.
 */
const props = defineProps<{ trackId: RowId, suggestions?: WorkSuggestion[] }>()
const emit = defineEmits<{ dismiss: [workId: number] }>()

const editor = useAlbumEditor()
const { $api } = useNuxtApp()
const { enumLabel } = useCatalogDisplay()
const references = editor.references
const track = computed(() => findTrack(editor.album.value, props.trackId))
const workId = computed(() => track.value?.work_id ?? null)

const picking = ref(false)
const relation = ref<typeof ORIGIN_RELATIONS[number]>('arranged_from')
const loading = ref(false)

watch(workId, async (id) => {
  if (typeof id !== 'number') return
  loading.value = true
  try { await editor.loadWork(id) } finally { loading.value = false }
}, { immediate: true })

type Relation = WorkDocument['relations'][number]
const document = computed(() => editor.workDocument(workId.value))
const originals = computed(() => (document.value?.relations ?? []).filter(row => (ORIGIN_RELATIONS as readonly string[]).includes(row.relation_type)))
const recordings = computed(() => typeof workId.value === 'number'
  ? Number((references.work?.[String(workId.value)] as { tracks_count?: number } | undefined)?.tracks_count ?? 0)
  : 0)
const candidates = computed(() => (props.suggestions ?? []).filter(candidate => !sameId(candidate.work_id, workId.value)))

/** A work item made only to hold originals of this track: dropped again once it holds nothing. */
const isBare = (doc: Record<string, unknown>) => Object.entries(doc).every(([key, value]) => key === 'title' || (Array.isArray(value) && !value.length) || value === null)

const dropBareWork = (workId: AggregateRef | null) => {
  if (typeof workId !== 'string') return false
  const ref = workId.replace(/^@/, '')
  const item = editor.draft.items.value.find(entry => entry.ref === ref)
  const sharedWithOthers = editor.album.value.tracks.some(other => !sameId(other.id, props.trackId) && other.work_id === workId)
  if (!item || item.action !== 'create' || sharedWithOthers || !isBare(item.document ?? {})) return false
  editor.removeItem(ref)
  return true
}

const link = (item: PickedEntity, tracksCount?: number) => {
  editor.remember('work', item.id, { id: item.id, title: item.label, ...(tracksCount !== undefined ? { tracks_count: tracksCount } : {}) })
  const previous = track.value!.work_id
  track.value!.work_id = item.id
  dropBareWork(previous)
  picking.value = false
}

const separate = () => { track.value!.work_id = null }

const dismiss = async (workId: number) => {
  emit('dismiss', workId)
  if (typeof track.value!.work_id !== 'number') return
  try { await $api(`/v1/works/${track.value!.work_id}/duplicate-dismissals/${workId}`, { method: 'PUT' }) } catch { /* only hides it here */ }
}

/** The item holding this track's work, made on demand for a new track. */
const ownItem = async () => {
  if (track.value!.work_id === null) track.value!.work_id = editor.createItem('work', { title: track.value!.title, relations: [] })
  return editor.workItem(track.value!.work_id)
}

const addOriginal = async (relatedId: AggregateRef) => {
  const item = await ownItem()
  if (!item?.document) return
  const relations = (item.document.relations ??= []) as Relation[]
  if (!relations.some(row => sameId(row.related_work_id, relatedId))) {
    relations.push({ id: newKey('wr'), related_work_id: relatedId, relation_type: relation.value, note: null })
  }
}

const pickOriginal = (item: PickedEntity) => {
  editor.remember('work', item.id, { id: item.id, title: item.label })
  void addOriginal(item.id)
}

/** An original that is not in the catalog yet becomes a new work in this revision. */
const createOriginal = (title: string) => { void addOriginal(editor.createItem('work', { title })) }

const editRelations = async (change: (relations: Relation[]) => void) => {
  const item = await editor.workItem(track.value!.work_id!)
  if (!item?.document) return
  const relations = (item.document.relations ?? []) as Relation[]
  change(relations)
  if (item.action === 'update') editor.tidyItem(item.ref)
  else if (dropBareWork(track.value!.work_id)) track.value!.work_id = null
}

const setRelation = (id: RowId, value: string) => editRelations((relations) => {
  const row = relations.find(item => sameId(item.id, id))
  if (row) row.relation_type = value
})

const removeOriginal = async (id: RowId) => {
  let removed: AggregateRef | null = null
  await editRelations((relations) => {
    const index = relations.findIndex(item => sameId(item.id, id))
    if (index >= 0) removed = relations.splice(index, 1)[0]!.related_work_id
  })
  // An original added as a new work goes with its last reference.
  if (typeof removed === 'string' && !editor.referenced(removed)) editor.removeItem((removed as string).replace(/^@/, ''))
}
</script>
