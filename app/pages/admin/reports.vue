<script setup lang="ts">
import type { AdminHandledReport, AdminPagination, AdminReportGroup } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type Action = 'delete' | 'hide' | 'lock' | 'none'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const reportConfirmLabels: Record<string, string> = {
  dismiss: '驳回这些举报',
  none: '认可举报，不处置',
  delete: '认可举报并删除文章',
  post_hide: '认可举报并折叠帖子',
  post_delete: '认可举报并删除帖子',
  shout_hide: '成立并隐藏留言',
  shout_delete: '成立并删除留言',
  hide: '认可举报并隐藏文章',
  lock: '认可举报并锁定文章',
  review_hide: '成立并隐藏评价',
  review_delete: '成立并删除评价',
}
const reportOutcomeLabels: Record<string, string> = { accepted: '已认可', dismissed: '已驳回' }
const reportResolutionLabels: Record<string, string> = { delete: '删除', none: '不处置', hide: '隐藏', lock: '锁定' }
const reportTabLabels: Record<string, string> = { pending: '待处理', handled: '已处理' }
const reportTypeLabels: Record<string, string> = { all: '全部', article: '文章', post: '帖子', shout: '留言', review: '评价' }
const shoutStatusLabels: Record<string, string> = { visible: '显示中', hidden: '已隐藏' }
const { hasPermission } = useAuth()
const status = computed(() => route.query.status === 'handled' ? 'handled' : 'pending')
const type = computed(() => ['article', 'post', 'shout', 'review'].includes(String(route.query.type)) ? String(route.query.type) : undefined)
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
/** Report kinds this moderator handles; the type filter shows when there is more than one. */
const kinds = computed(() => [
  ...(hasPermission('articles.manage') ? ['article'] : []),
  ...(hasPermission('discussions.moderate') ? ['post'] : []),
  ...(hasPermission('shouts.manage') ? ['shout'] : []),
  ...(hasPermission('reviews.manage') ? ['review'] : []),
])
const bothKinds = computed(() => kinds.value.length > 1)

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
        [`${target.type}_id`]: target.id, decision: current.decision,
        action: current.decision === 'accept' ? current.action : undefined, note: note || undefined,
        silence_days: target.type === 'post' && current.decision === 'accept' && silenceDays.value !== '' ? Number(silenceDays.value) : undefined,
      },
    })
    notice.value = '已处理'
    resolving.value = null
    await refresh()
  }
  catch (failure) { message.value = adminError(failure, '操作失败，请重试。') }
  finally { busy.value = false }
}
const targetLink = (group: AdminReportGroup) => group.target.type === 'post'
  ? `/discussions/${group.target.topic_id}?post=${group.target.id}`
  : group.target.type === 'shout' ? `/artists/${group.target.artist_id}`
    : group.target.type === 'review' ? `/albums/${group.target.album_id}`
      : `/admin/articles/${group.target.id}`
