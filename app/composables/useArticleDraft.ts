import type { ArticleDraftFields, ArticleEditPayload, ContentLinkSummary, TagSummary } from '~/types/article'
import { DEFAULT_ARTICLE_LICENSE } from '~/utils/articleLicenses'
import { tagPayload } from '~/utils/tags'

/** The editable state of the writing page; links and tags keep their display data. */
export interface ArticleDraftForm {
  type: ArticleDraftFields['type']
  title: string
  summary: string
  cover_url: string
  banner_url: string
  content: string
  license: ArticleDraftFields['license']
  is_repost: boolean
  source_url: string
  source_author: string
  slug: string
  links: ContentLinkSummary[]
  tags: TagSummary[]
}

/** What this browser keeps of unsaved edits: the form, and the server revision it started from. */
interface LocalCopy {
  form: ArticleDraftForm
  revision: number
  at: string
}

const LOCAL_DELAY = 1000
const LOCAL_PREFIX = 'cdcat:article-draft:'

const emptyForm = (): ArticleDraftForm => ({
  type: null, title: '', summary: '', cover_url: '', banner_url: '', content: '',
  license: DEFAULT_ARTICLE_LICENSE, is_repost: false, source_url: '', source_author: '', slug: '', links: [], tags: [],
})

const formFrom = (payload: ArticleEditPayload): ArticleDraftForm => ({
  type: payload.article.type,
  title: payload.article.title ?? '',
  summary: payload.article.summary ?? '',
  cover_url: payload.article.cover_url ?? '',
  banner_url: payload.article.banner_url ?? '',
  content: payload.article.content ?? '',
  license: payload.article.license ?? DEFAULT_ARTICLE_LICENSE,
  is_repost: payload.article.is_repost ?? false,
  source_url: payload.article.source_url ?? '',
  source_author: payload.article.source_author ?? '',
  slug: payload.article.slug ?? '',
  links: payload.article.links,
  tags: payload.article.tags,
})

/** What the API stores for each field; used to send only what changed. */
const serialize = (form: ArticleDraftForm): Record<keyof ArticleDraftFields, unknown> => ({
  type: form.type,
  title: form.title,
  summary: form.summary,
  cover_url: form.cover_url.trim(),
  banner_url: form.banner_url.trim(),
  content: form.content,
  license: form.license,
  is_repost: form.is_repost,
  source_url: form.source_url.trim(),
  source_author: form.source_author.trim(),
  slug: form.slug.trim(),
  links: form.links.map(link => ({ type: link.type, id: link.id })),
  ...tagPayload(form.tags),
})

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Deletes every article draft kept in this browser; logging out calls it. */
export function clearLocalArticleDrafts() {
  try {
    Object.keys(localStorage).filter(key => key.startsWith(LOCAL_PREFIX)).forEach(key => localStorage.removeItem(key))
  }
  catch { /* storage unavailable */ }
}

/** The unsaved new article kept in this browser for the user, if any: its title and when it was written. */
export function localNewArticleDraft(userId: number | undefined): { title: string, at: string } | null {
  try {
    const local = JSON.parse(localStorage.getItem(`${LOCAL_PREFIX}${userId ?? 'guest'}:new`) ?? 'null') as LocalCopy | null
    return local ? { title: local.form.title, at: local.at } : null
  }
  catch { return null }
}

/** Drops the unsaved new article kept in this browser, so the writer starts blank. */
export function clearLocalNewArticleDraft(userId: number | undefined) {
  try { localStorage.removeItem(`${LOCAL_PREFIX}${userId ?? 'guest'}:new`) }
  catch { /* storage unavailable */ }
}

type ApiError = { name?: string }

/**
 * The writing page's article (docs/articles/README.md#保存与草稿). Edits are saved in this browser
 * a second after typing stops and never sent on their own: the server only hears of them when the
 * author saves the draft, updates a published article or publishes. Reopening the article brings
 * the unsaved edits back; if the article was saved elsewhere since, the author chooses. A save
 * based on an older revision is refused and exposes the server's copy in `conflict`.
 */
