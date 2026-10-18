<template>
  <div class="min-h-screen bg-gray-50/60">
    <div class="container mx-auto max-w-7xl px-3 py-6 md:px-6">
      <SkeletonForm v-if="loading" :fields="5" class="min-h-96" />

      <div v-else-if="loadError" class="mx-auto max-w-lg space-y-3 py-16 text-center">
        <p class="alert alert-error justify-center">{{ loadError }}</p>
        <NuxtLink :to="albumId ? `/albums/${albumId}` : '/albums'" class="btn btn-sm">{{ $t('common.go_back') }}</NuxtLink>
      </div>

      <template v-else-if="ready">
        <header class="mb-5 flex flex-wrap items-end gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">{{ $t(albumId ? 'editor.album.edit_title' : 'editor.album.new_title') }}</p>
            <h1 class="truncate text-2xl font-bold text-gray-900">{{ album.title || $t('editor.album.untitled') }}</h1>
            <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <NuxtLink v-if="albumId" :to="`/albums/${albumId}`" class="hover:underline">{{ $t('editor.album.view') }}</NuxtLink>
              <NuxtLink v-if="albumId" :to="`/albums/${albumId}/versions`" class="hover:underline">{{ $t('versions.title') }}</NuxtLink>
              <NuxtLink to="/revisions" class="hover:underline">{{ $t('editor.my_revisions') }}</NuxtLink>
            </p>
          </div>
          <div class="flex rounded-xl border border-gray-200 bg-white p-1 text-sm shadow-sm">
            <button type="button" class="rounded-lg px-3 py-1.5" :class="!translating ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'" @click="go('basic')">
              <PencilLine :size="14" class="mr-1 inline" />{{ $t('editor.mode_edit') }}
            </button>
            <button type="button" class="rounded-lg px-3 py-1.5" :class="translating ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'" @click="go('translate')">
              <Languages :size="14" class="mr-1 inline" />{{ $t('editor.mode_translate') }}
            </button>
          </div>
        </header>

        <div v-if="openRevisions.length && !draft.revisionId.value" class="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <History :size="16" class="shrink-0" />
          <span class="min-w-0 flex-1">{{ $t('editor.open_revision', { id: openRevisions[0]!.id, at: ago(openRevisions[0]!.updated_at) }) }}</span>
          <NuxtLink :to="{ query: { ...$route.query, revision: openRevisions[0]!.id } }" class="btn btn-sm">{{ $t('editor.continue_draft') }}</NuxtLink>
          <button type="button" class="btn btn-ghost btn-sm" @click="openRevisions = []">{{ $t('editor.ignore') }}</button>
        </div>
        <div v-if="draft.status.value === 'changes_requested'" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p class="font-semibold">{{ $t('editor.changes_requested') }}</p>
          <p v-if="reviewComment" class="mt-1 whitespace-pre-line">{{ reviewComment }}</p>
        </div>
        <div class="mb-4"><EditorDraftStatus :draft="draft" @discard="restart" /></div>

        <div class="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside class="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <nav class="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              <button
                v-for="section in sections"
                :key="section.key"
                type="button"
                class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
                :class="active === section.key ? 'bg-white font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:bg-white/70'"
                @click="go(section.key)"
              >
                <component :is="section.icon" :size="15" class="shrink-0 text-gray-400" />
                <span class="flex-1 whitespace-nowrap">{{ section.label }}</span>
                <span v-if="errorCounts[section.key]" class="rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-700">{{ errorCounts[section.key] }}</span>
                <span v-else-if="missingIn(section.key)" class="h-2 w-2 rounded-full bg-amber-400" :title="$t('editor.required_missing')" />
              </button>
            </nav>

            <div class="hidden rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm lg:block">
              <p class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{{ $t('editor.required') }}</p>
              <ul class="space-y-1.5">
                <li v-for="check in requiredChecks" :key="check.key">
                  <button type="button" class="flex items-center gap-2 text-left hover:underline" :class="check.done ? 'text-gray-500' : 'text-gray-900'" @click="go(check.section)">
                    <CircleCheck v-if="check.done" :size="14" class="text-emerald-500" /><Circle v-else :size="14" class="text-amber-500" />{{ check.label }}
                  </button>
                </li>
              </ul>
              <template v-if="suggested.length">
                <p class="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">{{ $t('editor.recommended') }}</p>
                <ul class="space-y-1.5 text-xs text-gray-500">
                  <li v-for="item in suggested" :key="item.key"><button type="button" class="hover:underline" @click="go(item.section)">+ {{ item.label }}</button></li>
                </ul>
              </template>
            </div>
          </aside>

          <main class="min-w-0 space-y-6">
            <EditorAlbumDuplicateCandidates v-if="!albumId" ref="duplicatePanel" />
            <EditorAlbumBasicSection v-if="active === 'basic'" />
            <EditorAlbumPeopleSection v-else-if="active === 'people'" />
            <EditorAlbumTracksSection v-else-if="active === 'tracks'" />
            <EditorAlbumCreditsSection v-else-if="active === 'credits'" />
            <EditorAlbumEditionsSection v-else-if="active === 'editions'" />
            <EditorAlbumBonusesSection v-else-if="active === 'bonuses'" />
            <EditorAlbumImagesSection v-else-if="active === 'images'" />
            <EditorAlbumRelationsSection v-else-if="active === 'relations'" />
            <EditorAlbumTranslateSection v-else-if="active === 'translate'" :initial-locale="locale" />
            <CatalogSection v-else :title="$t('editor.section_submit')" :icon="Send" tone="blue">
              <div class="space-y-4 p-5">
                <div v-if="missing.length" class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p class="font-semibold">{{ $t('editor.required_missing') }}</p>
                  <ul class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <li v-for="check in requiredChecks.filter(item => !item.done)" :key="check.key">
                      <button type="button" class="hover:underline" @click="go(check.section)">{{ check.label }}</button>
                    </li>
                  </ul>
                </div>
                <EditorRevisionSubmitPanel :draft="draft" :originals="originals" :labels="itemLabels" @submitted="submitted" @errors="setErrors" @duplicates="duplicatePanel?.show($event)" @discarded="restart" />
              </div>
            </CatalogSection>

            <EditorAlbumNewItems v-if="active === 'submit'" />
          </main>
        </div>
      </template>
    </div>
    <CommonToast :toast="toast" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { AlbumEditorContext, AlbumSection, FieldError, NewItemType } from '~/composables/useAlbumEditor'
