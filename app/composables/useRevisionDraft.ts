import type { SchemaCollection, SchemaField } from '~/composables/useDocumentSchema'
import type { CatalogReferences } from '~/types/catalog'
import type { Revision, RevisionItemInput, RevisionStatus } from '~/types/revision'
import type { LocalDraft } from '~/utils/localDrafts'
import { draftKey, dropLegacyBackups, localDrafts } from '~/utils/localDrafts'
import type { DraftRemote, PersonalDraft, ServerDraft, ServerDraftChange, ServerDraftMeta } from '~/utils/serverDrafts'
import { DRAFT_CHANGED_ERRORS, draftRemote, serverDraftTarget } from '~/utils/serverDrafts'
import { errorName } from '~/utils/revisionErrors'
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

/** How often an open server draft looks for a newer version (the model's edits), while the page is visible. */
const REMOTE_CHECK = 20_000

/**
 * A draft kept on the server too (utils/serverDrafts): off (browser only), syncing, synced, unsaved (a member's draft
 * saved to CDCat with edits here since), conflict (the server has a newer version while this copy has edits it has not
 * taken), error (the server could not be reached or refused it; edits stay here).
 */
export type SyncState = 'off' | 'syncing' | 'synced' | 'unsaved' | 'conflict' | 'error'

/**
 * A catalog revision being edited (docs/catalog/editing.md#草稿): the items and their documents,
 * the edit summary and sources. The draft is kept in this browser (utils/localDrafts), saved there
 * shortly after each change; the server first sees it when it is submitted. A revision sent back for
 * changes is loaded from the server, and its edits are kept here too until it is resubmitted. A
 * harvest candidate's draft is also kept on the server (utils/serverDrafts), shared with the other
 * reviewers and the MCP server: each save goes there too. A member's draft goes to CDCat when they
 * ask (`saveToServer`), and opens from there on another device; a model may edit it there. Either
 * way a newer version there is offered (`remote`) rather than taken or overwritten unseen.
 *
 * `prepare` drops what the editor keeps only while editing, such as blank rows; `afterRebase` lets
 * the editor reload what it shows for an item whose base version moved.
 */
export interface RevisionDraftPayload {
  summary: string | null
  sources: string[]
  items: DraftItem[]
}

