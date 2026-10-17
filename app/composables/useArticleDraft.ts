import type { ArticleDraftFields, ArticleDraftPayload, ContentLinkSummary, TagSummary } from '~/types/article'

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

/** The editable state of the writing page; links and tags keep their display data. */
export interface ArticleDraftForm {
  type: ArticleDraftFields['type']
  title: string
  summary: string
  cover_url: string
  content: string
  slug: string
  links: ContentLinkSummary[]
  tags: TagSummary[]
}

const SAVE_DELAY = 2000
const SAVE_MAX_WAIT = 15000
const BACKUP_PREFIX = 'cdcat:article-draft:'

const emptyForm = (): ArticleDraftForm => ({ type: null, title: '', summary: '', cover_url: '', content: '', slug: '', links: [], tags: [] })

const formFrom = (payload: ArticleDraftPayload): ArticleDraftForm => ({
  type: payload.draft.type,
  title: payload.draft.title ?? '',
  summary: payload.draft.summary ?? '',
  cover_url: payload.draft.cover_url ?? '',
  content: payload.draft.content ?? '',
  slug: payload.article.slug ?? '',
  links: payload.draft.links,
  tags: payload.draft.tags,
})

/** What the API stores for each field; used to send only what changed. */
const serialize = (form: ArticleDraftForm): Record<keyof ArticleDraftFields, unknown> => ({
  type: form.type,
  title: form.title,
  summary: form.summary,
  cover_url: form.cover_url.trim(),
  content: form.content,
  slug: form.slug.trim(),
  links: form.links.map(link => ({ type: link.type, id: link.id })),
  tag_ids: form.tags.map(tag => tag.id),
})

type ApiError = { name?: string, status?: number, details?: { details?: Record<string, unknown> } }

/**
 * The writing page's draft (docs/articles/README.md): loads the working copy, autosaves it two
 * seconds after typing stops (and at least every 15 seconds), keeps a local backup until the
 * server has it, and runs the submit / withdraw / publish / discard actions. A revision mismatch
 * stops autosave and exposes the server's copy in `conflict` until the author picks one.
 */
