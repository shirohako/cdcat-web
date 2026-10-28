<script setup lang="ts">
import type { AdminFailedJob, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { page: value > 1 ? value : undefined } }) },
})
const { data, pending, error, refresh } = await useAsyncData('admin-failed-jobs',
  () => $api<{ jobs: AdminFailedJob[], pagination: AdminPagination }>('/v1/admin/system/failed-jobs', { query: { page: page.value } }), { watch: [page] })
const canOperate = computed(() => hasPermission('system.ops'))

const detail = ref<AdminFailedJob | null>(null)
const busy = ref(false)
const message = ref('')
const notice = ref('')
const show = async (job: AdminFailedJob) => {
  if (detail.value?.id === job.id) {
    detail.value = null
    return
  }
  try {
    detail.value = await $api<AdminFailedJob>(`/v1/admin/system/failed-jobs/${job.id}`)
  } catch (e) {
    message.value = adminError(e)
  }
}
const retry = async (job: AdminFailedJob) => {
  if (busy.value) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await $api(`/v1/admin/system/failed-jobs/${job.id}/retry`, { method: 'POST' })
    notice.value = `失败任务 #${job.id} 已重新投递`
    await refresh()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}
const deleting = ref<AdminFailedJob | null>(null)
const deleteOpen = ref(false)
const remove = (job: AdminFailedJob) => { deleting.value = job; deleteOpen.value = true }
const confirmDelete = async (reason: string) => {
  if (!deleting.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/system/failed-jobs/${deleting.value.id}`, { method: 'DELETE', body: { reason } })
    deleteOpen.value = false
    await refresh()
  } catch (e) {
    message.value = adminError(e)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}
const label = (job: AdminFailedJob) => `${(job.job ?? '—').replace('App\\Jobs\\', '')}${job.template ? ` · ${job.template}` : ''}`
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value)) : '—'
useHead({ title: '失败任务' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">运维</h1>
      <p class="mt-2 text-sm text-slate-600">主站失败任务。只有浏览量同步，以及测试、欢迎、修订通知邮件可以重试；验证码邮件过期后重发没有意义。</p>
    </header>
    <AdminSystemNav />
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>
    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.jobs.length" @retry="refresh()">
        <ul class="divide-y divide-slate-100">
          <li v-for="job in data?.jobs" :key="job.id" class="px-5 py-3 text-sm">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="font-mono text-xs text-slate-400">#{{ job.id }}</span>
              <span class="font-medium">{{ label(job) }}</span>
              <span class="text-xs text-slate-500">{{ job.queue }} · {{ time(job.failed_at) }}</span>
              <div class="ml-auto flex items-center gap-2 text-xs">
                <UiButton size="xs" :aria-expanded="detail?.id === job.id" @click="show(job)">查看详情</UiButton>
                <template v-if="canOperate">
                  <UiButton v-if="job.retryable" size="xs" :disabled="busy" @click="retry(job)">重试</UiButton>
                  <span v-else class="text-slate-400">不可重试</span>
                  <UiButton variant="danger-soft" size="xs" @click="remove(job)">删除</UiButton>
                </template>
              </div>
            </div>
            <p class="mt-1 truncate text-xs text-red-700">{{ job.error }}</p>
            <pre v-if="detail?.id === job.id" class="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">{{ detail.exception }}</pre>
          </li>
        </ul>
        <footer v-if="data" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="data.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="`删除失败任务 #${deleting?.id ?? ''}`" description="从失败列表中删除，脱敏后的任务摘要写入操作日志。" @confirm="confirmDelete" />
  </div>
</template>