const statusLabel = (group: AdminReportGroup) => !group.target.status ? ''
  : group.target.type === 'post' ? postStatusLabels[group.target.status]
    : group.target.type === 'shout' || group.target.type === 'review' ? shoutStatusLabels[group.target.status]
      : articleStatusLabels[group.target.status]
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: '举报处理' })
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">举报处理</h1>
      <p class="mt-2 text-sm text-slate-600">按被举报的内容汇总。同一对象的待处理举报一起结案，举报人会收到结果通知。</p>
    </header>
    <nav class="flex flex-wrap gap-1 border-b border-slate-200 text-sm">
      <NuxtLink
        v-for="value in ['pending', 'handled']" :key="value" :to="{ query: { ...(type ? { type } : {}), ...(value === 'handled' ? { status: 'handled' } : {}) } }" class="-mb-px border-b-2 px-3 py-2"
        :class="status === value ? 'border-slate-900 font-semibold' : 'border-transparent text-slate-500'">{{ reportTabLabels[value] }}</NuxtLink>
      <div v-if="bothKinds" class="ml-auto flex items-center gap-1 self-center text-xs">
        <NuxtLink
          v-for="value in [undefined, ...kinds]" :key="value ?? 'all'" :to="{ query: { ...route.query, type: value, page: undefined } }"
          class="rounded-md px-2 py-1" :class="type === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'">{{ reportTypeLabels[value ?? 'all'] }}</NuxtLink>
      </div>
      <NuxtLink v-if="articleId || postId" :to="{ query: { ...route.query, article_id: undefined, post_id: undefined } }" class="self-center text-xs text-slate-500 underline" :class="bothKinds ? '' : 'ml-auto'">显示全部</NuxtLink>
    </nav>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <AdminListState :pending="pending" :error="error" :empty="!data?.items.length" @retry="refresh()">
      <ul v-if="status === 'pending'" class="space-y-3">
        <li v-for="group in groups" :key="`${group.target.type}-${group.target.id}`" class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-[11px] font-medium text-slate-400">{{ reportTypeLabels[group.target.type] }}<template v-if="group.target.type === 'post'"> · {{ group.target.floor ? `#${group.target.floor}` : `#${group.target.parent_floor} 的楼中楼` }}</template></p>
              <NuxtLink :to="targetLink(group)" class="font-semibold underline decoration-slate-200 underline-offset-4">{{ group.target.title || '无标题' }}</NuxtLink>
              <p v-if="group.target.type !== 'article' && group.target.excerpt" class="mt-1 line-clamp-2 text-xs text-slate-600">{{ group.target.excerpt }}</p>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ statusLabel(group) }} · {{ group.target.author?.nickname || group.target.author?.username }}
                · {{ group.reports_count }} 条举报
              </p>
            </div>
            <div class="flex flex-wrap gap-1.5 text-xs">
              <button type="button" class="rounded-lg border px-2.5 py-1.5" @click="start(group, 'dismiss')">驳回</button>
              <button type="button" class="rounded-lg border px-2.5 py-1.5" @click="start(group, 'accept', 'none')">认可（不处置）</button>
              <template v-if="group.target.type === 'shout' || group.target.type === 'review'">
                <button v-if="group.target.status !== 'hidden'" type="button" class="rounded-lg border border-amber-300 px-2.5 py-1.5 text-amber-700" @click="start(group, 'accept', 'hide')">成立并隐藏</button>
                <button type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="start(group, 'accept', 'delete')">成立并删除</button>
              </template>
              <template v-else-if="group.target.type === 'post'">
                <button type="button" class="rounded-lg border border-amber-300 px-2.5 py-1.5 text-amber-700" @click="start(group, 'accept', 'hide')">认可并折叠</button>
                <button type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="start(group, 'accept', 'delete')">认可并删除</button>
              </template>
              <template v-else>
                <button v-if="group.target.status === 'published'" type="button" class="rounded-lg border border-amber-300 px-2.5 py-1.5 text-amber-700" @click="start(group, 'accept', 'hide')">隐藏文章</button>
                <button v-if="group.target.status !== 'locked'" type="button" class="rounded-lg border border-rose-300 px-2.5 py-1.5 text-rose-700" @click="start(group, 'accept', 'lock')">锁定文章</button>
                <button type="button" class="rounded-lg border border-red-300 px-2.5 py-1.5 text-red-700" @click="start(group, 'accept', 'delete')">认可并删除</button>
              </template>
            </div>
          </div>
          <ul class="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs">
            <li v-for="report in group.reports" :key="report.id" class="flex gap-2">
              <span class="shrink-0 rounded bg-slate-100 px-1.5">{{ reportReasonLabels[report.reason] }}</span>
              <span class="flex-1 text-slate-700">{{ report.note }}</span>
              <span class="shrink-0 text-slate-400">{{ report.reporter?.nickname || report.reporter?.username || '关键词过滤' }} · {{ time(report.created_at) }}</span>
            </li>
          </ul>
        </li>
      </ul>
      <table v-else class="w-full rounded-xl border border-slate-200 bg-white text-left text-sm">
        <tbody class="divide-y divide-slate-100">
          <tr v-for="report in handled" :key="report.id">
            <td class="px-4 py-2">
              <NuxtLink v-if="report.article" :to="`/admin/articles/${report.article.id}`" class="underline">{{ report.article.title || '无标题' }}</NuxtLink>
              <NuxtLink v-else-if="report.post?.topic" :to="`/discussions/${report.post.topic.id}?post=${report.post.id}`" class="underline">{{ report.post.topic.title }}<span v-if="report.post.floor" class="text-slate-400"> #{{ report.post.floor }}</span></NuxtLink>
              <NuxtLink v-else-if="report.shout" :to="`/artists/${report.shout.artist_id}`" class="line-clamp-1 underline">留言：{{ report.shout.content }}</NuxtLink>
              <NuxtLink v-else-if="report.review" :to="`/albums/${report.review.album_id}`" class="line-clamp-1 underline">评价管理：{{ report.review.content }}</NuxtLink>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="px-4 py-2 text-xs">{{ reportReasonLabels[report.reason] }}</td>
            <td class="px-4 py-2 text-xs">{{ reportOutcomeLabels[report.status] }}<template v-if="report.resolution && report.resolution !== 'none'"> · {{ reportResolutionLabels[report.resolution] }}</template></td>
            <td class="px-4 py-2 text-xs text-slate-500">{{ report.handler?.nickname || report.handler?.username }} · {{ time(report.handled_at) }}</td>
          </tr>
        </tbody>
      </table>
      <footer v-if="data && data.pagination.last_page > 1" class="mt-4"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
    </AdminListState>
    <AdminConfirmDialog
      v-model="resolveOpen" :busy="busy" :reason-required="resolving?.action === 'delete' || resolving?.action === 'hide' || resolving?.action === 'lock'"
      :title="resolving ? reportConfirmLabels[`${resolving.decision === 'dismiss' ? 'dismiss' : resolving.group.target.type !== 'article' && resolving.action !== 'none' ? `${resolving.group.target.type}_${resolving.action}` : resolving.action}`] ?? '' : ''"
      :description="resolving?.group.target.type === 'post' ? '同一条帖子的所有待处理举报都会结案。被自动折叠的帖子在驳回后会恢复。' : '同一篇文章的所有待处理举报都会结案。'" @confirm="resolve"
    >
      <label v-if="resolving?.group.target.type === 'post' && resolving.decision === 'accept'" class="mt-4 block text-sm">
        同时禁言作者
        <select v-model="silenceDays" class="mt-2 w-full rounded-lg border border-slate-300 p-2">
          <option value="">不禁言</option>
          <option v-for="value in ['1', '3', '7', '30']" :key="value" :value="value">{{ value }} 天</option>
          <option value="0">永久</option>
        </select>
      </label>
    </AdminConfirmDialog>
  </div>
</template>
