import type { CatalogReferences } from '~/types/catalog'
import type { Revision, RevisionItemInput, RevisionStatus } from '~/types/revision'
import { errorName } from '~/utils/revisionErrors'

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

const SAVE_DELAY = 3000
const SAVE_MAX_WAIT = 20000
const BACKUP_PREFIX = 'cdcat:revision-draft:'

/**
 * A catalog revision being edited (docs/catalog/editing.md#修订): the items and their documents,
 * the edit summary and sources. After the first change it is saved as a server draft three seconds
 * after editing stops (POST /revisions with submit=false, then PUT with lock_version), with a
 * local backup until the server has it. A lock_version mismatch stops autosave and exposes the
 * server's copy in `conflict` until the editor keeps theirs or takes the server's.
 */
export function useRevisionDraft(backupId: string, options: { prepare?: (item: DraftItem) => DraftItem } = {}) {
  const { $api } = useNuxtApp()
  const revisionId = ref<number | null>(null)
  const lockVersion = ref(0)
  const status = ref<RevisionStatus | null>(null)
  const items = ref<DraftItem[]>([])
  const summary = ref('')
  const sources = ref<string[]>([])
  const references = reactive<CatalogReferences>({})
  const saveState = ref<SaveState>('idle')
  const savedAt = ref<string | null>(null)
  const lastError = ref<unknown>(null)
  const conflict = shallowRef<Revision | null>(null)
  const backup = shallowRef<(Snapshot & { at: string }) | null>(null)
  const busy = ref(false)
  const autosave = ref(true)

  let saved = ''
  /** Refs of the items the server has, so removed items can be dropped from the draft. */
  let serverRefs = new Set<string>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let firstChangeAt = 0
  let inflight: Promise<void> | null = null
  let applying = false

  const snapshot = (): Snapshot => ({ items: toRaw(items.value).map(item => ({ ...item })), summary: summary.value, sources: [...sources.value] })
  const serialized = () => JSON.stringify(snapshot())
  const backupKey = () => `${BACKUP_PREFIX}${backupId}`

  const writeBackup = () => {
    try { localStorage.setItem(backupKey(), JSON.stringify({ ...snapshot(), at: new Date().toISOString() })) }
    catch { /* private mode or storage full: the server copy still saves */ }
  }
  const clearBackup = () => {
    try { localStorage.removeItem(backupKey()) }
    catch { /* nothing to clear */ }
  }

  const apply = (next: Snapshot) => {
    applying = true
    items.value = next.items
    summary.value = next.summary
    sources.value = next.sources
    saved = serialized()
    nextTick(() => { applying = false })
  }

  /** Starts editing these items; an unsaved local copy from an earlier visit is offered back. */
  function start(initial: DraftItem[], meta: { summary?: string, sources?: string[] } = {}) {
    apply({ items: initial, summary: meta.summary ?? '', sources: meta.sources ?? [] })
    saveState.value = 'idle'
    try {
      const stored = JSON.parse(localStorage.getItem(backupKey()) ?? 'null') as (Snapshot & { at: string }) | null
      if (stored && JSON.stringify({ items: stored.items, summary: stored.summary, sources: stored.sources }) !== saved) backup.value = stored
      else clearBackup()
    }
    catch { backup.value = null }
  }

  /**
   * Continues a saved draft, or a revision sent back for changes. Items that went live at
   * submission (applied_at) are not part of the draft any more: that content is edited directly.
   */
  async function loadRevision(id: number) {
    const revision = await $api<Revision>(`/v1/revisions/${id}`)
    adopt(revision)
    start((revision.items ?? []).filter(item => !item.applied_at).map(item => ({
      ref: item.ref,
      resource_type: item.resource_type,
      action: item.action,
      ...(item.resource_id ? { resource_id: item.resource_id } : {}),
      ...(item.base_version !== null ? { base_version: item.base_version } : {}),
      ...(item.document ? { document: item.document } : {}),
      ...(item.impact_checksum ? { impact_checksum: item.impact_checksum } : {}),
      ...(item.acknowledged_duplicate_ids?.length ? { acknowledged_duplicate_ids: item.acknowledged_duplicate_ids } : {}),
    })), { summary: revision.summary ?? '', sources: revision.sources })
    return revision
  }

  const adopt = (revision: Revision) => {
    revisionId.value = revision.id
    // Applied items are never sent back, so they are not "removed" by leaving the draft either.
    serverRefs = new Set((revision.items ?? []).filter(item => !item.applied_at).map(item => item.ref))
    lockVersion.value = revision.lock_version
    status.value = revision.status
    savedAt.value = revision.updated_at
    Object.assign(references, revision.references ?? {})
  }

  /** The items as they are sent: `prepare` drops what the editor keeps only while editing, such as blank rows. */
  const prepared = computed(() => items.value.map(item => options.prepare ? options.prepare(item) : item))

  const payload = () => ({
    summary: summary.value || null,
    sources: sources.value.map(source => source.trim()).filter(Boolean),
    items: prepared.value,
  })

  async function save(): Promise<void> {
    clearTimeout(timer)
    if (inflight) {
      await inflight
      return serialized() !== saved ? save() : undefined
    }
    if (serialized() === saved || conflict.value) return
    // A submitted revision is no longer a draft; changes wait for the next submit.
    if (status.value && !['draft', 'changes_requested'].includes(status.value)) return
    saveState.value = 'saving'
    const sent = serialized()
    inflight = (async () => {
      try {
        const current = new Set(items.value.map(item => item.ref))
        const removedRefs = [...serverRefs].filter(ref => !current.has(ref))
        const revision = revisionId.value
          ? await $api<Revision>(`/v1/revisions/${revisionId.value}`, { method: 'PUT', body: { ...payload(), removed_refs: removedRefs, lock_version: lockVersion.value } })
          : await $api<Revision>('/v1/revisions', { method: 'POST', body: { ...payload(), submit: false } })
        adopt(revision)
        saved = sent
        firstChangeAt = 0
        lastError.value = null
        const pendingAfter = serialized() !== saved
        saveState.value = pendingAfter ? 'dirty' : 'saved'
        if (pendingAfter) schedule()
        else clearBackup()
      }
      catch (error) {
        lastError.value = error
        if (errorName(error) === 'REVISION_DRAFT_CONFLICT' && revisionId.value) {
          conflict.value = await $api<Revision>(`/v1/revisions/${revisionId.value}`)
        }
        saveState.value = 'error'
      }
      finally {
        inflight = null
      }
    })()
    await inflight
  }

  function schedule() {
    clearTimeout(timer)
    if (!autosave.value) return
    if (!firstChangeAt) firstChangeAt = Date.now()
    const wait = Math.max(0, Math.min(SAVE_DELAY, firstChangeAt + SAVE_MAX_WAIT - Date.now()))
    timer = setTimeout(() => { void save() }, wait)
  }

  watch([items, summary, sources], () => {
    if (applying) return
    saveState.value = 'dirty'
    writeBackup()
    schedule()
  }, { deep: true })

  /** Saves this page's copy over the newer server copy. */
  async function keepMine() {
    if (!conflict.value) return
    lockVersion.value = conflict.value.lock_version
    conflict.value = null
    saved = ''
    await save()
  }

  /** Drops local edits in favour of the server's copy. */
  async function useServer() {
    if (!conflict.value) return
    const id = conflict.value.id
    conflict.value = null
    await loadRevision(id)
    clearBackup()
    saveState.value = 'saved'
  }

  function restoreBackup() {
    if (!backup.value) return
    const { items: storedItems, summary: storedSummary, sources: storedSources } = backup.value
    items.value = storedItems
    summary.value = storedSummary
    sources.value = storedSources
    backup.value = null
  }

  function dismissBackup() {
    backup.value = null
    clearBackup()
  }

  /**
   * Saves the latest edits as a draft, then submits it; returns the revision (approved at once for
   * trusted editors). Going through a draft means a conflict always leaves a revision to rebase.
   * Returns null when nothing was changed.
   */
  async function submit(): Promise<Revision | null> {
    busy.value = true
    try {
      clearTimeout(timer)
      await save()
      if (saveState.value === 'error') throw lastError.value
      if (!revisionId.value) return null
      const revision = await $api<Revision>(`/v1/revisions/${revisionId.value}/submit`, { method: 'POST' })
      adopt(revision)
      clearBackup()
      saveState.value = 'saved'
      return revision
    }
    finally {
      busy.value = false
    }
  }

  /** Deletes the server draft (never submitted) and the local copy. */
  async function discard() {
    clearTimeout(timer)
    if (revisionId.value && status.value === 'draft') await $api(`/v1/revisions/${revisionId.value}`, { method: 'DELETE' })
    clearBackup()
    revisionId.value = null
    status.value = null
    saveState.value = 'idle'
  }

  const hasUnsaved = () => saveState.value === 'dirty' || saveState.value === 'saving' || (saveState.value === 'error' && serialized() !== saved)

  if (import.meta.client) {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsaved()) return
      writeBackup()
      event.preventDefault()
    }
    onMounted(() => window.addEventListener('beforeunload', beforeUnload))
    onBeforeUnmount(() => {
      clearTimeout(timer)
      window.removeEventListener('beforeunload', beforeUnload)
    })
  }

  return {
    revisionId, lockVersion, status, items, prepared, summary, sources, references, saveState, savedAt, lastError, conflict, backup, busy, autosave,
    start, loadRevision, save, submit, discard, keepMine, useServer, restoreBackup, dismissBackup, hasUnsaved,
  }
}
