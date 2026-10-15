<script setup lang="ts">
import type { AdminBatchResult, AdminPagination, AdminRevision } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const filterKeys = ['search', 'type', 'status', 'action', 'submitter', 'from', 'to', 'is_auto_approved', 'resource_id'] as const
const filters = reactive(Object.fromEntries(filterKeys.map(key => [key, String(route.query[key] ?? '')])) as Record<typeof filterKeys[number], string>)
watch(() => route.query, (query) => { for (const key of filterKeys) filters[key] = String(query[key] ?? '') })
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: Object.fromEntries(filterKeys.filter(key => filters[key].trim()).map(key => [key, filters[key].trim()])) })
const resetFilters = () => router.push({ query: {} })
const query = computed(() => ({ page: page.value, ...Object.fromEntries(filterKeys.map(key => [key, route.query[key] || undefined])) }))

const { data, pending, error, refresh } = await useAsyncData('admin-revisions-list',
  () => $api<{ revisions: AdminRevision[], pagination: AdminPagination }>('/v1/admin/revisions', { query: query.value }), { watch: [query] })
const { data: pendingData, refresh: refreshPending } = await useAsyncData('admin-revisions-pending-count',
  () => $api<{ pagination: AdminPagination }>('/v1/admin/revisions', { query: { status: 'pending', per_page: 1 } }))
const revisions = computed(() => data.value?.revisions ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 15, current_page: 1, last_page: 1 })

const canReview = computed(() => hasPermission('revisions.review'))
const selectable = (revision: AdminRevision) => canReview.value && revision.status === 'pending'
const selected = ref<number[]>([])
watch(revisions, () => { selected.value = [] })
const allSelected = computed(() => revisions.value.some(selectable) && revisions.value.filter(selectable).every(item => selected.value.includes(item.id)))
const toggleAll = () => { selected.value = allSelected.value ? [] : revisions.value.filter(selectable).map(item => item.id) }

const batchAction = ref<'approve' | 'reject'>('approve')
const batchOpen = ref(false)
const busy = ref(false)
const message = ref('')
const batchResult = ref<AdminBatchResult | null>(null)
const openBatch = (action: 'approve' | 'reject') => { batchAction.value = action; batchResult.value = null; batchOpen.value = true }
const runBatch = async (reason: string) => {
  if (busy.value || !selected.value.length) return
  busy.value = true
  message.value = ''
  try {
    batchResult.value = await $api<AdminBatchResult>('/v1/admin/revisions/batch', { method: 'POST', body: { action: batchAction.value, ids: selected.value, review_comment: reason || null } })
    batchOpen.value = false
    await Promise.all([refresh(), refreshPending()])
  } catch (e) {
    message.value = localizeError(e, 'admin_pages.revisions.action_failed')
  } finally {
    busy.value = false
  }
}

