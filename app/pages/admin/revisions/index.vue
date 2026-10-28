<script setup lang="ts">
import type { AdminBatchResult, AdminPagination } from '~/types/admin'
import type { Revision } from '~/types/revision'
import { REVISION_STATUSES } from '~/types/revision'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const TYPES = ['album', 'artist', 'lyric', 'entry', 'franchise'] as const
const FLAGS = ['has_conflicts', 'requires_content_manage', 'unchecked', 'applied'] as const

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const revisionFlagLabels: Record<string, string> = { has_conflicts: '有冲突', requires_content_manage: '需内容管理权限', unchecked: '待巡查', applied: '已上线待审' }
const revisionStatusLabels: Record<string, string> = {
  all: '全部',
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  changes_requested: '退回修改',
  withdrawn: '已撤回',
}

const filterKeys = ['search', 'status', 'kind', 'origin', 'type', 'action', 'resource_id', 'submitter', 'from', 'to', 'is_auto_approved', ...FLAGS] as const
type FilterKey = typeof filterKeys[number]
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<FilterKey, string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const resetFilters = () => router.push({ query: {} })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))

const { data, pending, error, refresh } = await useAsyncData('admin-revisions-list',
  () => $api<{ revisions: Revision[], pagination: AdminPagination }>('/v1/admin/revisions', { query: query.value }), { watch: [query] })
const { data: pendingData, refresh: refreshPending } = await useAsyncData('admin-revisions-pending-count',
  () => $api<{ pagination: AdminPagination }>('/v1/admin/revisions', { query: { status: 'pending', per_page: 1 } }))
const revisions = computed(() => data.value?.revisions ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 15, current_page: 1, last_page: 1 })

const canReview = computed(() => hasPermission('revisions.review') || hasPermission('lyrics.manage'))
const selectable = (revision: Revision) => canReview.value && (revision.status === 'pending' || (revision.status === 'approved' && !revision.checked_at))
const selected = ref<number[]>([])
watch(revisions, () => { selected.value = [] })
const allSelected = computed(() => revisions.value.some(selectable) && revisions.value.filter(selectable).every(item => selected.value.includes(item.id)))
const toggleAll = () => { selected.value = allSelected.value ? [] : revisions.value.filter(selectable).map(item => item.id) }

type BatchAction = 'approve' | 'request_changes' | 'reject' | 'check'
const batchActionLabels: Record<BatchAction, string> = { 'approve': '批量批准', 'request_changes': '批量退回', 'reject': '批量驳回', 'check': '批量标记已巡查' }
const batchAction = ref<BatchAction>('approve')
const batchOpen = ref(false)
const busy = ref(false)
const message = ref('')
const batchResult = ref<AdminBatchResult | null>(null)
const openBatch = (action: BatchAction) => { batchAction.value = action; batchResult.value = null; batchOpen.value = true }
const runBatch = async (reason: string) => {
  if (busy.value || !selected.value.length) return
  busy.value = true
  message.value = ''
  try {
    batchResult.value = await $api<AdminBatchResult>('/v1/admin/revisions/batch', { method: 'POST', body: { action: batchAction.value, ids: selected.value, review_comment: reason || null } })
    batchOpen.value = false
    await Promise.all([refresh(), refreshPending()])
  } catch (e) {
    message.value = adminError(e, '操作失败。')
  } finally {
    busy.value = false
  }
}

