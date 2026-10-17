<script setup lang="ts">
import type { AdminHandledReport, AdminPagination, AdminReportGroup } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type Action = 'unpublish' | 'delete' | 'hide' | 'none'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { hasPermission } = useAuth()
const { localizeError } = useLocalizedApiError(t)
const status = computed(() => route.query.status === 'handled' ? 'handled' : 'pending')
const type = computed(() => route.query.type === 'article' || route.query.type === 'post' ? String(route.query.type) : undefined)
const articleId = computed(() => route.query.article_id ? Number(route.query.article_id) : undefined)
const postId = computed(() => route.query.post_id ? Number(route.query.post_id) : undefined)
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const { data, pending, error, refresh } = await useAsyncData('admin-reports',
  () => $api<{ items: (AdminReportGroup | AdminHandledReport)[], pagination: AdminPagination }>('/v1/admin/reports',
    { query: { status: status.value, type: type.value, article_id: articleId.value, post_id: postId.value, page: page.value } }), { watch: [status, type, articleId, postId, page] })
const groups = computed(() => status.value === 'pending' ? (data.value?.items ?? []) as AdminReportGroup[] : [])
const handled = computed(() => status.value === 'handled' ? (data.value?.items ?? []) as AdminHandledReport[] : [])
const bothKinds = computed(() => hasPermission('articles.manage') && hasPermission('discussions.moderate'))

const busy = ref(false)
const notice = ref('')
const message = ref('')
const silenceDays = ref<string>('')
const resolving = ref<{ group: AdminReportGroup, decision: 'accept' | 'dismiss', action: Action } | null>(null)
const resolveOpen = computed({ get: () => resolving.value !== null, set: (open) => { if (!open) resolving.value = null } })
const start = (group: AdminReportGroup, decision: 'accept' | 'dismiss', action: Action = 'none') => {
  resolving.value = { group, decision, action }
  silenceDays.value = ''
}
async function resolve(note: string) {
  const current = resolving.value
  if (!current) return
  busy.value = true
  message.value = ''
  const target = current.group.target
  try {
    await $api('/v1/admin/reports/resolve', {
      method: 'POST',
      body: {
        [target.type === 'post' ? 'post_id' : 'article_id']: target.id, decision: current.decision,
        action: current.decision === 'accept' ? current.action : undefined, note: note || undefined,
        silence_days: target.type === 'post' && current.decision === 'accept' && silenceDays.value !== '' ? Number(silenceDays.value) : undefined,
      },
    })
    notice.value = t('admin_pages.reports.resolved')
    resolving.value = null
    await refresh()
  }
  catch (failure) { message.value = localizeError(failure, 'admin_pages.action_failed') }
  finally { busy.value = false }
}
const targetLink = (group: AdminReportGroup) => group.target.type === 'post'
  ? `/discussions/${group.target.topic_id}?post=${group.target.id}`
  : `/admin/articles/${group.target.id}`