import type { DraftItem } from '~/composables/useRevisionDraft'
import type { CatalogReferences } from '~/types/catalog'
import type { AggregateRef, AlbumDocument, WorkDocument } from '~/types/document'
import type { DuplicateCandidate, Revision } from '~/types/revision'
import { Contact, Gift, History, Images, Info, Languages, ListMusic, Network, Package, PencilLine, Send, Users, Circle, CircleCheck } from '@lucide/vue'
import { ALBUM_REF, albumEditorKey } from '~/composables/useAlbumEditor'
import { CATALOG_RESOURCES } from '~/types/catalog'
import { emptyAlbumDocument, missingRequired, missingSuggested, pruneAlbumDocument } from '~/utils/albumDocument'
import { newRef } from '~/utils/documentKeys'
import { newDraftScope } from '~/utils/localDrafts'

/**
 * The album editor (docs/catalog/editing.md): the album document and any artists, labels and works
 * created on the way are items of one revision, kept as a draft in this browser while editing and
 * submitted together. Sections mount one at a time; `mode=translate` opens the tracklist translator.
 * `revisionId` continues a revision sent back for changes, `draftScope` a new album's draft (?draft=).
 */
const props = defineProps<{ albumId?: number | null, revisionId?: number | null, draftScope?: string | null, mode?: 'edit' | 'translate', locale?: string }>()

const { t } = useI18n()
const { $api } = useNuxtApp()
const router = useRouter()
const route = useRoute()
const { schema } = useCatalogSchema()
const { toast, showToast } = useToast()
const { ago } = useRelativeTime()
const { localizeError } = useLocalizedApiError()