const typeLabel = (type: string) => ['work', 'artist', 'entry', 'franchise'].includes(type) ? t(`admin_pages.types.${type}`) : type
const statusClass: Record<string, string> = { pending: 'border-amber-200 bg-amber-50 text-amber-800', approved: 'border-emerald-200 bg-emerald-50 text-emerald-700', rejected: 'border-slate-200 bg-slate-50 text-slate-500' }
const actionClass: Record<string, string> = { create: 'text-emerald-700', update: 'text-blue-700', delete: 'text-red-700' }
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => `${t('admin_pages.revisions.title')} | CDCAT`) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.revisions.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.revisions.description') }}</p>
    </header>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="filters.search" type="search" maxlength="100" :placeholder="t('admin_pages.revisions.search')" :aria-label="t('admin_pages.revisions.search')" class="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-model="filters.status" :aria-label="t('admin_pages.revisions.status')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.revisions.status_all') }}</option>
          <option v-for="status in ['pending', 'approved', 'rejected']" :key="status" :value="status">{{ t(`admin_pages.revisions.status_${status}`) }}</option>
        </select>
        <select v-model="filters.type" :aria-label="t('admin_pages.revisions.subject')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.revisions.all_types') }}</option>
          <option v-for="type in ['work', 'artist', 'entry', 'franchise']" :key="type" :value="type">{{ typeLabel(type) }}</option>
        </select>
        <select v-model="filters.action" :aria-label="t('admin_pages.revisions.action')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.revisions.all_actions') }}</option>
          <option v-for="action in ['create', 'update', 'delete']" :key="action" :value="action">{{ t(`admin_pages.revisions.action_${action}`) }}</option>
        </select>
        <select v-model="filters.is_auto_approved" :aria-label="t('admin_pages.revisions.auto')" class="rounded-lg border border-slate-300 bg-white px-3 py-2">
          <option value="">{{ t('admin_pages.revisions.auto_any') }}</option>
          <option value="1">{{ t('admin_pages.revisions.auto_yes') }}</option>
          <option value="0">{{ t('admin_pages.revisions.auto_no') }}</option>
        </select>
        <input v-model="filters.submitter" maxlength="100" :placeholder="t('admin_pages.revisions.submitter_placeholder')" :aria-label="t('admin_pages.revisions.submitter')" class="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <label class="flex items-center gap-1">{{ t('admin_pages.from') }}<input v-model="filters.from" type="date" class="rounded-lg border border-slate-300 bg-white px-2 py-2"></label>
        <label class="flex items-center gap-1">{{ t('admin_pages.to') }}<input v-model="filters.to" type="date" class="rounded-lg border border-slate-300 bg-white px-2 py-2"></label>
        <span v-if="filters.resource_id" class="rounded-lg bg-slate-200 px-3 py-2">{{ t('admin_pages.revisions.resource_filter', { id: filters.resource_id }) }}</span>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">{{ t('admin_pages.apply') }}</button>
        <button type="button" class="rounded-lg border bg-white px-3 py-2" @click="resetFilters">{{ t('admin_pages.reset') }}</button>
      </form>
    </AdminFilterBar>

    <div class="flex flex-wrap items-center gap-3 text-sm">
      <span class="text-slate-500">{{ t('common.items_total', { count: pagination.total }) }}</span>
      <NuxtLink :to="{ query: { status: 'pending' } }" class="rounded-full bg-amber-50 px-3 py-1 text-amber-800">{{ t('admin_pages.revisions.pending_count', { count: pendingData?.pagination.total ?? 0 }) }}</NuxtLink>
      <template v-if="canReview">
        <span class="ml-auto text-slate-500">{{ t('admin_pages.revisions.selected', { count: selected.length }) }}</span>
        <button type="button" :disabled="!selected.length" class="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-emerald-700 disabled:opacity-40" @click="openBatch('approve')">{{ t('admin_pages.revisions.batch_approve') }}</button>
        <button type="button" :disabled="!selected.length" class="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-red-700 disabled:opacity-40" @click="openBatch('reject')">{{ t('admin_pages.revisions.batch_reject') }}</button>
      </template>
    </div>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="batchResult" role="status" class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <div class="flex items-center justify-between gap-3">
        <p class="font-medium">{{ t('admin_pages.revisions.batch_summary', { succeeded: batchResult.succeeded, failed: batchResult.failed }) }}</p>
        <button type="button" class="text-slate-500" @click="batchResult = null">{{ t('common.close') }}</button>
      </div>
      <ul v-if="batchResult.failed" class="mt-2 space-y-1 text-red-700">
        <li v-for="item in batchResult.results.filter(result => !result.success)" :key="item.id">#{{ item.id }}：{{ localizeError({ name: item.error?.name }, 'admin_pages.revisions.action_failed') }}</li>
      </ul>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
      <AdminListState :pending="pending" :error="error" :empty="!revisions.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-225 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th class="w-10 px-4 py-3"><input v-if="canReview" type="checkbox" :checked="allSelected" :aria-label="t('admin_pages.revisions.select_all')" @change="toggleAll"></th>
                <th class="px-3 py-3">ID</th>
                <th class="px-3 py-3">{{ t('admin_pages.revisions.entry') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.revisions.subject') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.revisions.submitter') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.revisions.status') }}</th>
                <th class="px-3 py-3">{{ t('admin_pages.revisions.submitted_at') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="revision in revisions" :key="revision.id" class="hover:bg-slate-50/70">
                <td class="px-4 py-3"><input v-if="selectable(revision)" v-model="selected" type="checkbox" :value="revision.id" :aria-label="t('admin_pages.revisions.select', { id: revision.id })"></td>
                <td class="px-3 py-3 font-mono text-xs text-slate-500">{{ revision.id }}</td>
                <td class="px-3 py-3">
                  <NuxtLink :to="`/admin/revisions/${revision.id}`" class="font-medium text-slate-900 underline decoration-slate-200 underline-offset-4">{{ revision.title }}</NuxtLink>
                  <div class="mt-1 flex flex-wrap gap-2 text-xs">
                    <span :class="actionClass[revision.action]">{{ t(`admin_pages.revisions.action_${revision.action}`) }}</span>
                    <span v-if="revision.is_auto_approved" class="text-slate-500">{{ t('admin_pages.revisions.auto_yes') }}</span>
                    <span v-if="revision.rollback_of_id" class="text-violet-700">{{ t('admin_pages.revisions.rollback_of', { id: revision.rollback_of_id }) }}</span>
                    <span v-if="revision.requires_reconfirmation" class="text-amber-700">{{ t('admin_pages.revisions.needs_reconfirmation') }}</span>
                  </div>
                </td>
                <td class="px-3 py-3 text-xs">{{ typeLabel(revision.resource_type) }}<span v-if="revision.resource_id" class="font-mono text-slate-400"> #{{ revision.resource_id }}</span></td>
                <td class="px-3 py-3 text-xs">{{ revision.submitter?.nickname || revision.submitter?.username || '—' }}</td>
                <td class="px-3 py-3"><span class="rounded-full border px-2 py-0.5 text-xs" :class="statusClass[revision.status]">{{ t(`admin_pages.revisions.status_${revision.status}`) }}</span></td>
                <td class="px-3 py-3 text-xs tabular-nums text-slate-500">{{ time(revision.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>

    <AdminConfirmDialog
v-model="batchOpen" :busy="busy" :reason-required="batchAction === 'reject'"
      :title="t(batchAction === 'approve' ? 'admin_pages.revisions.batch_approve' : 'admin_pages.revisions.batch_reject')"
      :description="t('admin_pages.revisions.batch_confirm', { count: selected.length })" @confirm="runBatch">
      <p class="mt-3 text-xs text-slate-500">{{ t('admin_pages.revisions.batch_help') }}</p>
    </AdminConfirmDialog>
  </div>
</template>
