<script setup lang="ts">
import { AlertTriangle, ArrowLeft, Check, Columns2, Eye, History, ListTree, Loader2, PenLine, RotateCcw, Settings2, X } from '@lucide/vue'
import type { MarkdownHeading } from '~/utils/markdown'
import type { SubmitCheck } from './WriterSubmitDialog.vue'
import { TAG_NAME_MAX, tagErrorKey } from '~/utils/tags'

/**
 * The full-screen writing page for new and existing articles (docs/articles/README.md).
 * A new article is created on its first autosave; the address then switches to its edit URL
 * without remounting, so the editor keeps its cursor.
 */
const props = defineProps<{ articleId: number | null }>()
const { t, locale } = useI18n()
const { hasPermission } = useAuth()
const { localizeError } = useLocalizedApiError()
const { toast, showToast } = useToast()

const draft = useArticleDraft(props.articleId, {
  onCreated: (id) => { if (import.meta.client) window.history.replaceState(window.history.state, '', `/articles/${id}/edit`) },
})
const { form, payload, saveState, savedAt, conflict, backup, busy } = draft
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
  if (props.articleId !== null) {
    try { await draft.load() }
    catch (error) { loadError.value = error }
    finally { loading.value = false }
  }
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
const readOnly = computed(() => !draft.canEdit.value)
const editingLive = computed(() => status.value === 'published' && payload.value?.draft.id !== null)
const primary = computed<'submit' | 'publish' | 'withdraw' | null>(() => {
  const can = payload.value?.can
  if (!can) return hasPermission('articles.publish') ? 'publish' : 'submit'
  if (can.withdraw) return 'withdraw'
  if (can.publish) return 'publish'
  return can.submit ? 'submit' : null
})
const primaryLabel = computed(() => {
  if (primary.value === 'publish') return status.value === 'published' ? 'publish_changes' : 'publish'
  if (primary.value === 'submit') return status.value === 'rejected' || status.value === 'unpublished' ? 'resubmit' : 'submit'
  return primary.value ?? ''
})

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
  { key: 'content', ok: wordCount.value >= 300, required: true },
  { key: 'summary', ok: form.summary.trim() !== '', required: false },
  { key: 'cover', ok: form.cover_url.trim() !== '', required: false },
])

const dialogOpen = ref(false)
const dialogAction = ref<'submit' | 'publish'>('submit')
const actionError = ref('')
const fieldErrors = ref<Record<string, string>>({})
const discardOpen = ref(false)

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
    CONTENT_BLOCKED: 'article_ui.errors.blocked', ARTICLE_PENDING_LIMIT: 'article_ui.errors.pending_limit',
    ARTICLE_DRAFT_CONFLICT: 'article_ui.errors.conflict', ARTICLE_INVALID_STATE: 'article_ui.errors.invalid_state',
  }
  return failure?.name && known[failure.name] ? t(known[failure.name]!) : localizeError(error)
}

async function runPrimary() {
  if (primary.value === 'withdraw') {
    try {
      await draft.act('withdraw')
      showToast(t('article_ui.writer.withdrawn'))
    }
    catch (error) { showToast(describe(error), 'error') }
    return
  }
  if (!primary.value) return
  dialogAction.value = primary.value
  actionError.value = ''
  fieldErrors.value = {}
  dialogOpen.value = true
}

async function confirmDialog(note: string) {
  actionError.value = ''
  try {
    const next = await draft.act(dialogAction.value, dialogAction.value === 'submit' && note ? { note } : {})
    dialogOpen.value = false
    showToast(t(next?.article.status === 'pending' ? 'article_ui.writer.submitted' : 'article_ui.writer.published'))
  }
  catch (error) {
    actionError.value = describe(error)
  }
}

async function discard() {
  try {
    await draft.act('discard')
    showToast(t('article_ui.writer.discarded'))
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
    void draft.save()
  }
}

onBeforeRouteLeave(async () => {
  if (!draft.hasUnsaved()) return true
  await draft.save()
  return !draft.hasUnsaved() || window.confirm(t('article_ui.writer.leave_confirm'))
})

const time = (value: string | null) => value ? new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : ''
const saveLabel = computed(() => {
  if (saveState.value === 'saving') return t('article_ui.writer.saving')
  if (saveState.value === 'dirty') return t('article_ui.writer.unsaved')
  if (saveState.value === 'error') return t('article_ui.writer.save_failed')
  if (!draft.articleId.value) return t('article_ui.writer.not_saved')
  return savedAt.value ? t('article_ui.writer.saved_at', { time: time(savedAt.value) }) : t('article_ui.writer.saved')
})
const modes: { value: Mode, icon: typeof PenLine }[] = [{ value: 'edit', icon: PenLine }, { value: 'split', icon: Columns2 }, { value: 'preview', icon: Eye }]
</script>

