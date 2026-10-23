import type { SchemaCollection, SchemaField } from '~/composables/useDocumentSchema'
import type { CatalogReferences } from '~/types/catalog'
import type { Revision, RevisionItemInput, RevisionStatus } from '~/types/revision'
import type { LocalDraft } from '~/utils/localDrafts'
import { draftKey, dropLegacyBackups, localDrafts } from '~/utils/localDrafts'
import { fillRequiredText } from '~/utils/requiredText'
import { mainItem } from '~/utils/revisionLinks'

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

/** An item being edited: its document is the reactive object the editor binds to. */
export interface DraftItem extends RevisionItemInput {
  document?: Record<string, unknown>
}

interface Snapshot {
  items: DraftItem[]
  summary: string
  sources: string[]
}

/**
 * Saved this long after editing pauses. A save copies the whole draft once (about 1 ms for a
 * 100-track album, under 10 ms at the 999-track limit); leaving or hiding the page saves at once.
 */
const SAVE_DELAY = 1000

/**
 * A catalog revision being edited (docs/catalog/editing.md#草稿): the items and their documents,
 * the edit summary and sources. The draft is kept in this browser (utils/localDrafts), saved there
 * shortly after each change; the server first sees it when it is submitted. A revision sent back for
 * changes is loaded from the server, and its edits are kept here too until it is resubmitted.
 *
 * `prepare` drops what the editor keeps only while editing, such as blank rows; `afterRebase` lets
 * the editor reload what it shows for an item whose base version moved.
 */
export interface RevisionPayload {
  summary: string | null
  sources: string[]
  items: DraftItem[]
}

