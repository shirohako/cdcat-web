<script setup lang="ts">
import { AlertTriangle, ArrowLeft, Columns2, EyeOff, Eye, History, ListTree, Loader2, Lock, PenLine, Save, Settings2, X } from '@lucide/vue'
import type { ArticleEditPayload } from '~/types/article'
import type { MarkdownHeading } from '~/utils/markdown'
import type { SubmitCheck } from './WriterSubmitDialog.vue'
import { TAG_NAME_MAX, tagErrorKey } from '~/utils/tags'

/**
 * The full-screen writing page for new and existing articles (docs/articles/README.md).
 * Edits are kept in this browser as you type; a draft reaches the server with「保存草稿」, a
 * published or hidden article with「更新」. A new article is created on its first save; the
 * address then switches to its edit URL without remounting, so the editor keeps its cursor.
 */
const props = defineProps<{ articleId: number | null }>()
const { t, locale } = useI18n()
const { hasPermission } = useAuth()
const { localizeError } = useLocalizedApiError()
const { showToast } = useToast()
const { site } = useSite()

const draft = useArticleDraft(props.articleId, {
  onCreated: (id) => { if (import.meta.client) window.history.replaceState(window.history.state, '', `/articles/${id}/edit`) },
})
const { form, payload, savedAt, dirty, conflict, restoredAt, stale, busy } = draft
const editor = useTemplateRef<{ insert: (text: string) => void, focus: () => void, scrollToLine: (line: number) => void }>('editor')
const titleInput = useTemplateRef<HTMLTextAreaElement>('titleInput')

const loading = ref(props.articleId !== null)
const loadError = ref<unknown>(null)

// ── Layout, remembered per browser ──
type Mode = 'edit' | 'split' | 'preview'
const MODE_KEY = 'cdcat:writer-mode'
const mode = ref<Mode>('split')
const outlineOpen = ref(false)
const settingsOpen = ref(false)

