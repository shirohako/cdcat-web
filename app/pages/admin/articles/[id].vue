<script setup lang="ts">
import type { AdminArticle } from '~/types/admin'
import { ARTICLE_TYPES, type ArticleType, type ArticleVersionContent } from '~/types/article'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError(t)
const id = computed(() => Number(route.params.id))
const { data, pending, error, refresh } = await useAsyncData(`admin-article-${route.params.id}`, () => $api<AdminArticle>(`/v1/admin/articles/${id.value}`))

const busy = ref(false)
const notice = ref('')
const message = ref('')
async function run(action: () => Promise<unknown>, done: string, after?: () => void | Promise<void>) {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = done
    await (after ? after() : refresh())
  }
  catch (failure) { message.value = localizeError(failure, 'admin_pages.action_failed') }
  finally { busy.value = false }
}

// ── What is shown: the submission under review, or the live version ──
const showing = ref<'open' | 'live'>('open')
watch(data, (value) => { showing.value = value?.status === 'pending' || !value?.live ? 'open' : 'live' }, { immediate: true })
const shown = computed(() => showing.value === 'open' ? data.value?.open_version ?? null : data.value?.live ?? null)
const contentView = ref<'rendered' | 'source' | 'diff'>('rendered')
const rejected = ref<ArticleVersionContent | null>(null)
watch(() => data.value?.last_rejected_version_id, async (versionId) => {
  rejected.value = versionId && data.value?.status === 'pending' ? await $api<ArticleVersionContent>(`/v1/articles/${id.value}/versions/${versionId}`) : null
}, { immediate: true })

// ── Version history comparison ──
const comparison = ref<{ before: ArticleVersionContent, after: ArticleVersionContent } | null>(null)
async function compareWithPrevious(index: number) {
  const versions = data.value?.versions ?? []
  const current = versions[index]
  const previous = versions[index + 1]
  if (!current?.id || !previous?.id) return
  const [before, after] = await Promise.all([previous.id, current.id].map(versionId => $api<ArticleVersionContent>(`/v1/articles/${id.value}/versions/${versionId}`)))
  comparison.value = { before: before!, after: after! }
}

// ── Review ──
const approveOpen = ref(false)
const rejectOpen = ref(false)
const rejectDialog = useTemplateRef<HTMLDialogElement>('rejectDialog')
const rejectReason = ref('')
const presets = ['too_short', 'off_topic', 'formatting', 'infringement'] as const
watch(rejectOpen, async (open) => {
  await nextTick()
  if (open) {
    rejectReason.value = ''
    rejectDialog.value?.showModal()
  }
  else { rejectDialog.value?.close() }
})
const approve = () => run(() => $api(`/v1/admin/articles/${id.value}/approve`, { method: 'POST' }), t('admin_pages.articles.approved'), async () => { approveOpen.value = false; await refresh() })
const reject = () => run(() => $api(`/v1/admin/articles/${id.value}/reject`, { method: 'POST', body: { reason: rejectReason.value.trim() } }),
  t('admin_pages.articles.rejected_done'), async () => { rejectOpen.value = false; await refresh() })

// ── Moderation of live articles ──
const unpublishOpen = ref(false)
const deleteOpen = ref(false)
const unpublish = (reason: string) => run(() => $api(`/v1/admin/articles/${id.value}/unpublish`, { method: 'POST', body: { reason } }), t('admin_pages.articles.unpublished_done'), async () => { unpublishOpen.value = false; await refresh() })
const republish = () => run(() => $api(`/v1/admin/articles/${id.value}/republish`, { method: 'POST' }), t('admin_pages.articles.republished_done'))
const toggleFeatured = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: { featured: !data.value?.featured } }), t('admin_pages.saved'))
const remove = (reason: string) => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'DELETE', body: { reason } }), t('admin_pages.articles.deleted_done'),
  async () => { deleteOpen.value = false; await router.push('/admin/articles') })

const slug = ref('')
watch(data, (value) => { slug.value = value?.slug ?? '' }, { immediate: true })
const saveSlug = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: { slug: slug.value.trim() || null } }), t('admin_pages.saved'))