export function useArticleDraft(initialId: number | null, options: { onCreated?: (id: number) => void } = {}) {
  const { $api } = useNuxtApp()
  const articleId = ref<number | null>(initialId)
  const payload = shallowRef<ArticleDraftPayload | null>(null)
  const form = reactive<ArticleDraftForm>(emptyForm())
  const revision = ref(0)
  const saveState = ref<SaveState>('idle')
  const savedAt = ref<string | null>(null)
  const lastError = ref<unknown>(null)
  const conflict = shallowRef<ArticleDraftPayload | null>(null)
  const backup = shallowRef<{ form: ArticleDraftForm, at: string } | null>(null)
  const busy = ref(false)

  let saved = serialize(form)
  let timer: ReturnType<typeof setTimeout> | undefined
  let firstChangeAt = 0
  let inflight: Promise<void> | null = null
  let applying = false

  const canEdit = computed(() => !payload.value || payload.value.can.edit)
  const changedFields = () => {
    const current = serialize(form)
    return Object.fromEntries(Object.entries(current).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(saved[key as keyof ArticleDraftFields])))
  }
  const backupKey = () => `${BACKUP_PREFIX}${articleId.value ?? 'new'}`

  const writeBackup = () => {
    try { localStorage.setItem(backupKey(), JSON.stringify({ form: toRaw(form), at: new Date().toISOString() })) }
    catch { /* private mode or storage full: the server copy still saves */ }
  }
  const clearBackup = () => {
    try { localStorage.removeItem(backupKey()) }
    catch { /* nothing to clear */ }
  }

  const apply = (next: ArticleDraftPayload) => {
    applying = true
    payload.value = next
    revision.value = next.draft.revision
    Object.assign(form, formFrom(next))
    saved = serialize(form)
    nextTick(() => { applying = false })
  }

  async function load() {
    if (!articleId.value) return
    apply(await $api<ArticleDraftPayload>(`/v1/articles/${articleId.value}/draft`))
    savedAt.value = payload.value?.draft.updated_at ?? null
    saveState.value = 'idle'
    // A backup left by a session that closed before saving is offered back, never applied silently.
    try {
      const stored = JSON.parse(localStorage.getItem(backupKey()) ?? 'null') as { form: ArticleDraftForm, at: string } | null
      if (stored && JSON.stringify(serialize(stored.form)) !== JSON.stringify(saved)) backup.value = stored
      else clearBackup()
    }
    catch { backup.value = null }
  }

  async function save(): Promise<void> {
    clearTimeout(timer)
    if (inflight) {
      await inflight
      return Object.keys(changedFields()).length ? save() : undefined
    }
    const changes = changedFields()
    if (!Object.keys(changes).length || !canEdit.value || conflict.value) return
    saveState.value = 'saving'
    const sent = serialize(form)
    inflight = (async () => {
      try {
        if (!articleId.value) {
          const created = await $api<ArticleDraftPayload>('/v1/articles', { method: 'POST', body: sent })
          clearBackup()
          articleId.value = created.article.id
          payload.value = created
          revision.value = created.draft.revision
          savedAt.value = created.draft.updated_at ?? null
          options.onCreated?.(created.article.id)
        }
        else {
          const result = await $api<{ revision: number, updated_at: string }>(`/v1/articles/${articleId.value}/draft`, {
            method: 'PUT', body: { ...changes, revision: revision.value },
          })
          revision.value = result.revision
          savedAt.value = result.updated_at
        }
        saved = sent
        firstChangeAt = 0
        lastError.value = null
        const pendingAfter = Object.keys(changedFields()).length > 0
        saveState.value = pendingAfter ? 'dirty' : 'saved'
        // Edits typed while this request ran go out in the next one.
        if (pendingAfter) schedule()
        else clearBackup()
      }
      catch (error) {
        lastError.value = error
        if ((error as ApiError).name === 'ARTICLE_DRAFT_CONFLICT' && articleId.value) {
          conflict.value = await $api<ArticleDraftPayload>(`/v1/articles/${articleId.value}/draft`)
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
    if (!firstChangeAt) firstChangeAt = Date.now()
    const wait = Math.max(0, Math.min(SAVE_DELAY, firstChangeAt + SAVE_MAX_WAIT - Date.now()))
    timer = setTimeout(() => { void save() }, wait)
  }

  watch(form, () => {
    if (applying || !canEdit.value) return
    saveState.value = 'dirty'
    writeBackup()
    schedule()
  }, { deep: true })

  /** Keeps the author's text over the server's by saving it on top of the newer revision. */
  async function keepMine() {
    if (!conflict.value) return
    revision.value = conflict.value.draft.revision
    saved = serialize(formFrom(conflict.value))
    conflict.value = null
    await save()
  }

  /** Drops local edits in favour of the server's copy. */
  function useServer() {
    if (!conflict.value) return
    apply(conflict.value)
    conflict.value = null
    clearBackup()
    saveState.value = 'saved'
  }

  function restoreBackup() {
    if (!backup.value) return
    Object.assign(form, backup.value.form)
    backup.value = null
  }

  function dismissBackup() {
    backup.value = null
    clearBackup()
  }

  /** Runs a workflow action after the latest edits are saved; the response replaces the draft. */
  async function act(action: 'submit' | 'withdraw' | 'publish' | 'discard', body: Record<string, unknown> = {}) {
    busy.value = true
    try {
      if (action === 'submit' || action === 'publish') {
        await save()
        if (saveState.value === 'error') throw lastError.value
      }
      if (!articleId.value) return
      const url = action === 'discard' ? `/v1/articles/${articleId.value}/draft` : `/v1/articles/${articleId.value}/${action}`
      const next = await $api<ArticleDraftPayload>(url, {
        method: action === 'discard' ? 'DELETE' : 'POST',
        body: action === 'withdraw' || action === 'discard' ? undefined : { ...body, revision: revision.value },
      })
      apply(next)
      clearBackup()
      saveState.value = 'saved'
      return next
    }
    finally {
      busy.value = false
    }
  }

  const hasUnsaved = () => saveState.value === 'dirty' || saveState.value === 'saving' || (saveState.value === 'error' && Object.keys(changedFields()).length > 0)

  if (import.meta.client) {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsaved()) return
      void save()
      event.preventDefault()
    }
    const hidden = () => { if (document.visibilityState === 'hidden' && hasUnsaved()) void save() }
    onMounted(() => {
      window.addEventListener('beforeunload', beforeUnload)
      document.addEventListener('visibilitychange', hidden)
    })
    onBeforeUnmount(() => {
      clearTimeout(timer)
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('visibilitychange', hidden)
    })
  }

  return {
    articleId, payload, form, revision, saveState, savedAt, lastError, conflict, backup, busy, canEdit,
    load, save, act, keepMine, useServer, restoreBackup, dismissBackup, hasUnsaved,
  }
}