const albumId = props.albumId ?? null
const mainRef = ref(ALBUM_REF)

/** Blank names, links and details stay in the editor but are not sent. */
const prepare = (item: DraftItem): DraftItem => item.resource_type === 'album' && item.document
  ? { ...item, document: pruneAlbumDocument(item.document as unknown as AlbumDocument) as unknown as Record<string, unknown> }
  : item
const draft = useRevisionDraft({ prepare, afterRebase: item => loadOriginals([item]) })
const items = draft.items
const references = draft.references as CatalogReferences

const loading = ref(true)
const loadError = ref('')
const loaded = ref(false)
const ready = computed(() => loaded.value && !!schema.value)
const reviewComment = ref<string | null>(null)
const openRevisions = ref<Revision[]>([])
/** Documents as loaded, by item ref, for the change preview; null for new items. */
const originals = reactive<Record<string, Record<string, unknown> | null>>({})
const duplicatePanel = ref<{ show: (candidates: DuplicateCandidate[]) => Promise<void> } | null>(null)

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
const itemOf = (ref: string) => items.value.find(item => item.ref === ref)
const album = computed(() => (itemOf(mainRef.value)?.document ?? emptyAlbumDocument()) as unknown as AlbumDocument)

// ---- references and new items ----

const mergeReferences = (incoming: CatalogReferences | undefined) => {
  for (const [type, rows] of Object.entries(incoming ?? {})) references[type] = { ...(references[type] ?? {}), ...rows }
}
const remember = (type: string, id: number, row: object) => {
  references[type] = { ...(references[type] ?? {}), [String(id)]: { ...(references[type]?.[String(id)] ?? {}), ...row } }
}

const pending = computed(() => Object.fromEntries(items.value
  .filter(item => item.action === 'create' && item.ref !== mainRef.value)
  .map(item => [item.ref, String(item.document?.name ?? item.document?.title ?? item.ref) || '…'])))

const createItem = (type: NewItemType, document: Record<string, unknown>) => {
  const ref = newRef(type === 'artist' ? 'ar' : type === 'label' ? 'lb' : 'wk')
  items.value.push({ ref, resource_type: type, action: 'create', document })
  return `@${ref}`
}

const referenced = (target: string) => items.value.some(item => JSON.stringify(item.document ?? {}).includes(`"${target}"`))

/** Clears references to a removed item: rows that need it go, optional fields become null, credits keep the printed name. */
const clearReference = (type: string, document: Record<string, unknown>, target: string, name: string | null) => {
  const aggregate = schema.value?.aggregates?.[type] as { fields: Array<{ name: string, type: string }>, collections: Array<{ name: string, fields: Array<{ name: string, type: string, required?: boolean }> }> } | undefined
  if (!aggregate) return
  for (const field of aggregate.fields) {
    if (field.type === 'aggregate' && document[field.name] === target) document[field.name] = null
  }
  for (const collection of aggregate.collections) {
    const rows = document[collection.name]
    if (!Array.isArray(rows)) continue
    const fields = collection.fields.filter(field => field.type === 'aggregate')
    document[collection.name] = (rows as Array<Record<string, unknown>>).filter(row => fields.every((field) => {
      if (row[field.name] !== target) return true
      if (field.required) return false
      row[field.name] = null
      if ('credited_as' in row && !row.credited_as) row.credited_as = name
      return true
    }))
  }
}

const removeItem = (ref: string) => {
  const removed = itemOf(ref)
  if (!removed || ref === mainRef.value) return
  items.value = items.value.filter(item => item.ref !== ref)
  originals[ref] = null
  const name = (removed.document?.name ?? removed.document?.title ?? null) as string | null
  for (const item of items.value) {
    if (item.document) clearReference(item.resource_type, item.document, `@${ref}`, name)
  }
}

// ---- works: shown with their originals, edited as update items on demand ----

