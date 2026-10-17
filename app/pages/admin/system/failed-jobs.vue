<script setup lang="ts">
import type { AdminFailedJob, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
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
    message.value = localizeError(e)
  }
}
const retry = async (job: AdminFailedJob) => {
  if (busy.value) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await $api(`/v1/admin/system/failed-jobs/${job.id}/retry`, { method: 'POST' })
    notice.value = t('admin_pages.system.retried', { id: job.id })
    await refresh()
  } catch (e) {
    message.value = localizeError(e)
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
    message.value = localizeError(e)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}
const label = (job: AdminFailedJob) => `${(job.job ?? '—').replace('App\\Jobs\\', '')}${job.template ? ` · ${job.template}` : ''}`
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value)) : '—'
useHead({ title: computed(() => t('admin_pages.system.failed_jobs')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin_pages.system.title') }}</h1>
      <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.system.failed_jobs_help') }}</p>
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
              <div class="ml-auto flex gap-3 text-xs">
                <button type="button" class="underline" :aria-expanded="detail?.id === job.id" @click="show(job)">{{ t('admin_pages.details') }}</button>
                <template v-if="canOperate">
                  <button v-if="job.retryable" type="button" :disabled="busy" class="text-emerald-700 disabled:opacity-40" @click="retry(job)">{{ t('admin_pages.system.retry') }}</button>
                  <span v-else class="text-slate-400">{{ t('admin_pages.system.not_retryable') }}</span>
                  <button type="button" class="text-red-700" @click="remove(job)">{{ t('common.delete') }}</button>
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
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="t('admin_pages.system.delete_job', { id: deleting?.id ?? '' })" :description="t('admin_pages.system.delete_job_help')" @confirm="confirmDelete" />
  </div>
</template>
