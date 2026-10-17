<script setup lang="ts">
import type { AdminAuditLog, AdminSystemStatus } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
const { data, pending, error, refresh } = await useAsyncData('admin-system-status', () => $api<AdminSystemStatus>('/v1/admin/system/status'))
const canOperate = computed(() => hasPermission('system.ops'))

const statusClass: Record<string, string> = { ok: 'text-emerald-700', healthy: 'text-emerald-700', success: 'text-emerald-700', stale: 'text-amber-700', error: 'text-red-700', failed: 'text-red-700', unknown: 'text-slate-500' }
const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value)) : '—'

// ===== Cache =====
const targets = ['work_contributors', 'dashboard', 'permissions', 'site_settings'] as const
const cache = reactive({ targets: [] as string[], work_id: '', reason: '' })
const busy = ref(false)
const message = ref('')
const notice = ref('')
const clearCache = async () => {
  if (busy.value || !cache.targets.length) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    const result = await $api<{ cleared: Record<string, number> }>('/v1/admin/system/cache/clear', { method: 'POST', body: {
      targets: cache.targets, work_id: cache.work_id ? Number(cache.work_id) : null, reason: cache.reason || null,
    } })
    notice.value = t('admin_pages.system.cache_cleared', { detail: Object.entries(result.cleared).map(([key, count]) => `${t(`admin_pages.system.cache_targets.${key}`)} ${count}`).join('、') })
    cache.targets = []
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}