const workCache = reactive<Record<string, { document: WorkDocument, version: number }>>({})
const workLoads = new Map<number, Promise<void>>()

const loadWork = (id: number): Promise<void> => {
  if (workCache[id]) return Promise.resolve()
  const running = workLoads.get(id)
  if (running) return running
  const promise = $api<{ document: WorkDocument, version: number, references?: CatalogReferences }>(`/v1/works/${id}/document`)
    .then((data) => {
      workCache[id] = { document: data.document, version: data.version }
      mergeReferences(data.references)
    })
    .catch(() => { /* the panel shows no originals */ })
    .finally(() => workLoads.delete(id))
  workLoads.set(id, promise)
  return promise
}

const workItemOf = (workId: AggregateRef) => typeof workId === 'string'
  ? itemOf(workId.replace(/^@/, ''))
  : items.value.find(item => item.resource_type === 'work' && item.action === 'update' && item.resource_id === workId)

const workDocument = (workId: AggregateRef | null) => {
  if (workId === null) return null
  const item = workItemOf(workId)
  if (item?.document) return item.document as unknown as WorkDocument
  return typeof workId === 'number' ? workCache[workId]?.document ?? null : null
}

const workItem = async (workId: AggregateRef) => {
  const existing = workItemOf(workId)
  if (existing || typeof workId === 'string') return existing ?? null
  await loadWork(workId)
  const loadedWork = workCache[workId]
  if (!loadedWork) return null
  const ref = `w${workId}`
  originals[ref] = clone(loadedWork.document) as unknown as Record<string, unknown>
  items.value.push({ ref, resource_type: 'work', action: 'update', resource_id: workId, base_version: loadedWork.version, document: clone(loadedWork.document) as unknown as Record<string, unknown> })
  return items.value[items.value.length - 1]!
}

const tidyItem = (ref: string) => {
  const item = itemOf(ref)
  if (item?.action === 'update' && ref !== mainRef.value && JSON.stringify(item.document) === JSON.stringify(originals[ref])) {
    items.value = items.value.filter(entry => entry.ref !== ref)
  }
}

/** A new work made for a track follows the track's title until it is renamed. */
const titles = new Map<string, string>()
watch(() => album.value.tracks.map(track => [String(track.id), track.title, track.work_id] as const), (rows) => {
  for (const [id, title, workId] of rows) {
    const before = titles.get(id)
    if (before !== undefined && before !== title && typeof workId === 'string') {
      const item = itemOf(workId.replace(/^@/, ''))
      if (item?.action === 'create' && item.document?.title === before) item.document.title = title
    }
    titles.set(id, title)
  }
})

// ---- errors and sections ----

const errors = ref<FieldError[]>([])
const prefix = computed(() => `items.${mainRef.value}`)
const errorAt = (...path: Array<string | number>) => errors.value.find(error => error.path === [prefix.value, ...path].join('.'))?.message ?? null
const errorsIn = (collection: string) => {
  const path = `${prefix.value}.${collection}`
  return errors.value.filter(error => error.path === path || error.path.startsWith(`${path}.`))
}
const setErrors = (list: FieldError[]) => {
  errors.value = list
  if (list.length) showToast(t('editor.fix_errors'), 'error')
}

const SECTION_FIELDS: Partial<Record<AlbumSection, string[]>> = {
  basic: ['title', 'slug', 'type', 'categories', 'release_date', 'release_date_precision', 'release_event_id', 'description', 'is_adult', 'banner_url', 'titles'],
  people: ['artists', 'labels'],
  tracks: ['discs', 'tracks', 'disc_titles', 'track_titles', 'disc_tocs', 'track_attributes'],
  credits: ['credits'],
  editions: ['products'],
  bonuses: ['bonuses'],
  images: ['images', 'image_attributes'],
  relations: ['entries', 'links', 'attributes'],
}
const sectionOf = (path: string): AlbumSection => {
  const [, ref, field] = path.split('.')
  if (ref !== mainRef.value || !field) return 'submit'
  return (Object.entries(SECTION_FIELDS).find(([, fields]) => fields!.includes(field))?.[0] ?? 'basic') as AlbumSection
}
const errorCounts = computed(() => {
  const counts: Partial<Record<AlbumSection, number>> = {}
  for (const error of errors.value) {
    const section = sectionOf(error.path)
    counts[section] = (counts[section] ?? 0) + 1
  }
  return counts
})

