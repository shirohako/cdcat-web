<script setup lang="ts">
import type { AdminAuditLog, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const auditTargetLabels: Record<string, string> = {
  album: '专辑',
  artist: '艺术家',
  entry: '条目',
  franchise: '系列',
  revision: '修订',
  user: '用户',
  role: '角色',
  article: '文章',
  album_review: '评价',
  lyric: '歌词',
  event: '活动',
  event_series: '活动系列',
  link_provider: '链接提供方',
  site_setting: '站点设置',
  tag: '标签',
  word_filter: '过滤关键词',
  system: '系统',
  discussion_category: '讨论版块',
  discussion_topic: '讨论主题',
  discussion_post: '帖子',
  mail_category: '邮件类型',
  mail_template: '邮件模板',
  mail_campaign: '群发',
  mail_suppression: '退信名单',
}

// Morph aliases of audited models (App\Support\MorphMap), plus `system` for operations without a model.
const targetTypes = ['album', 'artist', 'entry', 'franchise', 'revision', 'user', 'role', 'article', 'album_review', 'lyric', 'event', 'event_series', 'link_provider', 'site_setting', 'tag', 'word_filter', 'discussion_category', 'discussion_topic', 'discussion_post', 'mail_category', 'mail_template', 'mail_campaign', 'mail_suppression', 'system']
const filterKeys = ['actor', 'action', 'target_type', 'target_id', 'result', 'from', 'to'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))
const { data, pending, error, refresh } = await useAsyncData('admin-audit',
  () => $api<{ logs: AdminAuditLog[], pagination: AdminPagination }>('/v1/admin/audit-logs', { query: query.value }), { watch: [query] })

const detail = ref<AdminAuditLog | null>(null)
const message = ref('')
const open = async (log: AdminAuditLog) => {
  if (detail.value?.id === log.id) {
    detail.value = null
    return
  }
  message.value = ''
  try {
    detail.value = await $api<AdminAuditLog>(`/v1/admin/audit-logs/${log.id}`)
  } catch (e) {
    message.value = adminError(e)
  }
}
const asObject = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const resultClass: Record<string, string> = { success: 'text-emerald-700', failed: 'text-red-700', submitted: 'text-amber-700' }
const time = (value: string) => new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2'
useHead({ title: '操作日志' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">操作日志</h1>
      <p class="mt-2 text-sm text-slate-600">按操作人、动作、对象、结果和时间检索后台操作，展开查看修改前后的快照。</p>
    </header>
    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.actor" maxlength="64" placeholder="操作人用户名" aria-label="操作人用户名" :class="[field, 'w-36']">
        <input v-model="filters.action" maxlength="64" pattern="[a-z_.\-]+" placeholder="动作，如 revisions." aria-label="动作" :class="[field, 'w-44']">
        <select v-model="filters.target_type" aria-label="对象类型" :class="field">
          <option value="">全部对象</option>
          <option v-for="type in targetTypes" :key="type" :value="type">{{ auditTargetLabels[type] }}</option>
        </select>
        <input v-model="filters.target_id" inputmode="numeric" pattern="[0-9]*" placeholder="对象 ID" aria-label="对象 ID" :class="[field, 'w-24']">
        <select v-model="filters.result" aria-label="结果" :class="field">
          <option value="">全部结果</option>
          <option v-for="result in ['success', 'submitted', 'failed']" :key="result" :value="result">{{ auditResultLabels[result] }}</option>
        </select>
        <label class="flex items-center gap-1">从<input v-model="filters.from" type="date" :class="[field, 'px-2']"></label>
        <label class="flex items-center gap-1">至<input v-model="filters.to" type="date" :class="[field, 'px-2']"></label>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">应用</button>
      </form>
    </AdminFilterBar>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.logs.length" @retry="refresh()">
        <ol class="divide-y divide-slate-100">
          <li v-for="log in data?.logs" :key="log.id" class="px-5 py-3 text-sm">
            <button type="button" class="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left" :aria-expanded="detail?.id === log.id" @click="open(log)">
              <span class="font-mono text-xs text-slate-400">#{{ log.id }}</span>
              <span class="font-medium">{{ auditActionLabel(log.action) }}</span>
              <span class="text-slate-600">{{ auditTargetLabels[log.target_type] }}<template v-if="log.target_id"> #{{ log.target_id }}</template></span>
              <span class="text-slate-500">{{ log.actor_name || '—' }}</span>
              <span class="text-xs" :class="resultClass[log.result]">{{ auditResultLabels[log.result] }}</span>
              <time class="ml-auto text-xs tabular-nums text-slate-500" :datetime="log.created_at">{{ time(log.created_at) }}</time>
              <p v-if="log.reason" class="w-full truncate text-xs text-slate-500">原因：{{ log.reason }}</p>
            </button>
            <div v-if="detail?.id === log.id" class="mt-3 space-y-3">
              <p class="text-xs text-slate-500">IP {{ detail.ip || '—' }}</p>
              <AdminJsonDiff :before="asObject(detail.before)" :after="asObject(detail.after)" />
              <details v-if="detail.summary && Object.keys(detail.summary).length" open>
                <summary class="cursor-pointer text-xs text-slate-500">摘要</summary>
                <pre class="mt-2 max-h-80 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">{{ JSON.stringify(detail.summary, null, 2) }}</pre>
              </details>
            </div>
          </li>
        </ol>
        <footer v-if="data" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
  </div>
</template>
