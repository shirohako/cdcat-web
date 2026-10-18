<script setup lang="ts">
import type { AdminArticle } from '~/types/admin'
import type { ArticleType } from '~/types/article'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { types, typeName } = useArticleTypes()
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

const contentView = ref<'rendered' | 'source'>('rendered')

// ── Moderation: hide and lock take the article off the site, with a reason the author sees ──
type Action = 'hide' | 'lock' | 'unlock'
const pendingAction = ref<Action | null>(null)
const actionOpen = computed({ get: () => pendingAction.value !== null, set: (open) => { if (!open) pendingAction.value = null } })
const moderate = (reason: string) => {
  const action = pendingAction.value
  if (!action) return
  return run(() => $api(`/v1/admin/articles/${id.value}/${action}`, { method: 'POST', body: { reason } }), t(`admin_pages.articles.${action}_done`),
    async () => { pendingAction.value = null; await refresh() })
}
const deleteOpen = ref(false)
const toggleFeatured = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: { featured: !data.value?.featured } }), t('admin_pages.saved'))
const remove = (reason: string) => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'DELETE', body: { reason } }), t('admin_pages.articles.deleted_done'),
  async () => { deleteOpen.value = false; await router.push('/admin/articles') })

const slug = ref('')
watch(data, (value) => { slug.value = value?.slug ?? '' }, { immediate: true })
const saveSlug = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: { slug: slug.value.trim() || null } }), t('admin_pages.saved'))

