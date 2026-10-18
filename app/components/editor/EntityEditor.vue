<template>
  <div class="min-h-screen bg-gray-50/60">
    <div class="container mx-auto max-w-5xl px-3 py-6 md:px-6">
      <div v-if="loading" class="flex min-h-96 items-center justify-center"><span class="loading loading-spinner loading-lg" /></div>

      <div v-else-if="loadError" class="mx-auto max-w-lg space-y-3 py-16 text-center">
        <p class="alert alert-error justify-center">{{ loadError }}</p>
        <NuxtLink :to="id ? `/${resource}/${id}` : `/${resource}`" class="btn btn-sm">{{ $t('common.go_back') }}</NuxtLink>
      </div>

      <template v-else-if="ready">
        <header class="mb-5">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">{{ $t(id ? 'editor.entity.edit_title' : 'editor.entity.new_title', { type: typeLabel }) }}</p>
          <h1 class="truncate text-2xl font-bold text-gray-900">{{ name || $t('editor.entity.untitled') }}</h1>
          <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <NuxtLink v-if="id" :to="`/${resource}/${id}`" class="hover:underline">{{ $t('editor.entity.view') }}</NuxtLink>
            <NuxtLink v-if="id" :to="`/${resource}/${id}/versions`" class="hover:underline">{{ $t('versions.title') }}</NuxtLink>
            <NuxtLink to="/revisions" class="hover:underline">{{ $t('editor.my_revisions') }}</NuxtLink>
          </p>
        </header>

        <div v-if="openRevisions.length && !draft.revisionId.value" class="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <History :size="16" class="shrink-0" />
          <span class="min-w-0 flex-1">{{ $t('editor.entity.open_revision', { id: openRevisions[0]!.id, at: ago(openRevisions[0]!.updated_at) }) }}</span>
          <NuxtLink :to="{ query: { ...$route.query, revision: openRevisions[0]!.id } }" class="btn btn-sm">{{ $t('editor.continue_draft') }}</NuxtLink>
          <button type="button" class="btn btn-ghost btn-sm" @click="openRevisions = []">{{ $t('editor.ignore') }}</button>
        </div>
        <div v-if="draft.status.value === 'changes_requested'" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p class="font-semibold">{{ $t('editor.changes_requested') }}</p>
          <p v-if="reviewComment" class="mt-1 whitespace-pre-line">{{ reviewComment }}</p>
        </div>
        <div class="mb-4"><EditorDraftStatus :draft="draft" @discard="restart" /></div>

        <div class="space-y-6">
          <slot />
          <CatalogSection :title="$t('editor.section_submit')" :icon="Send" tone="blue">
            <div class="p-5">
              <EditorRevisionSubmitPanel :draft="draft" :originals="originals" :labels="{ main: name || typeLabel }" @submitted="submitted" @errors="setErrors" @discarded="restart" />
            </div>
          </CatalogSection>
        </div>
      </template>
    </div>
    <CommonToast :toast="toast" />
  </div>
</template>

<script setup lang="ts">
import type { EntityEditorContext, EntityType } from '~/composables/useEntityEditor'
import type { FieldError } from '~/composables/useAlbumEditor'
import type { DraftItem } from '~/composables/useRevisionDraft'
import type { CatalogReferences } from '~/types/catalog'
import type { Revision } from '~/types/revision'
import { History, Send } from '@lucide/vue'
import { emptyDocument, entityEditorKey } from '~/composables/useEntityEditor'
import { CATALOG_RESOURCES } from '~/types/catalog'
import { newDraftScope } from '~/utils/localDrafts'

/**
 * Editor for one artist, label, work, entry or series (docs/catalog/editing.md): the fields come
 * from the default slot, which reads the document with useEntityEditor(). Like the album editor it
 * keeps the draft in this browser while editing and submits one revision.
 */
const props = defineProps<{
  type: EntityType
  id?: number | null
  /** A revision sent back for changes to continue. */
  revisionId?: number | null
  /** A new item's draft kept in this browser to continue (?draft=). */
  draftScope?: string | null
  /** Starting document of a new entity, e.g. imported from Bangumi */
  initial?: Record<string, unknown> | null
}>()

const MAIN = 'main'
const { t } = useI18n()
const { $api } = useNuxtApp()
const router = useRouter()
const route = useRoute()
const { schema } = useCatalogSchema()
const { toast, showToast } = useToast()
const { ago } = useRelativeTime()
const { enumLabel } = useCatalogDisplay()
const { localizeError } = useLocalizedApiError()

const id = props.id ?? null
const resource = CATALOG_RESOURCES[props.type]
const typeLabel = computed(() => enumLabel('catalog_type', props.type))

const blank = (value: unknown) => value === null || value === undefined || (typeof value === 'string' && !value.trim())
/** Rows left empty while editing are not sent: names without text, links without a URL, details without a value. */
const prepare = (item: DraftItem): DraftItem => {
  if (!item.document) return item
  const document = JSON.parse(JSON.stringify(item.document)) as Record<string, Array<Record<string, unknown>> | unknown>
  if (Array.isArray(document.titles)) document.titles = document.titles.filter(row => !blank(row.title))
  if (Array.isArray(document.links)) document.links = document.links.filter(row => !blank(row.url))
  if (Array.isArray(document.attributes)) document.attributes = document.attributes.filter(row => !blank(row.value))
  // Drafts saved before album links of entries lost them still carry these fields.
  if (item.resource_type === 'entry' && Array.isArray(document.albums)) {
    for (const row of document.albums as Array<Record<string, unknown>>) {
      delete row.character_name
      delete row.episode
    }
  }
  return { ...item, document: document as Record<string, unknown> }
}
const draft = useRevisionDraft({ prepare, afterRebase: item => loadOriginals([item]) })
const references = draft.references as CatalogReferences