export function useArticleDraft(initialId: number | null, options: { onCreated?: (id: number) => void } = {}) {
  const { $api } = useNuxtApp()
  const { user } = useAuth()
  const articleId = ref<number | null>(initialId)
  const payload = shallowRef<ArticleEditPayload | null>(null)
  const form = reactive<ArticleDraftForm>(emptyForm())
  const revision = ref(0)
  const savedAt = ref<string | null>(null)
  const dirty = ref(false)
  const lastError = ref<unknown>(null)
  const conflict = shallowRef<ArticleEditPayload | null>(null)
  /** When the unsaved edits brought back on opening were made. */
  const restoredAt = ref<string | null>(null)
  /** Unsaved edits made before the article was saved elsewhere; the author keeps or drops them. */
  const stale = shallowRef<LocalCopy | null>(null)
  const busy = ref(false)

  let saved = serialize(form)
  let timer: ReturnType<typeof setTimeout> | undefined
  let applying = false

  const canEdit = computed(() => !payload.value || payload.value.can.edit)
  const changedFields = () => {
    const current = serialize(form)
    const changes = Object.fromEntries(Object.entries(current).filter(([key, value]) => !same(value, saved[key as keyof ArticleDraftFields])))
    // Either tag field replaces the whole list, so they always go together.
    if ('tag_ids' in changes || 'new_tags' in changes) Object.assign(changes, { tag_ids: current.tag_ids, new_tags: current.new_tags })
    return changes
  }
  const hasUnsaved = () => Object.keys(changedFields()).length > 0

  const localKey = (id = articleId.value) => `${LOCAL_PREFIX}${user.value?.id ?? 'guest'}:${id ?? 'new'}`
  const readLocal = (): LocalCopy | null => {
    try {
      const local = JSON.parse(localStorage.getItem(localKey()) ?? 'null') as LocalCopy | null
      // Copies kept before a field existed get its default.
      return local?.form ? { ...local, form: { ...emptyForm(), ...local.form } } : null
    }
    catch { return null }
  }
  const writeLocal = () => {
    clearTimeout(timer)
    try { localStorage.setItem(localKey(), JSON.stringify({ form: copy(form), revision: revision.value, at: new Date().toISOString() })) }
    catch { /* private mode or storage full: the edits stay in the page */ }
  }
  const clearLocal = (key = localKey()) => {
    clearTimeout(timer)
    try { localStorage.removeItem(key) }
    catch { /* nothing to clear */ }
  }

  /** Takes the server's copy as the saved state. */
  const apply = (next: ArticleEditPayload) => {
    applying = true
    payload.value = next
    revision.value = next.article.revision
    Object.assign(form, formFrom(next))
    saved = serialize(form)
    savedAt.value = next.article.updated_at
    dirty.value = false
    nextTick(() => { applying = false })
  }

  /** Takes the server's copy, keeping edits made since `sent` (what the request carried) on top. */
  const adopt = (next: ArticleEditPayload, sent: Record<string, unknown>) => {
    const mine = same(serialize(form), sent) ? null : copy(form)
    apply(next)
    if (mine) Object.assign(form, mine)
    else clearLocal()
  }

  watch(form, () => {
    if (applying || !canEdit.value) return
    dirty.value = hasUnsaved()
    clearTimeout(timer)
    if (dirty.value) timer = setTimeout(writeLocal, LOCAL_DELAY)
    else clearLocal()
  }, { deep: true })

  async function load() {
    if (articleId.value) apply(await $api<ArticleEditPayload>(`/v1/articles/${articleId.value}/edit`))
    const local = readLocal()
    if (!local || !canEdit.value) return
    if (same(serialize(local.form), saved)) {
      clearLocal()
    }
    else if (!articleId.value || local.revision === revision.value) {
      Object.assign(form, local.form)
      restoredAt.value = local.at
    }
    else {
      stale.value = local
    }
  }

  /** Sends the form to the server: a plain save, or a save that also publishes. */
  async function persist(action: 'save' | 'publish'): Promise<ArticleEditPayload | null> {
    if (!canEdit.value || conflict.value) return null
    busy.value = true
    lastError.value = null
    const sent = serialize(form)
    try {
      if (!articleId.value) {
        const newKey = localKey(null)
        const created = await $api<ArticleEditPayload>('/v1/articles', { method: 'POST', body: sent })
        articleId.value = created.article.id
        options.onCreated?.(created.article.id)
        clearLocal(newKey)
        adopt(created, sent)
        if (action === 'save') return created
      }
      else if (action === 'save' && !hasUnsaved()) {
        return payload.value
      }
      const body = { ...changedFields(), revision: revision.value }
      const next = await $api<ArticleEditPayload>(action === 'publish' ? `/v1/articles/${articleId.value}/publish` : `/v1/articles/${articleId.value}`, {
        method: action === 'publish' ? 'POST' : 'PUT', body,
      })
      adopt(next, sent)
      return next
    }
    catch (error) {
      lastError.value = error
      if ((error as ApiError).name === 'ARTICLE_DRAFT_CONFLICT' && articleId.value) {
        conflict.value = await $api<ArticleEditPayload>(`/v1/articles/${articleId.value}/edit`)
      }
      throw error
    }
    finally {
      busy.value = false
    }
  }

  /** Takes a published article off the site; unsaved edits stay in the page. */
  async function hide() {
    if (!articleId.value) return null
    busy.value = true
    try {
      const before = saved
      const next = await $api<ArticleEditPayload>(`/v1/articles/${articleId.value}/hide`, { method: 'POST' })
      adopt(next, before)
      return next
    }
    finally {
      busy.value = false
    }
  }

  /** Keeps the author's text over the server's: the next save overwrites the newer copy. */
  function keepMine() {
    if (!conflict.value) return
    const mine = copy(form)
    apply(conflict.value)
    conflict.value = null
    Object.assign(form, mine)
  }

  /** Drops local edits in favour of the server's copy. */
  function useServer() {
    if (!conflict.value) return
    apply(conflict.value)
    conflict.value = null
    clearLocal()
  }

  /** Puts back edits made before the article was saved elsewhere, to save over that copy. */
  function restoreStale() {
    if (!stale.value) return
    Object.assign(form, stale.value.form)
    stale.value = null
  }

  /** Forgets the unsaved edits kept in this browser and shows the saved article. */
  function discardLocal() {
    stale.value = null
    restoredAt.value = null
    clearLocal()
    applying = true
    Object.assign(form, payload.value ? formFrom(payload.value) : emptyForm())
    dirty.value = false
    nextTick(() => { applying = false })
  }

  if (import.meta.client) {
    // Leaving the page keeps the latest keystrokes too.
    const flush = () => { if (dirty.value && canEdit.value) writeLocal() }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty.value) return
      flush()
      event.preventDefault()
    }
    const hidden = () => { if (document.visibilityState === 'hidden') flush() }
    onMounted(() => {
      window.addEventListener('beforeunload', beforeUnload)
      document.addEventListener('visibilitychange', hidden)
    })
    onBeforeUnmount(() => {
      flush()
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('visibilitychange', hidden)
    })
  }

  return {
    articleId, payload, form, revision, savedAt, dirty, lastError, conflict, restoredAt, stale, busy, canEdit,
    load, save: () => persist('save'), publish: () => persist('publish'), hide, keepMine, useServer, restoreStale, discardLocal, hasUnsaved,
  }
}