const editing = ref(false)
const edit = reactive({ type: null as ArticleType | null, title: '', summary: '', cover_url: '', banner_url: '', content: '', reason: '' })
function startEdit() {
  const article = data.value
  if (!article) return
  Object.assign(edit, { type: article.type, title: article.title ?? '', summary: article.summary ?? '', cover_url: article.cover_url ?? '', banner_url: article.banner_url ?? '', content: article.content ?? '', reason: '' })
  editing.value = true
}
const saveEdit = () => run(() => $api(`/v1/admin/articles/${id.value}`, { method: 'PATCH', body: {
  type: edit.type, title: edit.title, summary: edit.summary || null, cover_url: edit.cover_url.trim() || null, banner_url: edit.banner_url.trim() || null, content: edit.content, reason: edit.reason.trim(),
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
              <template v-if="data.status === 'locked' && data.locked_previous_status">（{{ t('admin_pages.articles.unlocks_to', { status: t(`admin_pages.articles.statuses.${data.locked_previous_status}`) }) }}）</template>
              <template v-if="data.type"> · {{ typeName(data.type, 'zh-Hans') }}</template>
              <template v-if="data.featured"> · {{ t('admin_pages.articles.featured') }}</template>
            </p>
            <h1 class="mt-1 text-2xl font-bold">{{ data.title || t('admin_pages.articles.untitled') }}</h1>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('admin_pages.articles.author') }}：<NuxtLink v-if="data.author" :to="`/admin/users/${data.author.id}`" class="underline">{{ data.author.nickname || data.author.username }}</NuxtLink>
              · {{ t('admin_pages.articles.published_at') }} {{ time(data.published_at) }}
              <template v-if="data.edited_at"> · {{ t('admin_pages.articles.edited_at') }} {{ time(data.edited_at) }}</template>
            </p>
            <p v-if="data.status_reason" class="mt-1 text-sm text-rose-700">{{ t('admin_pages.articles.status_reason') }}{{ data.status_reason }}</p>
          </div>
          <div class="flex flex-wrap gap-2 text-sm">
            <NuxtLink v-if="data.status === 'published'" :to="`/articles/${data.id}`" target="_blank" class="rounded-lg border px-3 py-2">{{ t('admin_pages.preview_front') }}</NuxtLink>
            <template v-if="data.status === 'published'">
              <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="toggleFeatured">{{ data.featured ? t('admin_pages.articles.unfeature') : t('admin_pages.articles.feature') }}</button>
              <button type="button" :disabled="busy" class="rounded-lg border border-amber-300 px-3 py-2 text-amber-800 disabled:opacity-50" @click="pendingAction = 'hide'">{{ t('admin_pages.articles.hide') }}</button>
            </template>
            <button v-if="data.status === 'locked'" type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="pendingAction = 'unlock'">{{ t('admin_pages.articles.unlock') }}</button>
            <button v-else type="button" :disabled="busy" class="rounded-lg border border-rose-300 px-3 py-2 text-rose-700 disabled:opacity-50" @click="pendingAction = 'lock'">{{ t('admin_pages.articles.lock') }}</button>
            <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-50" @click="startEdit">{{ t('common.edit') }}</button>
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

        <!-- Moderator edit, applied at once -->
        <form v-if="editing" class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2" @submit.prevent="saveEdit">
          <p class="text-xs text-slate-500 sm:col-span-2">{{ t('admin_pages.articles.edit_help') }}</p>
          <label class="block sm:col-span-2">{{ t('admin_pages.articles.article_title') }}<input v-model="edit.title" :required="data.status !== 'draft'" maxlength="100" :class="input"></label>
          <label class="block">{{ t('admin_pages.articles.type') }}<select v-model="edit.type" :required="data.status !== 'draft'" :class="input"><option v-for="option in types.filter(item => item.is_active || item.key === edit.type)" :key="option.key" :value="option.key">{{ typeName(option.key, 'zh-Hans') }}</option></select></label>
          <label class="block">{{ t('admin_pages.articles.cover') }}<input v-model="edit.cover_url" type="url" maxlength="500" :class="input"></label>
          <label class="block">{{ t('admin_pages.articles.banner') }}<input v-model="edit.banner_url" type="url" maxlength="500" :class="input"></label>
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
            <div class="flex justify-end gap-1">
              <button
                v-for="view in ['rendered', 'source'] as const" :key="view" type="button"
                class="rounded-md px-2.5 py-1 text-xs" :class="contentView === view ? 'bg-slate-100 font-semibold' : 'text-slate-500'" @click="contentView = view">
                {{ t(`admin_pages.articles.views.${view}`) }}
              </button>
            </div>
            <dl class="grid gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-[6rem_1fr]">
              <dt>{{ t('admin_pages.articles.summary') }}</dt><dd class="text-slate-700">{{ data.summary || '—' }}</dd>
              <dt>{{ t('admin_pages.articles.tags') }}</dt><dd class="text-slate-700">{{ data.tags.map(tag => tag.name).join('、') || '—' }}</dd>
              <dt>{{ t('admin_pages.articles.links') }}</dt><dd class="text-slate-700">{{ data.links.map(link => `${t(`admin_pages.articles.link_types.${link.type}`)}：${link.title}`).join('；') || '—' }}</dd>
              <dt>{{ t('admin_pages.articles.cover') }}</dt><dd class="truncate text-slate-700">{{ data.cover_url || '—' }}</dd>
              <dt>{{ t('admin_pages.articles.banner') }}</dt><dd class="truncate text-slate-700">{{ data.banner_url || '—' }}</dd>
            </dl>
            <p v-if="!data.content" class="text-sm text-slate-500">{{ t('admin_pages.articles.nothing_to_show') }}</p>
            <RichContent v-else-if="contentView === 'rendered'" :content="data.content" format="markdown" />
            <pre v-else class="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">{{ data.content }}</pre>
          </section>

          <aside class="space-y-4">
            <section class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <h2 class="font-semibold">{{ t('admin_pages.articles.slug') }}</h2>
              <form class="mt-2 flex gap-2" @submit.prevent="saveSlug">
                <input v-model="slug" maxlength="100" pattern="[a-z0-9]+(-[a-z0-9]+)*" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-xs">
                <button type="submit" :disabled="busy || slug === (data.slug ?? '')" class="rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-40">{{ t('common.save') }}</button>
              </form>
            </section>
          </aside>
        </div>
      </template>
    </AdminListState>

    <AdminConfirmDialog
      v-model="actionOpen" :busy="busy" reason-required :title="pendingAction ? t(`admin_pages.articles.${pendingAction}_title`) : ''"
      :description="pendingAction ? t(`admin_pages.articles.${pendingAction}_help`) : ''" @confirm="moderate" />
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.articles.delete_title')" :description="t('admin_pages.articles.delete_help')" @confirm="remove" />
  </div>
</template>