const loading = ref(true)
const loadError = ref('')
const loaded = ref(false)
const ready = computed(() => loaded.value && !!schema.value)
const reviewComment = ref<string | null>(null)
/** This entity's revisions sent back for changes, offered before starting another. */
const openRevisions = ref<Revision[]>([])
const originals = reactive<Record<string, Record<string, unknown> | null>>({})
const mainRef = ref(MAIN)

const doc = computed(() => draft.items.value.find(item => item.ref === mainRef.value)?.document ?? {})
const name = computed(() => String(doc.value.name ?? doc.value.title ?? ''))

const mergeReferences = (incoming: CatalogReferences | undefined) => {
  for (const [type, rows] of Object.entries(incoming ?? {})) references[type] = { ...(references[type] ?? {}), ...rows }
}
const remember = (type: string, entityId: number, row: object) => {
  references[type] = { ...(references[type] ?? {}), [String(entityId)]: { ...(references[type]?.[String(entityId)] ?? {}), ...row } }
}

const errors = ref<FieldError[]>([])
const errorAt = (...path: Array<string | number>) => errors.value.find(error => error.path === [`items.${mainRef.value}`, ...path].join('.'))?.message ?? null
const errorsIn = (collection: string) => {
  const path = `items.${mainRef.value}.${collection}`
  return errors.value.filter(error => error.path === path || error.path.startsWith(`${path}.`))
}
const setErrors = (list: FieldError[]) => {
  errors.value = list
  if (list.length) showToast(t('editor.fix_errors'), 'error')
}

const context: EntityEditorContext = { type: props.type, id, doc, references, remember, errorAt, errorsIn, notify: showToast }
provide(entityEditorKey, context)

const clone = (value: unknown) => JSON.parse(JSON.stringify(value)) as Record<string, unknown>

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

const open = async () => {
  if (props.revisionId) {
    const revision = await draft.loadRevision(props.revisionId)
    if (revision.status !== 'changes_requested') throw new Error(t('editor.not_editable'))
    const main = revision.items?.find(item => item.resource_type === props.type && (id ? item.resource_id === id : item.action === 'create'))
    if (!main) throw new Error(t('editor.entity.revision_mismatch'))
    // Content that went live at submission is edited directly now, not through this revision.
    if (main.applied_at && main.resource_id) {
      await navigateTo(`/contribute/${props.type}/${main.resource_id}`, { replace: true })
      return
    }
    mainRef.value = main.ref
    reviewComment.value = revision.review_comment
    await loadOriginals(draft.items.value)
    return
  }
  if (props.draftScope) {
    const record = await draft.resume(props.draftScope)
    if (!record) throw new Error(t('editor.draft_missing'))
    mainRef.value = record.mainRef
    await loadOriginals(draft.items.value)
    return
  }
  if (id) {
    const data = await $api<{ document: Record<string, unknown>, version: number, references: CatalogReferences }>(`/v1/${resource}/${id}/document`)
    mergeReferences(data.references)
    const restored = await draft.start([{ ref: MAIN, resource_type: props.type, action: 'update', resource_id: id, base_version: data.version, document: clone(data.document) }], `${props.type}:${id}`)
    if (restored) await loadOriginals(draft.items.value)
    else originals[MAIN] = clone(data.document)
    void findOpenRevisions()
    return
  }
  originals[MAIN] = null
  await draft.start([{ ref: MAIN, resource_type: props.type, action: 'create', document: { ...emptyDocument(props.type), ...clone(props.initial ?? {}) } }], newDraftScope(props.type))
}

/** Starts over after the draft was thrown away: a new item from scratch, an entity or revision as stored. */
const restart = () => {
  if (!id && !props.revisionId) return navigateTo('/revisions')
  loading.value = true
  return open().finally(() => { loading.value = false })
}

// Once a new item's draft is saved, the address names it, so reloading the page continues it.
watch(draft.persisted, (persisted) => {
  if (!persisted || id || props.revisionId || props.draftScope || !draft.scope.value) return
  window.history.replaceState(window.history.state, '', router.resolve({ query: { ...route.query, draft: draft.scope.value } }).href)
})

const findOpenRevisions = async () => {
  try {
    const page = await $api<{ revisions: Revision[] }>('/v1/me/revisions', { query: { resource_type: props.type, resource_id: id, status: 'changes_requested', per_page: 10 } })
    openRevisions.value = page.revisions.filter(revision => !revision.items?.some(item => item.resource_type === props.type && item.resource_id === id && item.applied_at))
  } catch { /* the banner is optional */ }
}

onMounted(async () => {
  try {
    await open()
    loaded.value = true
  } catch (error) {
    loadError.value = error instanceof Error && !(error as { details?: unknown }).details ? error.message : localizeError(error)
  } finally {
    loading.value = false
  }
})

onBeforeRouteLeave(async () => {
  if (draft.hasUnsaved()) await draft.save().catch(() => undefined)
})

const submitted = (revision: Revision) => {
  errors.value = []
  const main = revision.items?.find(item => item.ref === mainRef.value)
  if (revision.status === 'approved') {
    showToast(t('editor.published'))
    router.push(`/${resource}/${main?.resource_id ?? id}`)
  } else if (main?.applied_at && main.resource_id) {
    // New content of members is live at once, marked as awaiting review.
    showToast(t('pending.submitted'))
    router.push(`/${resource}/${main.resource_id}`)
  } else {
    router.push(`/revisions/${revision.id}`)
  }
}
</script>