<template>
  <div class="flex h-dvh flex-col">
    <!-- Header -->
    <header class="z-20 flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:gap-3 sm:px-4">
      <NuxtLink to="/articles/mine" class="inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
        <ArrowLeft :size="16" /><span class="hidden sm:inline">{{ t('article_ui.mine.title') }}</span>
      </NuxtLink>
      <span class="h-5 w-px shrink-0 bg-slate-200" />
      <!-- Status and save state describe the loaded draft, so they wait for it. -->
      <template v-if="!loading && !loadError">
        <ArticleStatusBadge :status="status" :has-changes="editingLive" />
        <span class="hidden truncate text-xs md:inline" :class="saveState === 'error' ? 'text-rose-600' : 'text-slate-400'" aria-live="polite">{{ saveLabel }}</span>
        <span class="hidden text-xs tabular-nums text-slate-400 lg:inline">· {{ t('article_ui.word_count', { count: wordCount.toLocaleString() }) }}</span>
      </template>

      <div class="ml-auto flex items-center gap-1 sm:gap-2">
        <div class="hidden items-center rounded-lg bg-slate-100 p-0.5 md:flex" role="radiogroup" :aria-label="t('article_ui.writer.mode')">
          <button
            v-for="item in modes" :key="item.value" type="button" role="radio" :aria-checked="mode === item.value"
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition"
            :class="mode === item.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'" @click="mode = item.value">
            <component :is="item.icon" :size="13" />{{ t(`article_ui.writer.modes.${item.value}`) }}
          </button>
        </div>
        <button type="button" class="btn btn-ghost btn-sm hidden lg:inline-flex" :class="outlineOpen && 'bg-slate-100'" :title="t('article_ui.writer.outline')" @click="outlineOpen = !outlineOpen">
          <ListTree :size="15" />
        </button>
        <button type="button" class="btn btn-ghost btn-sm" :class="settingsOpen && 'bg-slate-100'" :title="t('article_ui.settings')" @click="settingsOpen = !settingsOpen">
          <Settings2 :size="15" /><span class="hidden sm:inline">{{ t('article_ui.settings') }}</span>
        </button>
        <button v-if="payload?.can.discard" type="button" class="btn btn-ghost btn-sm hidden sm:inline-flex" :disabled="busy" @click="discardOpen = true">
          <RotateCcw :size="14" />{{ t('article_ui.writer.discard') }}
        </button>
        <button
          v-if="primary" type="button" class="btn btn-sm" :class="primary === 'withdraw' ? 'btn-outline' : 'btn-primary'"
          :disabled="busy || loading || !!loadError" @click="runPrimary">
          <Loader2 v-if="busy" :size="14" class="animate-spin" />
          {{ t(`article_ui.writer.actions.${primaryLabel}`) }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="grid flex-1 place-items-center"><Loader2 :size="24" class="animate-spin text-slate-300" /></div>
    <div v-else-if="loadError" class="grid flex-1 place-items-center p-6 text-center">
      <div>
        <AlertTriangle :size="28" class="mx-auto text-amber-500" />
        <p class="mt-3 text-sm text-slate-600">{{ localizeError(loadError) }}</p>
        <NuxtLink to="/articles/mine" class="btn btn-outline btn-sm mt-4">{{ t('article_ui.mine.title') }}</NuxtLink>
      </div>
    </div>

    <template v-else>
      <!-- Notices -->
      <div class="shrink-0 space-y-px">
        <p v-if="status === 'pending'" class="bg-amber-50 px-4 py-2 text-sm text-amber-800">{{ t('article_ui.writer.notice_pending') }}</p>
        <p v-else-if="status === 'rejected' && payload?.review_note" class="bg-rose-50 px-4 py-2 text-sm text-rose-800">
          <strong>{{ t('article_ui.writer.notice_rejected') }}</strong>{{ payload.review_note }}
        </p>
        <p v-else-if="status === 'unpublished'" class="bg-rose-50 px-4 py-2 text-sm text-rose-800">
          <strong>{{ t('article_ui.writer.notice_unpublished') }}</strong>{{ payload?.article.status_reason }}
        </p>
        <p v-else-if="status === 'published'" class="bg-sky-50 px-4 py-2 text-sm text-sky-800">{{ t('article_ui.writer.notice_published') }}</p>
        <div v-if="backup" class="flex flex-wrap items-center gap-2 bg-violet-50 px-4 py-2 text-sm text-violet-800">
          <History :size="15" />{{ t('article_ui.writer.backup_found', { time: time(backup.at) }) }}
          <button type="button" class="font-semibold underline" @click="draft.restoreBackup()">{{ t('article_ui.writer.backup_restore') }}</button>
          <button type="button" class="text-violet-600 underline" @click="draft.dismissBackup()">{{ t('article_ui.writer.backup_dismiss') }}</button>
        </div>
        <div v-if="saveState === 'error' && !conflict" class="flex flex-wrap items-center gap-2 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">
          <AlertTriangle :size="15" />{{ describe(draft.lastError.value) }}
          <button type="button" class="font-semibold underline" @click="draft.save()">{{ t('common.retry') }}</button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex min-h-0 flex-1">
        <aside v-if="outlineOpen" class="hidden w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 lg:block">
          <p class="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{{ t('article_ui.writer.outline') }}</p>
          <nav v-if="headings.length" class="mt-2 space-y-0.5">
            <button
              v-for="heading in headings" :key="heading.id" type="button"
              class="block w-full truncate rounded px-2 py-1 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              :style="{ paddingLeft: `${(heading.level - 1) * 0.75 + 0.5}rem` }" @click="goToHeading(heading)">
              {{ heading.text }}
            </button>
          </nav>
          <p v-else class="mt-2 px-2 text-xs text-slate-400">{{ t('article_ui.writer.outline_empty') }}</p>
        </aside>

        <main class="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
          <textarea
            ref="titleInput" v-model="form.title" rows="1" maxlength="100" :readonly="readOnly"
            class="w-full shrink-0 resize-none overflow-hidden bg-transparent px-1 text-2xl font-bold leading-tight text-slate-900 outline-none placeholder:text-slate-300 sm:text-3xl"
            :placeholder="t('article_ui.title_placeholder')" :aria-label="t('article_ui.fields.title')" @input="resizeTitle" @keydown.enter.prevent="editor?.focus()" />
          <p v-if="fieldErrors.title" class="-mt-2 px-1 text-xs text-rose-600">{{ fieldErrors.title }}</p>
          <div class="flex md:hidden">
            <div class="flex rounded-lg bg-slate-100 p-0.5">
              <button
                v-for="item in modes.filter(entry => entry.value !== 'split')" :key="item.value" type="button"
                class="inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium"
                :class="mode === item.value || (mode === 'split' && item.value === 'edit') ? 'bg-white shadow-sm' : 'text-slate-500'" @click="mode = item.value">
                <component :is="item.icon" :size="13" />{{ t(`article_ui.writer.modes.${item.value}`) }}
              </button>
            </div>
          </div>
          <div class="min-h-0 flex-1">
            <MarkdownEditor
              ref="editor" v-model="form.content" :mode="mode" fill :disabled="readOnly" :error="fieldErrors.content"
              :placeholder="t('article_ui.start_writing')" @save="draft.save()" />
          </div>
        </main>

        <!-- Settings: a side panel on wide screens, a bottom sheet on small ones -->
        <div v-if="settingsOpen" class="fixed inset-0 z-30 bg-slate-900/30 xl:hidden" @click="settingsOpen = false" />
        <aside
          v-if="settingsOpen"
          class="fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl xl:static xl:z-auto xl:max-h-none xl:w-80 xl:shrink-0 xl:rounded-none xl:border-l xl:border-t-0 xl:shadow-none">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-700">{{ t('article_ui.settings') }}</h2>
            <button type="button" class="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100" :aria-label="t('common.close')" @click="settingsOpen = false"><X :size="15" /></button>
          </div>
          <ArticleWriterSettings
            v-model:type="form.type" v-model:summary="form.summary" v-model:cover-url="form.cover_url" v-model:slug="form.slug"
            v-model:links="form.links" v-model:tags="form.tags" :disabled="readOnly" :allow-staff-tags="hasPermission('articles.manage')" :errors="fieldErrors" />
        </aside>
      </div>
    </template>

    <ArticleWriterSubmitDialog v-model:open="dialogOpen" :action="dialogAction" :checks="checks" :busy="busy" :error="actionError" @confirm="confirmDialog" />
    <CommonConfirmDialog
      v-model="discardOpen" variant="warning" :title="t('article_ui.writer.discard_title')" :description="t('article_ui.writer.discard_description')"
      :confirm-text="t('article_ui.writer.discard')" @confirm="discard" />

    <!-- Conflict with a newer copy saved elsewhere -->
    <div v-if="conflict" class="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" role="alertdialog" aria-modal="true">
      <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 class="text-lg font-bold text-slate-900">{{ t('article_ui.writer.conflict_title') }}</h2>
        <p class="mt-2 text-sm text-slate-600">{{ t('article_ui.writer.conflict_description', { time: time(conflict.draft.updated_at) }) }}</p>
        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" class="btn btn-outline btn-sm" @click="draft.useServer()">{{ t('article_ui.writer.conflict_use_server') }}</button>
          <button type="button" class="btn btn-primary btn-sm" @click="draft.keepMine()">{{ t('article_ui.writer.conflict_keep_mine') }}</button>
        </div>
      </div>
    </div>

    <div
      v-if="toast.show" class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur"
      :class="toast.type === 'error' ? 'border-rose-200 bg-rose-50/95 text-rose-700' : 'border-emerald-200 bg-emerald-50/95 text-emerald-700'" role="status">
      <Check v-if="toast.type !== 'error'" :size="16" /><AlertTriangle v-else :size="16" />{{ toast.message }}
    </div>
  </div>
</template>