const statusLabel = (group: AdminReportGroup) => group.target.status
  ? t(group.target.type === 'post' ? `admin_pages.discussions.post_statuses.${group.target.status}` : `admin_pages.articles.statuses.${group.target.status}`)
  : ''
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => t('admin_pages.reports.title')) })
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.reports.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.reports.description') }}</p>
    </header>
    <nav class="flex flex-wrap gap-1 border-b border-slate-200 text-sm">
      <NuxtLink
        v-for="value in ['pending', 'handled']" :key="value" :to="{ query: { ...(type ? { type } : {}), ...(value === 'handled' ? { status: 'handled' } : {}) } }" class="-mb-px border-b-2 px-3 py-2"
        :class="status === value ? 'border-slate-900 font-semibold' : 'border-transparent text-slate-500'">{{ t(`admin_pages.reports.tabs.${value}`) }}</NuxtLink>
      <div v-if="bothKinds" class="ml-auto flex items-center gap-1 self-center text-xs">
        <NuxtLink
          v-for="value in [undefined, 'article', 'post']" :key="value ?? 'all'" :to="{ query: { ...route.query, type: value, page: undefined } }"
          class="rounded-md px-2 py-1" :class="type === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'">{{ t(`admin_pages.reports.types.${value ?? 'all'}`) }}</NuxtLink>
      </div>
      <NuxtLink v-if="articleId || postId" :to="{ query: { ...route.query, article_id: undefined, post_id: undefined } }" class="self-center text-xs text-slate-500 underline" :class="bothKinds ? '' : 'ml-auto'">{{ t('admin_pages.reports.clear_filter') }}</NuxtLink>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
      <ul v-if="status === 'pending'" class="space-y-3">
        <li v-for="group in groups" :key="`${group.target.type}-${group.target.id}`" class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-[11px] font-medium text-slate-400">{{ t(`admin_pages.reports.types.${group.target.type}`) }}<template v-if="group.target.type === 'post'"> · {{ group.target.floor ? `#${group.target.floor}` : t('admin_pages.discussions.reply_under', { floor: group.target.parent_floor }) }}</template></p>
              <NuxtLink :to="targetLink(group)" class="font-semibold underline decoration-slate-200 underline-offset-4">{{ group.target.title || t('admin_pages.articles.untitled') }}</NuxtLink>
              <p v-if="group.target.type === 'post' && group.target.excerpt" class="mt-1 line-clamp-2 text-xs text-slate-600">{{ group.target.excerpt }}</p>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ statusLabel(group) }} · {{ group.target.author?.nickname || group.target.author?.username }}
                · {{ t('admin_pages.reports.count', { count: group.reports_count }) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-1.5 text-xs">
              <button type="button" class="rounded-lg border px-2.5 py-1.5" @click="start(group, 'dismiss')">{{ t('admin_pages.reports.dismiss') }}</button>
              <button type="button" class="rounded-lg border px-2.5 py-1.5" @click="start(group, 'accept', 'none')">{{ t('admin_pages.reports.accept_only') }}</button>
              <template v-if="group.target.type === 'post'">
                <button type="button" class="rounded-lg border border-amber-300 px-2.5 py-1.5 text-amber-700" @click="start(group, 'accept', 'hide')">{{ t('admin_pages.reports.accept_hide') }}</button>
                <button type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="start(group, 'accept', 'delete')">{{ t('admin_pages.reports.accept_delete_post') }}</button>
              </template>
              <template v-else>
                <button v-if="group.target.status === 'published'" type="button" class="rounded-lg border border-rose-300 px-2.5 py-1.5 text-rose-700" @click="start(group, 'accept', 'unpublish')">{{ t('admin_pages.reports.accept_unpublish') }}</button>
                <button type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="start(group, 'accept', 'delete')">{{ t('admin_pages.reports.accept_delete') }}</button>
              </template>
            </div>
          </div>
          <ul class="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs">
            <li v-for="report in group.reports" :key="report.id" class="flex gap-2">
              <span class="shrink-0 rounded bg-slate-100 px-1.5">{{ t(`admin_pages.reports.reasons.${report.reason}`) }}</span>
              <span class="flex-1 text-slate-700">{{ report.note }}</span>
              <span class="shrink-0 text-slate-400">{{ report.reporter?.nickname || report.reporter?.username || t('admin_pages.reports.system') }} · {{ time(report.created_at) }}</span>
            </li>
          </ul>
        </li>
      </ul>
      <table v-else class="w-full rounded-xl border border-slate-200 bg-white text-left text-sm">
        <tbody class="divide-y divide-slate-100">
          <tr v-for="report in handled" :key="report.id">
            <td class="px-4 py-2">
              <NuxtLink v-if="report.article" :to="`/admin/articles/${report.article.id}`" class="underline">{{ report.article.title || t('admin_pages.articles.untitled') }}</NuxtLink>
              <NuxtLink v-else-if="report.post?.topic" :to="`/discussions/${report.post.topic.id}?post=${report.post.id}`" class="underline">{{ report.post.topic.title }}<span v-if="report.post.floor" class="text-slate-400"> #{{ report.post.floor }}</span></NuxtLink>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="px-4 py-2 text-xs">{{ t(`admin_pages.reports.reasons.${report.reason}`) }}</td>
            <td class="px-4 py-2 text-xs">{{ t(`admin_pages.reports.outcomes.${report.status}`) }}<template v-if="report.resolution && report.resolution !== 'none'"> · {{ t(`admin_pages.reports.resolutions.${report.resolution}`) }}</template></td>
            <td class="px-4 py-2 text-xs text-slate-500">{{ report.handler?.nickname || report.handler?.username }} · {{ time(report.handled_at) }}</td>
          </tr>
        </tbody>
      </table>
      <footer v-if="data && data.pagination.last_page > 1" class="mt-4"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
    </AdminListState>
    <AdminConfirmDialog
      v-model="resolveOpen" :busy="busy" :reason-required="resolving?.action === 'delete' || resolving?.action === 'hide'"
      :title="resolving ? t(`admin_pages.reports.confirm.${resolving.decision === 'dismiss' ? 'dismiss' : resolving.group.target.type === 'post' && resolving.action !== 'none' ? `post_${resolving.action}` : resolving.action}`) : ''"
      :description="resolving?.group.target.type === 'post' ? t('admin_pages.reports.confirm_help_post') : t('admin_pages.reports.confirm_help')" @confirm="resolve"
    >
      <label v-if="resolving?.group.target.type === 'post' && resolving.decision === 'accept'" class="mt-4 block text-sm">
        {{ t('admin_pages.reports.silence') }}
        <select v-model="silenceDays" class="mt-2 w-full rounded-lg border border-slate-300 p-2">
          <option value="">{{ t('admin_pages.reports.silence_none') }}</option>
          <option v-for="value in ['1', '3', '7', '30']" :key="value" :value="value">{{ t('admin_pages.discussions.days', { count: value }) }}</option>
          <option value="0">{{ t('admin_pages.discussions.forever') }}</option>
        </select>
      </label>
    </AdminConfirmDialog>
  </div>
</template>