export function useRevisionDraft(options: {
  prepare?: (item: DraftItem) => DraftItem
  afterRebase?: (item: DraftItem) => Promise<void> | void
  /** Sends a new draft somewhere else than POST /revisions (e.g. approving a harvest candidate); answers the revision. */
  submitTo?: (payload: RevisionDraftPayload) => Promise<Revision>
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
  const target = computed(() => serverDraftTarget(scope.value))
  /** The candidate whose shared server draft this is, or null. */
  const serverId = computed(() => target.value?.kind === 'harvest' ? target.value.candidateId : null)
  /** harvest: shared, each change goes up; personal: saved to CDCat when the member asks; null: this browser only. */
  const serverKind = computed(() => target.value?.kind ?? null)
  const server = computed<DraftRemote | null>(() => target.value ? draftRemote(target.value) : null)
  /** The server version this copy was loaded or last saved as; null before the server has it. */
  const serverVersion = ref<number | null>(null)
  /** The server copy as last loaded or saved: when, how, and when a member's draft expires there. */
  const serverMeta = ref<ServerDraftMeta | null>(null)
  const syncState = ref<SyncState>('off')
  /** Where the edits the editor opened with came from: this browser, or the copy saved to CDCat. */
  const restoredFrom = ref<'local' | 'server'>('local')
  /** A newer server version than this copy, with the MCP edits made since; offered to load. */
  const remote = ref<{ meta: ServerDraftMeta, changes: ServerDraftChange[] } | null>(null)
  /** Changed here since the server last took it. */
  let unsynced = false
  let pushing: Promise<void> | null = null
  let pushAgain = false

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

  /** Whether the server keeps this draft: a candidate's always, a member's once saved to CDCat. */
  const tracked = () => serverKind.value === 'harvest' || (serverKind.value === 'personal' && serverVersion.value !== null)

  const adopt = (record: LocalDraft) => {
    serverVersion.value = record.serverVersion ?? null
    // A candidate's copy from before drafts were on the server has edits the server never saw.
    unsynced = record.unsynced ?? serverKind.value === 'harvest'
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
    const record = await readReconciled()
    if (record) adopt(record)
    if (record) void afterOpen()
    return !!record
  }

  /** Continues a draft kept in this browser, e.g. of a new album; null when there is none. */
  async function resume(draftScope: string) {
    dropLegacyBackups()
    scope.value = draftScope
    const record = await readReconciled()
    if (record) adopt(record)
    if (record) void afterOpen()
    return record ?? null
  }

  /** The server's draft as this browser keeps it; a member's says what it is about, a model may have written it. */
  const fromServer = (copy: ServerDraft | PersonalDraft, local?: LocalDraft): LocalDraft => {
    const id = user.value!.id
    const main = mainItem(copy.items)
    const personal = 'scope' in copy ? copy : null
    return {
      key: draftKey(id, scope.value!), userId: id, scope: scope.value!, mainRef: personal?.main_ref ?? main?.ref ?? local?.mainRef ?? 'main',
      type: personal?.type ?? main?.resource_type ?? 'album', action: personal?.action ?? main?.action ?? 'create',
      entityId: personal ? personal.entity_id : main?.resource_id ?? null, revisionId: personal?.revision_id ?? local?.revisionId ?? null,
      label: personal?.label || String(main?.document?.title ?? main?.document?.name ?? local?.label ?? ''),
      items: copy.items.map(item => item.document ? { ...item, document: editable(item.resource_type, item.document) } : item),
      summary: copy.summary ?? '', sources: copy.sources ?? [],
      references: { ...(local?.references ?? {}), ...copy.references },
      createdAt: local?.createdAt ?? copy.updated_at ?? new Date().toISOString(), updatedAt: copy.updated_at ?? new Date().toISOString(),
      serverVersion: copy.version, unsynced: false,
    }
  }

  /** A member's copy gone from CDCat (submitted or deleted elsewhere, expired): this browser's is its own again. */
  const untrack = async (local?: LocalDraft) => {
    serverVersion.value = null
    serverMeta.value = null
    remote.value = null
    unsynced = false
    syncState.value = 'off'
    if (!local || local.serverVersion == null) return local
    const record = { ...local, serverVersion: null, unsynced: undefined }
    await localDrafts.put(record).catch(() => undefined)
    return record
  }

  /**
   * This browser's copy, made to agree with the server's for a server draft: the server's when this copy has
   * nothing it has not taken (or there is none here), this copy otherwise; when both changed, this copy, with the
   * server's version offered as a conflict.
   */
  const readReconciled = async (): Promise<LocalDraft | undefined> => {
    const local = await read()
    const api = server.value
    restoredFrom.value = 'local'
    remote.value = null
    serverMeta.value = null
    syncState.value = api ? 'syncing' : 'off'
    if (!api) return local
    let copy: ServerDraft | PersonalDraft | null
    try { copy = await api.load() }
    catch (error) {
      lastError.value = error
      // A member's draft never saved to CDCat does not miss it.
      syncState.value = serverKind.value === 'personal' && local?.serverVersion == null ? 'off' : 'error'
      return local
    }
    if (!copy) return serverKind.value === 'personal' ? untrack(local) : local
    serverMeta.value = copy
    const localUnsynced = local ? (local.unsynced ?? true) : false
    if (local && local.serverVersion === copy.version) return local
    if (!local || !localUnsynced) {
      const record = fromServer(copy, local)
      await localDrafts.put(record).catch(() => undefined)
      restoredFrom.value = 'server'
      return record
    }
    syncState.value = 'conflict'
    remote.value = { meta: copy, changes: [] }
    return local
  }

  /** Once opened: a candidate's edits the server has not taken go up; a member's wait for 「保存到 CDCat」. */
  const afterOpen = async () => {
    if (!serverKind.value || syncState.value === 'conflict' || syncState.value === 'error') return
    if (serverKind.value === 'personal') syncState.value = serverVersion.value === null ? 'off' : unsynced ? 'unsaved' : 'synced'
    else if (unsynced || serverVersion.value === null) await push()
    else syncState.value = 'synced'
  }

  /** What a member's draft list on CDCat shows of it (the candidate endpoint ignores these). */
  const describe = () => {
    const main = mainItem(items.value)
    return {
      label: String(main?.document?.title ?? main?.document?.name ?? ''), main_ref: main?.ref,
      type: main?.resource_type, action: main?.action, entity_id: main?.resource_id ?? null,
    }
  }

  /**
   * Sends this copy to the server, from the version it was made from. Refused when the server moved on: this
   * copy stays as it is and the newer version is offered (`remote`). One send at a time; edits made meanwhile
   * follow.
   */
  async function push(force = false): Promise<void> {
    const api = server.value
    if (!api || !user.value) return
    if (pushing) {
      pushAgain = true
      return pushing
    }
    if (syncState.value === 'conflict' && !force) return
    pushing = (async () => {
      syncState.value = 'syncing'
      const sent = serialized()
      try {
        const saved = await api.save({
          items: toRaw(items.value), summary: summary.value, sources: toRaw(sources.value), references: toRaw(references),
          version: force ? remote.value?.meta.version ?? null : serverVersion.value,
          ...(serverKind.value === 'personal' ? describe() : {}),
        })
        serverVersion.value = saved.version
        serverMeta.value = saved
        remote.value = null
        // A member's edits made while it was sent stay unsaved to CDCat; a candidate's follow (pushAgain).
        unsynced = serverKind.value === 'personal' && serialized() !== sent
        syncState.value = unsynced ? 'unsaved' : 'synced'
        const record = await read()
        if (record) await localDrafts.put({ ...record, serverVersion: saved.version, unsynced }).catch(() => undefined)
      }
      catch (error) {
        lastError.value = error
        if (DRAFT_CHANGED_ERRORS.includes(errorName(error) ?? '')) {
          syncState.value = 'conflict'
          await checkRemote(true)
        }
        else syncState.value = 'error'
      }
    })()
    try { await pushing }
    finally {
      pushing = null
      if (pushAgain) {
        pushAgain = false
        if (unsynced && syncState.value !== 'conflict') void push()
      }
    }
  }

  /** Looks for a newer server version than this copy; offers it with the MCP edits made since. */
  async function checkRemote(always = false): Promise<void> {
    const api = server.value
    if (!api || (pushing && !always) || !tracked()) return
    try {
      const { draft: meta, changes } = await api.meta(serverVersion.value ?? 0)
      if (!meta && serverKind.value === 'personal') {
        if (syncState.value !== 'conflict') await untrack(await read())
        return
      }
      if (meta && meta.version !== serverVersion.value) remote.value = { meta, changes }
      else if (!always) remote.value = null
    }
    catch { /* checked again later */ }
  }

  /** Takes the server's version in place of this copy (dropping edits here it has not taken). */
  async function pullRemote(): Promise<void> {
    const api = server.value
    if (!api) return
    clearTimeout(timer)
    const copy = await api.load()
    if (!copy) return
    const record = fromServer(copy, await read())
    await localDrafts.put(record).catch(() => undefined)
    adopt(record)
    serverMeta.value = copy
    restoredAt.value = null
    remote.value = null
    syncState.value = 'synced'
  }

  /**
   * 「保存到 CDCat」: writes pending edits here, then sends the draft to CDCat from the version it was loaded or
   * last saved as. Refused when CDCat has a newer one (another device's, the model's): that is offered instead.
   */
  async function saveToServer(): Promise<void> {
    if (serverKind.value !== 'personal') return
    if (hasUnsaved()) await save()
    await push()
  }

  /** Keeps this copy, replacing the server's newer version with it. */
  const keepMine = () => push(true)

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

  /**
   * The items as they are sent. A new entity nothing uses any more (its last credit was removed, say) is left out, so
   * it isn't created: an item is used when the main item, an edited entity or another used item names it ("@ref").
   */
  const prepared = computed(() => {
    const all = items.value.map(item => options.prepare ? options.prepare(item) : item)
    const main = mainItem(all)
    const used = new Set(all.filter(item => item === main || item.action !== 'create').map(item => item.ref))
    for (let grew = true; grew;) {
      grew = false
      const texts = all.filter(item => used.has(item.ref)).map(item => JSON.stringify(item.document ?? {}))
      for (const item of all) {
        if (!used.has(item.ref) && texts.some(text => text.includes(`"@${item.ref}"`))) {
          used.add(item.ref)
          grew = true
        }
      }
    }
    return all.filter(item => used.has(item.ref))
  })

  const payload = (): RevisionDraftPayload => ({
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
        ...(tracked() ? { serverVersion: serverVersion.value, unsynced: true } : {}),
      })
      if (serverKind.value === 'harvest') {
        unsynced = true
        void push()
      }
      else if (tracked()) {
        unsynced = true
        if (syncState.value === 'synced') syncState.value = 'unsaved'
      }
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

  /** Deletes this browser's copy, and the server's unless `server` is false (submitting deleted it there already). */
  async function forget(options: { server?: boolean } = {}) {
    clearTimeout(timer)
    const id = user.value?.id
    if (id && scope.value) await localDrafts.remove(id, scope.value).catch(() => undefined)
    // A candidate's shared copy goes too (approving deletes it on the server anyway); a member's when CDCat has one.
    const api = server.value
    if (api && options.server !== false && (serverKind.value === 'harvest' || serverVersion.value !== null || remote.value)) {
      await api.remove().catch(() => undefined)
    }
    serverVersion.value = null
    serverMeta.value = null
    remote.value = null
    syncState.value = 'off'
    unsynced = false
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
        // A new item no longer used is removed from the revision too.
        const current = new Set(prepared.value.map(item => item.ref))
        const saved = await $api<Revision>(`/v1/revisions/${revisionId.value}`, {
          method: 'PUT',
          body: { ...payload(), removed_refs: [...serverRefs].filter(ref => !current.has(ref)), lock_version: lockVersion.value },
        })
        lockVersion.value = saved.lock_version
        serverRefs = new Set((saved.items ?? []).filter(item => !item.applied_at).map(item => item.ref))
        revision = await $api<Revision>(`/v1/revisions/${revisionId.value}/submit`, { method: 'POST' })
      }
      else {
        // The draft's copy saved to CDCat goes once the revision is in (draft_scope); a revision sent back takes its own.
        revision = options.submitTo
          ? await options.submitTo(payload())
          : await $api<Revision>('/v1/revisions', { method: 'POST', body: { ...payload(), ...(serverKind.value === 'personal' ? { draft_scope: scope.value } : {}) } })
      }
      status.value = revision.status
      await forget({ server: serverKind.value === 'harvest' })
      return revision
    }
    finally {
      busy.value = false
    }
  }

  /** Throws the draft away, here and on CDCat; a revision sent back stays as it is on the server. */
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
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
      else void checkRemote()
    }
    // A server draft looks for a newer version now and then, and when the page comes back into view.
    let poll: ReturnType<typeof setInterval> | undefined
    onMounted(() => {
      window.addEventListener('beforeunload', beforeUnload)
      window.addEventListener('pagehide', flush)
      document.addEventListener('visibilitychange', onVisibility)
      poll = setInterval(() => { if (document.visibilityState === 'visible') void checkRemote() }, REMOTE_CHECK)
    })
    onBeforeUnmount(() => {
      clearInterval(poll)
      clearTimeout(timer)
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    })
  }

  return {
    scope, revisionId, lockVersion, status, items, prepared, summary, sources, references, saveState, savedAt, persisted, restoredAt, lastError, busy,
    start, resume, loadRevision, save, submit, discard, rebase, hasUnsaved, payload,
    serverId, serverKind, serverVersion, serverMeta, syncState, remote, restoredFrom, checkRemote, pullRemote, keepMine, saveToServer, sync: () => push(),
  }
}