// ===== Test mail =====
const mailLog = ref<AdminAuditLog | null>(null)
const mailAuditId = ref<number | null>(null)
let poll: ReturnType<typeof setTimeout> | null = null
const pollMail = async (attempt = 0) => {
  if (!mailAuditId.value || !hasPermission('audit.view')) return
  try {
    mailLog.value = await $api<AdminAuditLog>(`/v1/admin/audit-logs/${mailAuditId.value}`)
  } catch { /* Keep the submitted state; the audit log remains the source of truth. */ }
  if (mailLog.value?.result === 'submitted' && attempt < 20) poll = setTimeout(() => pollMail(attempt + 1), 3000)
}
const sendTestMail = async () => {
  if (busy.value) return
  busy.value = true
  message.value = ''
  mailLog.value = null
  try {
    const result = await $api<{ audit_id: number }>('/v1/admin/system/test-mail', { method: 'POST' })
    mailAuditId.value = result.audit_id
    await pollMail()
  } catch (e) {
    message.value = localizeError(e)
  } finally {
    busy.value = false
  }
}
onUnmounted(() => { if (poll) clearTimeout(poll) })
useHead({ title: computed(() => t('admin_pages.system.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.system.title') }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.system.description') }}</p>
      </div>
      <button type="button" :disabled="pending" class="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-50" @click="refresh()">{{ t('admin_pages.refresh') }}</button>
    </header>
    <AdminSystemNav />
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="data">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="(check, name) in data.checks" :key="name" class="rounded-xl border border-slate-200 bg-white p-4">
            <h2 class="text-sm text-slate-600">{{ t(`admin_pages.system.checks.${name}`) }}</h2>
            <p class="mt-2 text-lg font-semibold" :class="statusClass[check.status]">{{ t(`admin_pages.system.state.${check.status}`) }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ check.latency_ms !== undefined ? `${check.latency_ms} ms` : (check.error ?? '') }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-4">
            <h2 class="text-sm text-slate-600">{{ t('admin_pages.system.failed_jobs') }}</h2>
            <NuxtLink to="/admin/system/failed-jobs" class="mt-2 block text-lg font-semibold" :class="data.failed_jobs ? 'text-red-700' : 'text-emerald-700'">{{ data.failed_jobs }}</NuxtLink>
          </article>
        </div>

        <section class="mt-5 grid gap-4 md:grid-cols-2">
          <article v-for="(beat, name) in data.heartbeats" :key="name" class="rounded-xl border border-slate-200 bg-white p-4">
            <h2 class="text-sm text-slate-600">{{ t(`admin_pages.dashboard.${name}`) }}</h2>
            <p class="mt-2 text-lg font-semibold" :class="statusClass[beat.status]">{{ t(`admin_pages.dashboard.${beat.status}`) }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ t('admin_pages.system.last_seen', { time: time(beat.last_seen_at) }) }}</p>
          </article>
        </section>
        <p class="mt-2 text-xs text-slate-500">{{ t('admin_pages.dashboard.heartbeat_note') }}</p>

        <section class="mt-5 rounded-xl border border-slate-200 bg-white">
          <h2 class="border-b border-slate-100 px-5 py-3 font-semibold">{{ t('admin_pages.system.queues') }}</h2>
          <ul class="divide-y divide-slate-100 text-sm">
            <li v-for="queue in data.queues" :key="queue.name" class="flex justify-between px-5 py-2.5"><span>{{ queue.name }} <span class="text-xs text-slate-400">{{ queue.connection }}</span></span><span :class="queue.error ? 'text-red-700' : 'tabular-nums'">{{ queue.error ?? queue.size }}</span></li>
          </ul>
        </section>

        <section class="mt-5 rounded-xl border border-slate-200 bg-white">
          <h2 class="border-b border-slate-100 px-5 py-3 font-semibold">{{ t('admin_pages.system.schedule') }}</h2>
          <div class="overflow-x-auto">
            <table class="w-full min-w-175 text-left text-sm">
              <thead class="bg-slate-50 text-xs text-slate-500"><tr><th class="px-5 py-2">{{ t('admin_pages.system.task') }}</th><th class="px-5 py-2">{{ t('admin_pages.system.expression') }}</th><th class="px-5 py-2">{{ t('admin_pages.system.next_run') }}</th><th class="px-5 py-2">{{ t('admin_pages.system.last_run') }}</th></tr></thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="task in data.schedule" :key="task.name">
                  <td class="px-5 py-2.5 font-mono text-xs">{{ task.name.replace('App\\Jobs\\', '') }}</td>
                  <td class="px-5 py-2.5 font-mono text-xs">{{ task.expression }}</td>
                  <td class="px-5 py-2.5 text-xs">{{ time(task.next_run_at) }}</td>
                  <td class="px-5 py-2.5 text-xs">
                    <template v-if="task.last_run"><span :class="statusClass[task.last_run.status]">{{ t(`admin_pages.system.state.${task.last_run.status}`) }}</span> · {{ time(task.last_run.finished_at) }}<p v-if="task.last_run.error" class="mt-1 text-red-700">{{ task.last_run.error }}</p></template>
                    <span v-else class="text-slate-500">{{ t('admin_pages.system.never_ran') }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </AdminListState>

    <section v-if="canOperate" class="grid gap-5 lg:grid-cols-2">
      <form class="rounded-xl border border-slate-200 bg-white p-5 text-sm" @submit.prevent="clearCache">
        <h2 class="font-semibold">{{ t('admin_pages.system.cache') }}</h2>
        <p class="mt-1 text-slate-600">{{ t('admin_pages.system.cache_help') }}</p>
        <div class="mt-3 space-y-2">
          <label v-for="target in targets" :key="target" class="flex items-center gap-2"><input v-model="cache.targets" type="checkbox" :value="target">{{ t(`admin_pages.system.cache_targets.${target}`) }}</label>
        </div>
        <label v-if="cache.targets.includes('work_contributors')" class="mt-3 block">{{ t('admin_pages.system.work_id_optional') }}<input v-model="cache.work_id" inputmode="numeric" pattern="[0-9]*" class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2"></label>
        <label class="mt-3 block">{{ t('admin_pages.optional_reason') }}<input v-model="cache.reason" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"></label>
        <button type="submit" :disabled="busy || !cache.targets.length" class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40">{{ t('admin_pages.system.clear') }}</button>
      </form>
      <section class="rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <h2 class="font-semibold">{{ t('admin_pages.system.test_mail') }}</h2>
        <p class="mt-1 text-slate-600">{{ t('admin_pages.system.test_mail_help') }}</p>
        <button type="button" :disabled="busy" class="mt-4 rounded-lg border px-4 py-2 disabled:opacity-40" @click="sendTestMail">{{ t('admin_pages.system.send_test_mail') }}</button>
        <p v-if="mailAuditId" role="status" class="mt-3">
          {{ t('admin_pages.system.test_mail_state', { id: mailAuditId }) }}
          <span :class="statusClass[mailLog?.result ?? 'unknown']">{{ mailLog ? t(`admin_pages.audit_results.${mailLog.result}`) : t('admin_pages.audit_results.submitted') }}</span>
        </p>
      </section>
      <p v-if="notice" role="status" class="text-sm text-emerald-700 lg:col-span-2">{{ notice }}</p>
      <p v-if="message" role="alert" class="text-sm text-red-700 lg:col-span-2">{{ message }}</p>
    </section>
  </div>
</template>