const typeLabel = (type: string) => entityTypeLabels[type]
/** "album: 名前" from the server, with the type in Chinese. */
const heading = (revision: Revision) => {
  const match = revision.title?.match(/^([a-z]+): (.*)$/)
  return match ? `${typeLabel(match[1]!)} · ${match[2]}` : (revision.title || `#${revision.id}`)
}
const statusClass: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800', changes_requested: 'border-orange-200 bg-orange-50 text-orange-800',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700', rejected: 'border-slate-200 bg-slate-50 text-slate-500',
  withdrawn: 'border-slate-200 bg-white text-slate-400', draft: 'border-slate-200 bg-white text-slate-400',
}
const actionClass: Record<string, string> = { create: 'text-emerald-700', update: 'text-blue-700', delete: 'text-red-700' }
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: '审核中心' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">审核中心</h1>
      <p class="mt-2 text-sm text-slate-600">按状态、类型、来源和提交人筛选修订；批量处理待审修订；在详情里查看结构化差异和与当前内容的合并预览。</p>
    </header>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" placeholder="搜索修订标题" aria-label="搜索修订标题" class="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-model="filters.status" aria-label="状态" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">全部</option>
          <option v-for="status in REVISION_STATUSES" :key="status" :value="status">{{ revisionStatusLabels[status] }}</option>
        </select>
        <select v-model="filters.kind" aria-label="类别" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">全部类别</option>
          <option value="catalog">目录</option>
          <option value="lyric">歌词</option>
        </select>
        <select v-model="filters.type" aria-label="修改主体" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">全部类型</option>
          <option v-for="type in TYPES" :key="type" :value="type">{{ typeLabel(type) }}</option>
        </select>
        <select v-model="filters.action" aria-label="操作" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">全部操作</option>
          <option v-for="action in ['create', 'update', 'delete']" :key="action" :value="action">{{ revisionActionLabels[action] }}</option>
        </select>
        <select v-model="filters.origin" aria-label="来源" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">全部来源</option>
          <option v-for="origin in ['manual', 'import', 'client', 'system']" :key="origin" :value="origin">{{ revisionOriginLabels[origin] }}</option>
        </select>
        <select v-model="filters.is_auto_approved" aria-label="是否自动通过" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">是否自动通过</option>
          <option value="1">自动通过</option>
          <option value="0">人工审核</option>
        </select>
        <input v-model="filters.submitter" maxlength="100" placeholder="提交人用户名" aria-label="提交者" class="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <label class="flex items-center gap-1">从<input v-model="filters.from" type="date" class="rounded-lg border border-slate-300 bg-white px-2 py-2"></label>
        <label class="flex items-center gap-1">至<input v-model="filters.to" type="date" class="rounded-lg border border-slate-300 bg-white px-2 py-2"></label>
        <label v-for="flag in FLAGS" :key="flag" class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <input type="checkbox" :checked="filters[flag] === '1'" @change="filters[flag] = ($event.target as HTMLInputElement).checked ? '1' : ''">{{ revisionFlagLabels[flag] }}
        </label>
        <span v-if="filters.resource_id" class="rounded-lg bg-slate-200 px-3 py-2">实体 #{{ filters.resource_id }}</span>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">应用</button>
        <button type="button" class="rounded-lg border bg-white px-3 py-2" @click="resetFilters">重置</button>
      </form>
    </AdminFilterBar>

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <span class="text-slate-500">共 {{ pagination.total }} 条</span>
      <NuxtLink :to="{ query: { status: 'pending' } }" class="rounded-full bg-amber-50 px-3 py-1 text-amber-800">待审 {{ pendingData?.pagination.total ?? 0 }}</NuxtLink>
      <NuxtLink :to="{ query: { status: 'pending', has_conflicts: '1' } }" class="rounded-full bg-rose-50 px-3 py-1 text-rose-800">有冲突</NuxtLink>
      <template v-if="canReview">
        <span class="ml-auto text-slate-500">已选择 {{ selected.length }} 条</span>
        <button type="button" :disabled="!selected.length" class="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-emerald-700 disabled:opacity-40" @click="openBatch('approve')">批量批准</button>
        <button type="button" :disabled="!selected.length" class="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-orange-700 disabled:opacity-40" @click="openBatch('request_changes')">批量退回</button>
        <button type="button" :disabled="!selected.length" class="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-red-700 disabled:opacity-40" @click="openBatch('reject')">批量驳回</button>
        <button type="button" :disabled="!selected.length" class="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40" @click="openBatch('check')">批量标记已巡查</button>
      </template>
    </div>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="batchResult" role="status" class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <div class="flex items-center justify-between gap-3">
        <p class="font-medium">成功 {{ batchResult.succeeded }} 条，失败 {{ batchResult.failed }} 条</p>
        <button type="button" class="text-slate-500" @click="batchResult = null">关闭</button>
      </div>
      <ul v-if="batchResult.failed" class="mt-2 space-y-1 text-red-700">
        <li v-for="item in batchResult.results.filter(result => !result.success)" :key="item.id">
          <NuxtLink :to="`/admin/revisions/${item.id}`" class="underline">#{{ item.id }}</NuxtLink>：{{ adminError({ name: item.error?.name }, '操作失败。') }}
        </li>
      </ul>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!revisions.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-225 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="w-10 px-4 py-3"><input v-if="canReview" type="checkbox" :checked="allSelected" aria-label="选择本页全部待审修订" @change="toggleAll"></th>
                <th class="px-3 py-3">ID</th>
                <th class="px-3 py-3">词条</th>
                <th class="px-3 py-3">修改主体</th>
                <th class="px-3 py-3">提交者</th>
                <th class="px-3 py-3">状态</th>
                <th class="px-3 py-3">提交时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="revision in revisions" :key="revision.id" class="hover:bg-slate-50/70">
                <td class="px-4 py-3"><input v-if="selectable(revision)" v-model="selected" type="checkbox" :value="revision.id" :aria-label="`选择修订 ${revision.id}`"></td>
                <td class="px-3 py-3 font-mono text-xs text-slate-500">{{ revision.id }}</td>
                <td class="px-3 py-3">
                  <NuxtLink :to="`/admin/revisions/${revision.id}`" class="font-medium text-slate-900 underline decoration-slate-200 underline-offset-4">{{ heading(revision) }}</NuxtLink>
                  <p v-if="revision.summary" class="mt-0.5 max-w-md truncate text-xs text-slate-500">{{ revision.summary }}</p>
                  <div class="mt-1 flex flex-wrap gap-2 text-xs">
                    <span v-if="revision.kind === 'lyric'" class="text-sky-700">歌词</span>
                    <span v-if="revision.origin !== 'manual'" class="text-slate-500">{{ revisionOriginLabels[revision.origin] }}</span>
                    <span v-if="revision.is_auto_approved" class="text-slate-500">自动通过</span>
                    <span v-if="revision.has_applied_items && ['pending', 'changes_requested'].includes(revision.status)" class="text-amber-700">已上线待审</span>
                    <span v-if="revision.has_conflicts" class="text-rose-700">有冲突</span>
                    <span v-if="revision.requires_content_manage" class="text-amber-700">需内容管理权限</span>
                    <span v-if="revision.status === 'approved' && revision.is_auto_approved && !revision.checked_at" class="text-violet-700">待巡查</span>
                  </div>
                </td>
                <td class="px-3 py-3 text-xs">
                  <p v-for="item in revision.items" :key="item.ref">
                    <span :class="actionClass[item.action]">{{ revisionActionLabels[item.action] }}</span>
                    {{ typeLabel(item.resource_type) }}<span v-if="item.resource_id" class="font-mono text-slate-400"> #{{ item.resource_id }}</span>
                  </p>
                </td>
                <td class="px-3 py-3 text-xs">{{ revision.submitter?.nickname || revision.submitter?.username || '—' }}</td>
                <td class="px-3 py-3"><span class="whitespace-nowrap rounded-full border px-2 py-0.5 text-xs" :class="statusClass[revision.status]">{{ revisionStatusLabels[revision.status] }}</span></td>
                <td class="px-3 py-3 text-xs tabular-nums text-slate-500">{{ time(revision.submitted_at ?? revision.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>

    <AdminConfirmDialog
      v-model="batchOpen"
      :busy="busy"
      :reason-required="batchAction === 'reject' || batchAction === 'request_changes'"
      :title="batchActionLabels[batchAction]"
      :description="`将逐条处理选中的 ${selected.length} 条修订。`"
      @confirm="runBatch"
    >
      <p class="mt-3 text-xs text-slate-500">每条修订都会单独检查权限、状态和编辑基线，部分失败不影响其他条目。</p>
    </AdminConfirmDialog>
  </div>
</template>