onMounted(async () => {
  try {
    const stored = localStorage.getItem(MODE_KEY)
    if (stored === 'edit' || stored === 'split' || stored === 'preview') mode.value = stored
  }
  catch { /* storage unavailable */ }
  settingsOpen.value = window.matchMedia('(min-width: 1280px)').matches
  window.addEventListener('keydown', onKeydown)
  // A new article only brings back the unsaved copy kept in this browser.
  try { await draft.load() }
  catch (error) { loadError.value = error }
  finally { loading.value = false }
  await nextTick()
  resizeTitle()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
watch(mode, (value) => {
  try { localStorage.setItem(MODE_KEY, value) }
  catch { /* storage unavailable */ }
})

// ── Status and actions ──
const status = computed(() => payload.value?.article.status ?? 'draft')
const can = computed(() => payload.value?.can ?? { edit: true, save_draft: true, publish: true, update: false, hide: false })
const readOnly = computed(() => !draft.canEdit.value)

const wordCount = ref(0)
const headings = ref<MarkdownHeading[]>([])
let textTimer: ReturnType<typeof setTimeout> | undefined
watch(() => form.content, (content) => {
  clearTimeout(textTimer)
  textTimer = setTimeout(() => {
    // The same plain-text count the server stores: non-whitespace characters of the rendered text.
    wordCount.value = renderMarkdown(content).replace(/<[^>]+>/g, '').replace(/&[#a-z0-9]+;/gi, 'x').replace(/\s+/g, '').length
    headings.value = markdownHeadings(content)
  }, 300)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(textTimer))

const checks = computed<SubmitCheck[]>(() => [
  { key: 'title', ok: form.title.trim().length >= 2 && form.title.trim().length <= 100, required: true },
  { key: 'type', ok: form.type !== null, required: true },
  { key: 'content', ok: wordCount.value >= site.value.article_content_min, required: true, params: { count: site.value.article_content_min } },
  { key: 'summary', ok: form.summary.trim() !== '', required: false },
  { key: 'cover', ok: form.cover_url.trim() !== '', required: false },
  // A repost names its original; an original always has a license.
  ...(form.is_repost ? [{ key: 'source', ok: /^https?:\/\/\S+$/i.test(form.source_url.trim()), required: true }] : []),
])

const dialogOpen = ref(false)
const actionError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const hideOpen = ref(false)

type ApiError = { name?: string, details?: { details?: Record<string, string[]> } }
function describe(error: unknown) {
  const failure = error as ApiError
  if (failure?.name === 'VALIDATION_FAILED' && failure.details?.details) {
    fieldErrors.value = Object.fromEntries(Object.keys(failure.details.details).map(field => [field.split('.')[0]!, t(`article_ui.errors.${field.split('.')[0]}`)]))
    // Both tag fields show under the tag picker, saying what was wrong.
    const tagError = tagErrorKey(failure.details.details)
    if (tagError) {
      delete fieldErrors.value.new_tags
      fieldErrors.value.tag_ids = t(tagError, { max: TAG_NAME_MAX })
    }
    return Object.values(fieldErrors.value).join(' ')
  }
  const known: Record<string, string> = {
    CONTENT_BLOCKED: 'article_ui.errors.blocked', ARTICLE_DRAFT_CONFLICT: 'article_ui.errors.conflict', ARTICLE_INVALID_STATE: 'article_ui.errors.invalid_state',
  }
  return failure?.name && known[failure.name] ? t(known[failure.name]!) : localizeError(error)
}

/** Shows the author the article as readers see it, once it is on the site. */
async function openArticle(payload: ArticleEditPayload | null | undefined) {
  if (payload?.article.status !== 'published') return false
  const { id, slug } = payload.article
  await navigateTo(`/articles/${id}${slug ? `/${slug}` : ''}`)
  return true
}

/**
 * Saves the draft, or updates the article on the site. The「更新」button then opens the published
 * article; Ctrl+S saves in place, so writing can go on.
 */
async function save(options: { openAfter?: boolean } = {}) {
  if (!can.value.edit || busy.value) return
  fieldErrors.value = {}
  try {
    const next = await draft.save()
    if (options.openAfter && can.value.update && await openArticle(next)) return
    showToast(t(can.value.update ? 'article_ui.writer.updated' : 'article_ui.writer.draft_saved'))
  }
  catch (error) { if ((error as ApiError).name !== 'ARTICLE_DRAFT_CONFLICT') showToast(describe(error), 'error') }
}

function openPublish() {
  actionError.value = ''
  fieldErrors.value = {}
  dialogOpen.value = true
}

async function confirmPublish() {
  actionError.value = ''
  try {
    const next = await draft.publish()
    dialogOpen.value = false
    if (await openArticle(next)) return
    showToast(t('article_ui.writer.published'))
  }
  catch (error) {
    if ((error as ApiError).name === 'ARTICLE_DRAFT_CONFLICT') dialogOpen.value = false
    else actionError.value = describe(error)
  }
}

async function hide() {
  try {
    await draft.hide()
    hideOpen.value = false
    showToast(t('article_ui.writer.hidden'))
  }
  catch (error) { showToast(describe(error), 'error') }
}

// ── Editor helpers ──
function goToHeading(heading: MarkdownHeading) {
  if (mode.value === 'preview') document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  else editor.value?.scrollToLine(heading.line)
}

function resizeTitle() {
  const element = titleInput.value
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}
watch(() => form.title, () => nextTick(resizeTitle))

function onKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    void save()
  }
}

// Unsaved edits stay in this browser, but they are not on the server yet.
onBeforeRouteLeave(() => !dirty.value || !can.value.edit || window.confirm(t('article_ui.writer.leave_confirm')))

const time = (value: string | null) => value ? new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : ''
const saveLabel = computed(() => {
  if (busy.value) return t('article_ui.writer.saving')
  if (dirty.value) return t('article_ui.writer.unsaved_local')
  if (!draft.articleId.value) return t('article_ui.writer.not_saved')
  return savedAt.value ? t('article_ui.writer.saved_at', { time: time(savedAt.value) }) : t('article_ui.writer.saved')
})
const modes = computed(() => (['edit', 'split', 'preview'] as const).map(value => ({ value, icon: { edit: PenLine, split: Columns2, preview: Eye }[value], label: t(`article_ui.writer.modes.${value}`) })))
</script>

<template>
  <div class="flex h-dvh flex-col">
    <!-- Header -->
    <header class="z-20 flex shrink-0 items-center gap-2 border-b border-line bg-card px-3 py-2 sm:gap-3 sm:px-4">
      <NuxtLink to="/articles/mine" class="inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary">
        <ArrowLeft :size="16" /><span class="hidden sm:inline">{{ t('article_ui.mine.title') }}</span>
      </NuxtLink>
      <span class="h-5 w-px shrink-0 bg-line" />
      <!-- Status and save state describe the loaded draft, so they wait for it. -->
      <template v-if="!loading && !loadError">
        <ArticleStatusBadge :status="status" />
        <span class="hidden truncate text-xs md:inline" :class="dirty ? 'text-warning' : 'text-meta'" aria-live="polite">{{ saveLabel }}</span>
        <span class="hidden text-xs tabular-nums text-meta lg:inline">· {{ t('article_ui.word_count', { count: wordCount.toLocaleString() }) }}</span>
      </template>

      <div class="ml-auto flex items-center gap-1 sm:gap-2">
        <div class="hidden md:block">
          <UiSegmented v-model="mode" :items="modes" size="sm" :label="t('article_ui.writer.mode')" />
        </div>
        <button type="button" class="btn btn-ghost btn-sm hidden lg:inline-flex" :aria-pressed="outlineOpen" :title="t('article_ui.writer.outline')" @click="outlineOpen = !outlineOpen">
          <ListTree :size="15" />
        </button>
        <button type="button" class="btn btn-ghost btn-sm" :aria-pressed="settingsOpen" :title="t('article_ui.settings')" @click="settingsOpen = !settingsOpen">
          <Settings2 :size="15" /><span class="hidden sm:inline">{{ t('article_ui.settings') }}</span>
        </button>
        <template v-if="!loading && !loadError && can.edit">
          <button v-if="can.hide" type="button" class="btn btn-ghost btn-sm" :disabled="busy" @click="hideOpen = true">
            <EyeOff :size="14" /><span class="hidden sm:inline">{{ t('article_ui.writer.actions.hide') }}</span>
          </button>
          <button
            type="button" class="btn btn-sm" :class="can.publish ? 'btn-outline' : 'btn-primary'" :disabled="busy || (!dirty && !!draft.articleId.value)"
            :title="t('article_ui.writer.save_shortcut')" @click="save({ openAfter: true })">
            <Loader2 v-if="busy && !dialogOpen" :size="14" class="animate-spin" /><Save v-else :size="14" />
            {{ t(`article_ui.writer.actions.${can.update ? 'update' : 'save_draft'}`) }}
          </button>
          <button v-if="can.publish" type="button" class="btn btn-primary btn-sm" :disabled="busy" @click="openPublish">
            {{ t(`article_ui.writer.actions.${status === 'hidden' ? 'republish' : 'publish'}`) }}
          </button>
        </template>
      </div>
    </header>

    <SkeletonStatus v-if="loading" page class="mx-auto w-full max-w-3xl flex-1 space-y-4 px-6 py-10">
      <div class="skeleton h-9 w-2/3 rounded-md" />
      <div class="skeleton h-4 w-1/3 rounded-full" />
      <div class="space-y-2.5 pt-4">
        <div v-for="line in 6" :key="line" class="skeleton h-3.5 rounded-full" :class="line === 6 ? 'w-1/2' : 'w-full'" />
      </div>
    </SkeletonStatus>
    <div v-else-if="loadError" class="grid flex-1 place-items-center p-6 text-center">
      <div>
        <AlertTriangle :size="28" class="mx-auto text-warning" />
        <p class="mt-3 text-sm text-body">{{ localizeError(loadError) }}</p>
        <NuxtLink to="/articles/mine" class="btn btn-outline btn-sm mt-4">{{ t('article_ui.mine.title') }}</NuxtLink>
      </div>
    </div>

    <template v-else>
      <!-- Notices -->
      <div class="shrink-0 space-y-px">
        <p v-if="status === 'locked'" class="flex flex-wrap items-center gap-1.5 bg-danger/10 px-4 py-2 text-sm text-danger">
          <Lock :size="15" /><strong>{{ t('article_ui.writer.notice_locked') }}</strong>{{ payload?.article.status_reason }}
        </p>
        <p v-else-if="status === 'hidden'" class="bg-warning/10 px-4 py-2 text-sm text-warning">
          <strong>{{ t('article_ui.writer.notice_hidden') }}</strong>
          <template v-if="payload?.article.status_reason">{{ t('article_ui.writer.notice_hidden_reason', { reason: payload.article.status_reason }) }}</template>
        </p>
        <div v-if="restoredAt && dirty" class="flex flex-wrap items-center gap-2 bg-info/10 px-4 py-2 text-sm text-info">
          <History :size="15" />{{ t('article_ui.writer.local_restored', { time: time(restoredAt) }) }}
          <button type="button" class="underline" @click="draft.discardLocal()">{{ t('article_ui.writer.local_discard') }}</button>
        </div>
        <div v-if="stale" class="flex flex-wrap items-center gap-2 bg-warning/10 px-4 py-2 text-sm text-warning">
          <History :size="15" />{{ t('article_ui.writer.local_stale', { time: time(stale.at) }) }}
          <button type="button" class="font-semibold underline" @click="draft.restoreStale()">{{ t('article_ui.writer.local_restore') }}</button>
          <button type="button" class="underline" @click="draft.discardLocal()">{{ t('article_ui.writer.local_discard') }}</button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex min-h-0 flex-1">
        <aside v-if="outlineOpen" class="hidden w-56 shrink-0 overflow-y-auto border-r border-line bg-card p-3 lg:block">
          <p class="px-2 text-xs font-semibold uppercase tracking-wide text-meta">{{ t('article_ui.writer.outline') }}</p>
          <nav v-if="headings.length" class="mt-2 space-y-0.5">
            <button
              v-for="heading in headings" :key="heading.id" type="button"
              class="block w-full truncate rounded px-2 py-1 text-left text-sm text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
              :style="{ paddingLeft: `${(heading.level - 1) * 0.75 + 0.5}rem` }" @click="goToHeading(heading)">
              {{ heading.text }}
            </button>
          </nav>
          <p v-else class="mt-2 px-2 text-xs text-meta">{{ t('article_ui.writer.outline_empty') }}</p>
        </aside>

        <main class="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
          <textarea
            ref="titleInput" v-model="form.title" rows="1" maxlength="100" :readonly="readOnly"
            class="w-full shrink-0 resize-none overflow-hidden bg-transparent px-1 text-2xl font-bold leading-tight text-title outline-none placeholder:text-faint sm:text-3xl"
            :placeholder="t('article_ui.title_placeholder')" :aria-label="t('article_ui.fields.title')" @input="resizeTitle" @keydown.enter.prevent="editor?.focus()" />
          <p v-if="fieldErrors.title" class="-mt-2 px-1 text-xs text-danger">{{ fieldErrors.title }}</p>
          <div class="flex md:hidden">
            <UiSegmented
              :model-value="mode === 'split' ? 'edit' : mode" :items="modes.filter(item => item.value !== 'split')" size="sm"
              :label="t('article_ui.writer.mode')" @update:model-value="value => value && (mode = value)" />
          </div>
          <div class="min-h-0 flex-1">
            <MarkdownEditor
              ref="editor" v-model="form.content" :mode="mode" fill :disabled="readOnly" :error="fieldErrors.content"
              :placeholder="t('article_ui.start_writing')" @save="save()" />
          </div>
        </main>

        <!-- Settings: a side panel on wide screens, a bottom sheet on small ones -->
        <div v-if="settingsOpen" class="fixed inset-0 z-30 bg-black/50 xl:hidden" @click="settingsOpen = false" />
        <aside
          v-if="settingsOpen"
          class="fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-card p-4 max-xl:shadow-overlay xl:static xl:z-auto xl:max-h-none xl:w-80 xl:shrink-0 xl:rounded-none xl:border-l xl:border-t-0">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-body">{{ t('article_ui.settings') }}</h2>
            <button type="button" class="grid size-7 place-items-center rounded-md text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary" :aria-label="t('common.close')" @click="settingsOpen = false"><X :size="15" /></button>
          </div>
          <ArticleWriterSettings
            v-model:type="form.type" v-model:summary="form.summary" v-model:cover-url="form.cover_url" v-model:banner-url="form.banner_url" v-model:slug="form.slug"
            v-model:links="form.links" v-model:tags="form.tags" v-model:license="form.license" v-model:is-repost="form.is_repost"
            v-model:source-url="form.source_url" v-model:source-author="form.source_author" :disabled="readOnly" :allow-staff-tags="hasPermission('articles.manage')" :errors="fieldErrors" />
        </aside>
      </div>
    </template>

    <ArticleWriterSubmitDialog v-model:open="dialogOpen" :republish="status === 'hidden'" :checks="checks" :busy="busy" :error="actionError" @confirm="confirmPublish" />
    <CommonConfirmDialog
      v-model="hideOpen" variant="warning" :title="t('article_ui.writer.hide_title')" :description="t('article_ui.writer.hide_description')"
      :confirm-text="t('article_ui.writer.actions.hide')" @confirm="hide" />

    <!-- Conflict with a newer copy saved elsewhere -->
    <div v-if="conflict" class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="alertdialog" aria-modal="true">
      <div class="w-full max-w-md rounded-2xl bg-card p-5 text-body shadow-overlay ring-1 ring-line">
        <h2 class="text-lg font-bold text-title">{{ t('article_ui.writer.conflict_title') }}</h2>
        <p class="mt-2 text-sm text-body">{{ t('article_ui.writer.conflict_description', { time: time(conflict.article.updated_at) }) }}</p>
        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" class="btn btn-outline btn-sm" @click="draft.useServer()">{{ t('article_ui.writer.conflict_use_server') }}</button>
          <button type="button" class="btn btn-primary btn-sm" @click="draft.keepMine()">{{ t('article_ui.writer.conflict_keep_mine') }}</button>
        </div>
      </div>
    </div>

  </div>
</template>