const SECTIONS: Array<{ key: AlbumSection, icon: Component }> = [
  { key: 'basic', icon: Info },
  { key: 'tracks', icon: ListMusic },
  { key: 'people', icon: Users },
  { key: 'credits', icon: Contact },
  { key: 'editions', icon: Package },
  { key: 'bonuses', icon: Gift },
  { key: 'images', icon: Images },
  { key: 'relations', icon: Network },
  { key: 'submit', icon: Send },
]
const active = ref<AlbumSection>(props.mode === 'translate' ? 'translate' : 'basic')
const translating = computed(() => active.value === 'translate')
const sections = computed(() => (translating.value ? SECTIONS.filter(section => section.key === 'submit') : SECTIONS)
  .map(section => ({ ...section, label: t(section.key === 'submit' ? 'editor.section_submit' : `editor.album.section.${section.key}`) })))

const go = (section: AlbumSection) => {
  active.value = section
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

const missing = computed(() => missingRequired(album.value))
const REQUIRED_SECTIONS = { title: 'basic', type: 'basic', release_date: 'basic', cover: 'basic', tracks: 'tracks' } as const
const requiredChecks = computed(() => (['title', 'type', 'release_date', 'cover', 'tracks'] as const).map(key => ({
  key, section: REQUIRED_SECTIONS[key] as AlbumSection, done: !missing.value.includes(key), label: t(`editor.required_item.${key}`),
})))
const missingIn = (section: AlbumSection) => requiredChecks.value.some(check => !check.done && check.section === section)
const SUGGESTED_SECTIONS = { artists: 'people', catalog_number: 'basic', durations: 'tracks', credits: 'credits', categories: 'basic', links: 'relations' } as const
const suggested = computed(() => missingSuggested(album.value).map(key => ({ key, section: SUGGESTED_SECTIONS[key] as AlbumSection, label: t(`editor.suggested_item.${key}`) })))

const itemLabels = computed(() => Object.fromEntries(items.value.map((item) => {
  if (item.ref === mainRef.value) return [item.ref, album.value.title || t('editor.album.untitled')]
  if (item.action === 'create') return [item.ref, pending.value[item.ref] ?? item.ref]
  const row = item.resource_id ? references[item.resource_type]?.[String(item.resource_id)] as { title?: string, name?: string } | undefined : undefined
  return [item.ref, row?.title ?? row?.name ?? `#${item.resource_id}`]
})))

const context: AlbumEditorContext = {
  albumId, mainRef, album, draft, references, pending, createItem, removeItem, referenced, workDocument, loadWork, workItem, tidyItem,
  remember, errors, errorAt, errorsIn, go, notify: showToast,
}
provide(albumEditorKey, context)

// ---- loading ----

/** Documents of the versions update items were edited from, for the change preview; null for new items. */
const loadOriginals = async (list: DraftItem[]) => {
  await Promise.all(list.map(async (item) => {
    originals[item.ref] = null
    if (item.action !== 'update' || !item.resource_id || item.base_version === undefined) return
    const version = await $api<{ snapshot: Record<string, unknown> | null, references?: CatalogReferences }>(`/v1/${CATALOG_RESOURCES[item.resource_type]}/${item.resource_id}/versions/${item.base_version}`)
    originals[item.ref] = version.snapshot
    mergeReferences(version.references)
  }))
}

const startNew = async () => {
  mainRef.value = ALBUM_REF
  originals[ALBUM_REF] = null
  await draft.start([{ ref: ALBUM_REF, resource_type: 'album', action: 'create', document: emptyAlbumDocument() as unknown as Record<string, unknown> }], newDraftScope('album'))
}

/** Edits kept in this browser for this album come back by themselves. */
const openAlbum = async (id: number) => {
  const data = await $api<{ document: AlbumDocument, version: number, references: CatalogReferences }>(`/v1/albums/${id}/document`)
  mergeReferences(data.references)
  mainRef.value = ALBUM_REF
  const restored = await draft.start([{ ref: ALBUM_REF, resource_type: 'album', action: 'update', resource_id: id, base_version: data.version, document: clone(data.document) as unknown as Record<string, unknown> }], `album:${id}`)
  if (restored) await loadOriginals(items.value)
  else originals[ALBUM_REF] = clone(data.document) as unknown as Record<string, unknown>
}

/** Continues a revision sent back; the preview compares against each item's base version. */
const openRevision = async (id: number) => {
  const revision = await draft.loadRevision(id)
  if (revision.status !== 'changes_requested') throw new Error(t('editor.not_editable'))
  const main = revision.items?.find(item => item.resource_type === 'album' && (albumId ? item.resource_id === albumId : item.action === 'create'))
  if (!main) throw new Error(t('editor.album.revision_mismatch'))
  // The album went live at submission: it is edited directly now, not through this revision.
  if (main.applied_at && main.resource_id) {
    await navigateTo(`/contribute/album/${main.resource_id}`, { replace: true })
    return
  }
  mainRef.value = main.ref
  reviewComment.value = revision.review_comment
  await loadOriginals(items.value)
}

/** Continues a new album's draft kept in this browser. */
const openDraft = async (scope: string) => {
  const record = await draft.resume(scope)
  if (!record) throw new Error(t('editor.draft_missing'))
  mainRef.value = record.mainRef
  await loadOriginals(items.value)
}

/** This album's revisions sent back for changes, offered before starting another. */
const findOpenRevisions = async (id: number) => {
  try {
    const page = await $api<{ revisions: Revision[] }>('/v1/me/revisions', { query: { resource_type: 'album', resource_id: id, status: 'changes_requested', per_page: 10 } })
    openRevisions.value = page.revisions.filter(revision => !revision.items?.some(item => item.resource_type === 'album' && item.resource_id === id && item.applied_at))
  } catch { /* the banner is optional */ }
}

const open = async () => {
  if (props.revisionId) await openRevision(props.revisionId)
  else if (props.draftScope) await openDraft(props.draftScope)
  else if (albumId) await openAlbum(albumId)
  else await startNew()
}

onMounted(async () => {
  try {
    await open()
    loaded.value = true
    if (albumId && !props.revisionId) void findOpenRevisions(albumId)
  } catch (error) {
    loadError.value = error instanceof Error && !(error as { details?: unknown }).details ? error.message : localizeError(error)
  } finally {
    loading.value = false
  }
})

/** Starts over after the draft was thrown away: the album or revision as stored; a new album's list of drafts. */
const restart = () => {
  if (!albumId && !props.revisionId) return navigateTo('/revisions')
  loading.value = true
  return open().finally(() => { loading.value = false })
}

// Once a new album's draft is saved, the address names it, so reloading the page continues it.
watch(draft.persisted, (persisted) => {
  if (!persisted || albumId || props.revisionId || props.draftScope || !draft.scope.value) return
  window.history.replaceState(window.history.state, '', router.resolve({ query: { ...route.query, draft: draft.scope.value } }).href)
})

onBeforeRouteLeave(async () => {
  if (draft.hasUnsaved()) await draft.save().catch(() => undefined)
})

const submitted = (revision: Revision) => {
  errors.value = []
  const main = revision.items?.find(item => item.ref === mainRef.value)
  if (revision.status === 'approved') {
    showToast(t('editor.published'))
    router.push(`/albums/${main?.resource_id ?? albumId}`)
  } else if (main?.applied_at && main.resource_id) {
    // A member's new album is live at once, marked as awaiting review.
    showToast(t('pending.submitted'))
    router.push(`/albums/${main.resource_id}`)
  } else {
    router.push(`/revisions/${revision.id}`)
  }
}
</script>