export function useRevisionDraft(options: {
  prepare?: (item: DraftItem) => DraftItem
  afterRebase?: (item: DraftItem) => Promise<void> | void
  /** Sends a new draft somewhere else than POST /revisions (e.g. approving a harvest candidate); answers the revision. */
  submitTo?: (payload: RevisionPayload) => Promise<Revision>
} = {}) {
  const { $api } = useNuxtApp()
  const { user } = useAuth()
  const { schema, pending: schemaPending } = useCatalogSchema()

  /** Which draft this is, see utils/localDrafts. */
  const scope = ref<string | null>(null)
  /** Set when continuing a revision sent back for changes. */
  const revisionId = ref<number | null>(null)
  const lockVersion = ref(0)
  const status = ref<RevisionStatus | null>(null)
  const items = ref<DraftItem[]>([])
  const summary = ref('')
  const sources = ref<string[]>([])
  const references = reactive<CatalogReferences>({})
  const saveState = ref<SaveState>('idle')
  const savedAt = ref<string | null>(null)
  /** Whether this browser holds the draft (it is written on the first change). */
  const persisted = ref(false)
  /** Set when the editor opened with edits this browser had kept: when they were last saved. */
  const restoredAt = ref<string | null>(null)
  const lastError = ref<unknown>(null)
  const busy = ref(false)

  let createdAt: string | null = null
  /** Refs of the items the server has, so items removed here are dropped on resubmission. */
  let serverRefs = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let applying = false
  /** The draft as opened: a draft not stored yet is only written once it differs from this. */
  let baseline = ''

  // The raw objects behind the reactive ones: copying them skips the proxies, which is several times faster.
  const serialized = () => JSON.stringify({ items: toRaw(items.value), summary: summary.value, sources: toRaw(sources.value) })

  const apply = (next: Snapshot) => {
    applying = true
    items.value = next.items
    summary.value = next.summary
    sources.value = next.sources
    nextTick(() => { applying = false })
  }

  /** Resolves once GET /catalog/schema has answered, whether or not it succeeded. */
  const schemaLoaded = () => new Promise<void>((resolve) => {
    if (!schemaPending.value) return resolve()
    const stop = watch(schemaPending, (value) => {
      if (value) return
      stop()
      resolve()
    })
  })

  /** A saved document as the editors bind it: required text fields the server stored empty come back as ''. */
  const editable = (type: string, document: Record<string, unknown>) => {
    const aggregate = schema.value?.aggregates?.[type] as { fields: SchemaField[], collections: SchemaCollection[] } | undefined
    return aggregate ? fillRequiredText(document, aggregate) : document
  }

  const read = async () => {
    const id = user.value?.id
    if (!id || !scope.value) return undefined
    try { return await localDrafts.get(id, scope.value) }
    catch { return undefined }
  }

  const adopt = (record: LocalDraft) => {
    Object.assign(references, record.references)
    apply({ items: record.items, summary: record.summary, sources: record.sources })
    createdAt = record.createdAt
    persisted.value = true
    savedAt.value = record.updatedAt
    restoredAt.value = record.updatedAt
    saveState.value = 'saved'
  }

  /**
   * Starts editing these items as draft `draftScope`. When this browser kept edits for that scope
   * (an entity edited before, a revision sent back), they replace `initial`; returns whether they did.
   */
  async function start(initial: DraftItem[], draftScope: string, meta: { summary?: string, sources?: string[] } = {}) {
    dropLegacyBackups()
    clearTimeout(timer)
    scope.value = draftScope
    createdAt = null
    persisted.value = false
    restoredAt.value = null
    savedAt.value = null
    apply({ items: initial, summary: meta.summary ?? '', sources: meta.sources ?? [] })
    baseline = serialized()
    saveState.value = 'idle'
    const record = await read()
    if (record) adopt(record)
    return !!record
  }

  /** Continues a draft kept in this browser, e.g. of a new album; null when there is none. */
  async function resume(draftScope: string) {
    dropLegacyBackups()
    scope.value = draftScope
    const record = await read()
    if (record) adopt(record)
    return record ?? null
  }

  /**
   * Continues a revision sent back for changes. Items that went live at submission (applied_at) are
   * not part of it any more: that content is edited directly. Edits kept in this browser win.
   */
  async function loadRevision(id: number) {
    const [revision] = await Promise.all([$api<Revision>(`/v1/revisions/${id}`), schemaLoaded()])
    revisionId.value = revision.id
    lockVersion.value = revision.lock_version
    status.value = revision.status
    const open = (revision.items ?? []).filter(item => !item.applied_at)
    serverRefs = new Set(open.map(item => item.ref))
    Object.assign(references, revision.references ?? {})
    await start(open.map(item => ({
      ref: item.ref,
      resource_type: item.resource_type,
      action: item.action,
      ...(item.resource_id ? { resource_id: item.resource_id } : {}),
      ...(item.base_version !== null ? { base_version: item.base_version } : {}),
      ...(item.document ? { document: editable(item.resource_type, item.document) } : {}),
      ...(item.impact_checksum ? { impact_checksum: item.impact_checksum } : {}),
      ...(item.acknowledged_duplicate_ids?.length ? { acknowledged_duplicate_ids: item.acknowledged_duplicate_ids } : {}),
    })), `revision:${id}`, { summary: revision.summary ?? '', sources: revision.sources })
    return revision
  }

  /** The items as they are sent. */
  const prepared = computed(() => items.value.map(item => options.prepare ? options.prepare(item) : item))

  const payload = (): RevisionPayload => ({
    summary: summary.value || null,
    sources: sources.value.map(source => source.trim()).filter(Boolean),
    items: prepared.value,
  })

  /** Writes the draft to this browser. Nothing is written before the first change. */
  async function save(): Promise<void> {
    clearTimeout(timer)
    const id = user.value?.id
    if (!id || !scope.value || (!persisted.value && saveState.value !== 'dirty' && saveState.value !== 'error')) return
    if (!persisted.value && serialized() === baseline) {
      saveState.value = 'idle'
      return
    }
    const main = mainItem(items.value)
    const now = new Date().toISOString()
    createdAt ??= now
    saveState.value = 'saving'
    try {
      await localDrafts.put({
        key: draftKey(id, scope.value),
        userId: id,
        scope: scope.value,
        mainRef: main?.ref ?? 'main',
        type: main?.resource_type ?? 'album',
        action: main?.action ?? 'create',
        entityId: main?.resource_id ?? null,
        revisionId: revisionId.value,
        label: String(main?.document?.title ?? main?.document?.name ?? ''),
        items: toRaw(items.value),
        summary: summary.value,
        sources: toRaw(sources.value),
        references: toRaw(references),
        createdAt,
        updatedAt: now,
      })
      persisted.value = true
      savedAt.value = now
      lastError.value = null
      // Edits made while writing leave it dirty, with another save scheduled.
      if (saveState.value === 'saving') saveState.value = 'saved'
    }
    catch (error) {
      lastError.value = error
      saveState.value = 'error'
    }
  }

  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => { void save() }, SAVE_DELAY)
  }

  watch([items, summary, sources], () => {
    if (applying) return
    saveState.value = 'dirty'
    schedule()
  }, { deep: true })

  /** Deletes this browser's copy. */
  async function forget() {
    clearTimeout(timer)
    const id = user.value?.id
    if (id && scope.value) await localDrafts.remove(id, scope.value).catch(() => undefined)
    persisted.value = false
    restoredAt.value = null
    savedAt.value = null
    saveState.value = 'idle'
  }

  /**
   * Submits the draft and forgets it here; returns the revision (approved at once for trusted
   * editors). A revision sent back gets the edits first (PUT), then is submitted again. On failure
   * the draft stays in this browser.
   */
  async function submit(): Promise<Revision> {
    busy.value = true
    try {
      clearTimeout(timer)
      let revision: Revision
      if (revisionId.value) {
        const current = new Set(items.value.map(item => item.ref))
        const saved = await $api<Revision>(`/v1/revisions/${revisionId.value}`, {
          method: 'PUT',
          body: { ...payload(), removed_refs: [...serverRefs].filter(ref => !current.has(ref)), lock_version: lockVersion.value },
        })
        lockVersion.value = saved.lock_version
        serverRefs = new Set((saved.items ?? []).filter(item => !item.applied_at).map(item => item.ref))
        revision = await $api<Revision>(`/v1/revisions/${revisionId.value}/submit`, { method: 'POST' })
      }
      else {
        revision = options.submitTo ? await options.submitTo(payload()) : await $api<Revision>('/v1/revisions', { method: 'POST', body: payload() })
      }
      status.value = revision.status
      await forget()
      return revision
    }
    finally {
      busy.value = false
    }
  }

  /** Throws the draft away: this browser's copy only; a revision sent back stays as it is on the server. */
  const discard = () => forget()

  /**
   * Merges update item `ref` onto the current version of its entity (POST /revisions/rebase), keeping
   * the given side of each conflict; the item is then based on that version.
   */
  async function rebase(ref: string, resolutions: Record<string, 'mine' | 'current'>) {
    const result = await $api<{ document: Record<string, unknown>, base_version: number }>('/v1/revisions/rebase', {
      method: 'POST', body: { ...payload(), ref, resolutions },
    })
    const item = items.value.find(entry => entry.ref === ref)
    if (!item) return
    item.document = editable(item.resource_type, result.document)
    item.base_version = result.base_version
    await options.afterRebase?.(item)
  }

  const hasUnsaved = () => saveState.value === 'dirty' || saveState.value === 'saving' || saveState.value === 'error'

  if (import.meta.client) {
    // Leaving or hiding the page writes pending edits at once.
    const flush = () => { if (hasUnsaved()) void save() }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsaved()) return
      void save()
      event.preventDefault()
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    onMounted(() => {
      window.addEventListener('beforeunload', beforeUnload)
      window.addEventListener('pagehide', flush)
      document.addEventListener('visibilitychange', onVisibility)
    })
    onBeforeUnmount(() => {
      clearTimeout(timer)
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    })
  }

  return {
    scope, revisionId, lockVersion, status, items, prepared, summary, sources, references, saveState, savedAt, persisted, restoredAt, lastError, busy,
    start, resume, loadRevision, save, submit, discard, rebase, hasUnsaved,
  }
}