const editing = ref(false)
const edit = reactive({ type: null as ArticleType | null, title: '', summary: '', cover_url: '', content: '', reason: '' })
function startEdit() {
  const live = data.value?.live
  if (!live) return
  Object.assign(edit, { type: live.type, title: live.title, summary: live.summary ?? '', cover_url: live.cover_url ?? '', content: live.content, reason: '' })
  editing.value = true
}
const saveEdit = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: {
  type: edit.type, title: edit.title, summary: edit.summary || null, cover_url: edit.cover_url.trim() || null, content: edit.content, reason: edit.reason.trim(),
} }), t('admin_pages.articles.edited_done'), async () => { editing.value = false; await refresh() })

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: computed(() => data.value?.title ?? t('admin_pages.articles.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <NuxtLink to="/admin/articles" class="text-sm text-slate-500 hover:text-slate-900">← {{ t('admin_pages.back_list') }}</NuxtLink>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="data">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs text-slate-500">
              {{ t(`admin_pages.articles.statuses.${data.status}`) }}
              <template v-if="data.type"> · {{ t(`admin_pages.articles.types.${data.type}`) }}</template>
              <template v-if="data.featured"> · {{ t('admin_pages.articles.featured') }}</template>
            </p>
            <h1 class="mt-1 text-2xl font-bold">{{ data.title || t('admin_pages.articles.untitled') }}</h1>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('admin_pages.articles.author') }}：<NuxtLink v-if="data.author" :to="`/admin/users/${data.author.id}`" class="underline">{{ data.author.nickname || data.author.username }}</NuxtLink>
              · {{ t('admin_pages.articles.submitted_at') }} {{ time(data.submitted_at) }} · {{ t('admin_pages.articles.published_at') }} {{ time(data.published_at) }}
            </p>
            <p v-if="data.status_reason" class="mt-1 text-sm text-rose-700">{{ t('admin_pages.articles.status_reason') }}{{ data.status_reason }}</p>
          </div>
          <div class="flex flex-wrap gap-2 text-sm">
            <NuxtLink v-if="data.status === 'published'" :to="`/articles/${data.id}`" target="_blank" class="rounded-lg border px-3 py-2">{{ t('admin_pages.preview_front') }}</NuxtLink>
            <template v-if="data.status === 'pending'">
              <button type="button" :disabled="busy" class="rounded-lg border border-rose-300 px-3 py-2 text-rose-700 disabled:opacity-50" @click="rejectOpen = true">{{ t('admin_pages.articles.reject') }}</button>
              <button type="button" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50" @click="approveOpen = true">{{ t('admin_pages.articles.approve') }}</button>
            </template>
            <template v-if="data.status === 'published'">
              <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="toggleFeatured">{{ data.featured ? t('admin_pages.articles.unfeature') : t('admin_pages.articles.feature') }}</button>
              <button type="button" :disabled="busy" class="rounded-lg border border-rose-300 px-3 py-2 text-rose-700 disabled:opacity-50" @click="unpublishOpen = true">{{ t('admin_pages.articles.unpublish') }}</button>
            </template>
            <button v-if="data.status === 'unpublished' && data.live" type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="republish">{{ t('admin_pages.articles.republish') }}</button>
            <button v-if="data.live && (data.status === 'published' || data.status === 'unpublished')" type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="startEdit">{{ t('admin_pages.articles.edit_live') }}</button>
            <button type="button" :disabled="busy" class="rounded-lg border border-red-300 px-3 py-2 text-red-700 disabled:opacity-50" @click="deleteOpen = true">{{ t('common.delete') }}</button>
          </div>
        </header>
        <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
        <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

        <section v-if="data.reports.length" class="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-sm">
          <h2 class="font-semibold text-rose-800">{{ t('admin_pages.articles.pending_reports', { count: data.reports.length }) }}</h2>
          <ul class="mt-2 space-y-1 text-rose-900">
            <li v-for="report in data.reports" :key="report.id">{{ t(`admin_pages.reports.reasons.${report.reason}`) }}<template v-if="report.note">：{{ report.note }}</template>
              <span class="text-xs text-rose-600/70"> — {{ report.reporter?.nickname || report.reporter?.username || t('admin_pages.reports.system') }}</span></li>
          </ul>
          <NuxtLink :to="`/admin/reports?article_id=${data.id}`" class="mt-2 inline-block text-xs underline">{{ t('admin_pages.articles.handle_reports') }}</NuxtLink>
        </section>

        <!-- Moderator edit of the live version -->
        <form v-if="editing" class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2" @submit.prevent="saveEdit">
          <label class="block sm:col-span-2">{{ t('admin_pages.articles.article_title') }}<input v-model="edit.title" required maxlength="100" :class="input"></label>
          <label class="block">{{ t('admin_pages.articles.type') }}<select v-model="edit.type" required :class="input"><option v-for="value in ARTICLE_TYPES" :key="value" :value="value">{{ t(`admin_pages.articles.types.${value}`) }}</option></select></label>
          <label class="block">{{ t('admin_pages.articles.cover') }}<input v-model="edit.cover_url" type="url" maxlength="500" :class="input"></label>
          <label class="block sm:col-span-2">{{ t('admin_pages.articles.summary') }}<input v-model="edit.summary" maxlength="200" :class="input"></label>
          <div class="sm:col-span-2"><MarkdownEditor v-model="edit.content" :guide-url="null" /></div>
          <label class="block sm:col-span-2">{{ t('admin_pages.reason') }}<input v-model="edit.reason" required maxlength="2000" :class="input"></label>
          <div class="flex justify-end gap-2 sm:col-span-2">
            <button type="button" class="rounded-lg border px-4 py-2" @click="editing = false">{{ t('common.cancel') }}</button>
            <button type="submit" :disabled="busy || !edit.reason.trim()" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{{ t('common.save') }}</button>
          </div>
        </form>

        <div v-else class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <template v-if="data.open_version && data.live">
                <button type="button" class="rounded-md px-2.5 py-1" :class="showing === 'open' ? 'bg-slate-900 text-white' : 'border'" @click="showing = 'open'">{{ t(data.status === 'pending' ? 'admin_pages.articles.show_submission' : 'admin_pages.articles.show_draft') }}</button>
                <button type="button" class="rounded-md px-2.5 py-1" :class="showing === 'live' ? 'bg-slate-900 text-white' : 'border'" @click="showing = 'live'">{{ t('admin_pages.articles.show_live') }}</button>
              </template>
              <span class="ml-auto flex gap-1">
                <button
                  v-for="view in (rejected && showing === 'open' ? ['rendered', 'source', 'diff'] as const : ['rendered', 'source'] as const)" :key="view" type="button"
                  class="rounded-md px-2.5 py-1 text-xs" :class="contentView === view ? 'bg-slate-100 font-semibold' : 'text-slate-500'" @click="contentView = view">
                  {{ t(`admin_pages.articles.views.${view}`) }}
                </button>
              </span>
            </div>
            <p v-if="!shown" class="text-sm text-slate-500">{{ t('admin_pages.articles.nothing_to_show') }}</p>
            <template v-else>
              <dl class="grid gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-[6rem_1fr]">
                <dt>{{ t('admin_pages.articles.summary') }}</dt><dd class="text-slate-700">{{ shown.summary || '—' }}</dd>
                <dt>{{ t('admin_pages.articles.tags') }}</dt><dd class="text-slate-700">{{ shown.tags.map(tag => tag.name).join('、') || '—' }}</dd>
                <dt>{{ t('admin_pages.articles.links') }}</dt><dd class="text-slate-700">{{ shown.links.map(link => `${t(`admin_pages.articles.link_types.${link.type}`)}：${link.title}`).join('；') || '—' }}</dd>
                <dt>{{ t('admin_pages.articles.cover') }}</dt><dd class="truncate text-slate-700">{{ shown.cover_url || '—' }}</dd>
                <template v-if="showing === 'open' && data.open_version?.submit_note"><dt>{{ t('admin_pages.articles.submit_note') }}</dt><dd class="text-slate-700">{{ data.open_version.submit_note }}</dd></template>
              </dl>
              <h2 class="text-xl font-bold">{{ shown.title }}</h2>
              <RichContent v-if="contentView === 'rendered'" :content="shown.content ?? ''" format="markdown" />
              <pre v-else-if="contentView === 'source'" class="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">{{ shown.content }}</pre>
              <AdminTextDiff v-else-if="rejected" :before="rejected.content ?? ''" :after="shown.content ?? ''" />
            </template>
          </section>

          <aside class="space-y-4">
            <section class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <h2 class="font-semibold">{{ t('admin_pages.articles.slug') }}</h2>
              <form class="mt-2 flex gap-2" @submit.prevent="saveSlug">
                <input v-model="slug" maxlength="100" pattern="[a-z0-9]+(-[a-z0-9]+)*" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs">
                <button type="submit" :disabled="busy || slug === (data.slug ?? '')" class="rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-40">{{ t('common.save') }}</button>
              </form>
            </section>
            <section class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <h2 class="font-semibold">{{ t('admin_pages.articles.versions') }}</h2>
              <ol class="mt-2 space-y-2">
                <li v-for="(version, index) in data.versions" :key="version.id ?? index" class="rounded-lg border border-slate-100 p-2">
                  <p class="flex items-center gap-1.5 text-xs">
                    <span class="font-medium">{{ t(`admin_pages.articles.version_statuses.${version.status}`) }}</span>
                    <span v-if="version.is_live" class="rounded bg-emerald-50 px-1 text-emerald-700">{{ t('admin_pages.articles.live') }}</span>
                    <span class="ml-auto text-slate-400">{{ time(version.published_at ?? version.updated_at) }}</span>
                  </p>
                  <p class="mt-0.5 truncate text-xs text-slate-500">{{ version.title || '—' }} · {{ version.editor?.nickname || version.editor?.username }}</p>
                  <p v-if="version.review_note" class="mt-0.5 text-xs text-rose-600">{{ version.review_note }}</p>
                  <button v-if="index < data.versions.length - 1" type="button" class="mt-1 text-xs text-slate-500 underline" @click="compareWithPrevious(index)">{{ t('admin_pages.articles.compare_previous') }}</button>
                </li>
              </ol>
            </section>
          </aside>
        </div>

        <section v-if="comparison" class="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">{{ t('admin_pages.articles.comparison', { before: comparison.before.title, after: comparison.after.title }) }}</h2>
            <button type="button" class="text-sm text-slate-500" @click="comparison = null">{{ t('common.close') }}</button>
          </div>
          <AdminTextDiff :before="comparison.before.content ?? ''" :after="comparison.after.content ?? ''" />
        </section>
      </template>
    </AdminListState>

    <AdminConfirmDialog v-model="approveOpen" :busy="busy" :title="t('admin_pages.articles.approve_title')" :description="t('admin_pages.articles.approve_help')" @confirm="approve" />
    <AdminConfirmDialog v-model="unpublishOpen" :busy="busy" reason-required :title="t('admin_pages.articles.unpublish_title')" :description="t('admin_pages.articles.unpublish_help')" @confirm="unpublish" />
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.articles.delete_title')" :description="t('admin_pages.articles.delete_help')" @confirm="remove" />
    <dialog ref="rejectDialog" class="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-black/40" @cancel.prevent="rejectOpen = false">
      <form @submit.prevent="reject">
        <h2 class="text-lg font-semibold">{{ t('admin_pages.articles.reject_title') }}</h2>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.articles.reject_help') }}</p>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button v-for="preset in presets" :key="preset" type="button" class="rounded-full border px-2.5 py-1 text-xs hover:bg-slate-50" @click="rejectReason = t(`admin_pages.articles.reject_presets.${preset}`)">
            {{ t(`admin_pages.articles.reject_presets.${preset}`) }}
          </button>
        </div>
        <textarea v-model="rejectReason" required maxlength="2000" rows="4" :disabled="busy" class="mt-3 w-full rounded-lg border border-slate-300 p-2 text-sm" />
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 text-sm" @click="rejectOpen = false">{{ t('common.cancel') }}</button>
          <button type="submit" :disabled="busy || !rejectReason.trim()" class="rounded-lg bg-rose-700 px-3 py-2 text-sm text-white disabled:opacity-50">{{ t('admin_pages.articles.reject') }}</button>
        </div>
      </form>
    </dialog>
  </div>
</template>
