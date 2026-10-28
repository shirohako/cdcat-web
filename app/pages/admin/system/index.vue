<script setup lang="ts">
import type { AdminAuditLog, AdminSystemStatus } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const systemCacheTargetLabels: Record<string, string> = { album_contributors: '专辑贡献者缓存', dashboard: '工作台统计', permissions: '权限缓存', site_settings: '站点设置缓存' }
const systemCheckLabels: Record<string, string> = { api: 'API', database: '数据库', redis: 'Redis' }
const systemStateLabels: Record<string, string> = { ok: '正常', error: '异常', success: '成功', failed: '失败', unknown: '未知' }
const { data, pending, error, refresh } = await useAsyncData('admin-system-status', () => $api<AdminSystemStatus>('/v1/admin/system/status'))
const canOperate = computed(() => hasPermission('system.ops'))

const statusClass: Record<string, string> = { ok: 'text-emerald-700', healthy: 'text-emerald-700', success: 'text-emerald-700', stale: 'text-amber-700', error: 'text-red-700', failed: 'text-red-700', unknown: 'text-slate-500' }
const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value)) : '—'

// ===== Cache =====
const targets = ['album_contributors', 'dashboard', 'permissions', 'site_settings'] as const
const cache = reactive({ targets: [] as string[], album_id: '', reason: '' })
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
      targets: cache.targets, album_id: cache.album_id ? Number(cache.album_id) : null, reason: cache.reason || null,
    } })
    notice.value = `已清除：${Object.entries(result.cleared).map(([key, count]) => `${systemCacheTargetLabels[key]} ${count}`).join('、')}`
    cache.targets = []
  } catch (e) {
    message.value = adminError(e)
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
    mailLog.value = await $api<AdminAuditLog>(`/v1/admin/audit-logs/${mailAuditId.value}`, { progress: false })
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
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}
onUnmounted(() => { if (poll) clearTimeout(poll) })
useHead({ title: '运维' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">运维</h1>
        <p class="mt-2 text-sm text-slate-600">运行状态、调度器和队列心跳、定时任务结果，以及白名单内的运维操作。</p>
      </div>
      <UiButton :disabled="pending" @click="refresh()">刷新</UiButton>
    </header>
    <AdminSystemNav />
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="data">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article v-for="(check, name) in data.checks" :key="name" class="rounded-xl border border-slate-200 bg-white p-4">
            <h2 class="text-sm text-slate-600">{{ systemCheckLabels[name] }}</h2>
            <p class="mt-2 text-lg font-semibold" :class="statusClass[check.status]">{{ systemStateLabels[check.status] }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ check.latency_ms !== undefined ? `${check.latency_ms} ms` : (check.error ?? '') }}</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-white p-4">
            <h2 class="text-sm text-slate-600">失败任务</h2>
            <NuxtLink to="/admin/system/failed-jobs" class="mt-2 block text-lg font-semibold" :class="data.failed_jobs ? 'text-red-700' : 'text-emerald-700'">{{ data.failed_jobs }}</NuxtLink>
          </article>
        </div>

        <section class="mt-5 grid gap-4 md:grid-cols-2">
          <article v-for="(beat, name) in data.heartbeats" :key="name" class="rounded-xl border border-slate-200 bg-white p-4">
            <h2 class="text-sm text-slate-600">{{ heartbeatLabels[name] }}</h2>
            <p class="mt-2 text-lg font-semibold" :class="statusClass[beat.status]">{{ heartbeatStatusLabels[beat.status] }}</p>
            <p class="mt-1 text-xs text-slate-500">最近心跳：{{ time(beat.last_seen_at) }}</p>
          </article>
        </section>
        <p class="mt-2 text-xs text-slate-500">无有效心跳时无法确认运行状态，请结合实际进程和任务执行记录核查。</p>

        <section class="mt-5 rounded-xl border border-slate-200 bg-white">
          <h2 class="border-b border-slate-100 px-5 py-3 font-semibold">队列长度</h2>
          <ul class="divide-y divide-slate-100 text-sm">
            <li v-for="queue in data.queues" :key="queue.name" class="flex justify-between px-5 py-2.5"><span>{{ queue.name }} <span class="text-xs text-slate-400">{{ queue.connection }}</span></span><span :class="queue.error ? 'text-red-700' : 'tabular-nums'">{{ queue.error ?? queue.size }}</span></li>
          </ul>
        </section>

        <section class="mt-5 rounded-xl border border-slate-200 bg-white">
          <h2 class="border-b border-slate-100 px-5 py-3 font-semibold">定时任务</h2>
          <div class="overflow-x-auto">
            <table class="w-full min-w-175 text-left text-sm">
              <thead class="bg-slate-50 text-xs text-slate-500"><tr><th class="px-5 py-2">任务</th><th class="px-5 py-2">周期</th><th class="px-5 py-2">下次执行</th><th class="px-5 py-2">最近一次</th></tr></thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="task in data.schedule" :key="task.name">
                  <td class="px-5 py-2.5 font-mono text-xs">{{ (task.name ?? '—').replace('App\\Jobs\\', '') }}</td>
                  <td class="px-5 py-2.5 font-mono text-xs">{{ task.expression }}</td>
                  <td class="px-5 py-2.5 text-xs">{{ time(task.next_run_at) }}</td>
                  <td class="px-5 py-2.5 text-xs">
                    <template v-if="task.last_run"><span :class="statusClass[task.last_run.status]">{{ systemStateLabels[task.last_run.status] }}</span> · {{ time(task.last_run.finished_at) }}<p v-if="task.last_run.error" class="mt-1 text-red-700">{{ task.last_run.error }}</p></template>
                    <span v-else class="text-slate-500">尚无执行记录</span>
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
        <h2 class="font-semibold">清除缓存</h2>
        <p class="mt-1 text-slate-600">只清除可以重建的缓存，不会清空 Redis 中的队列、待同步浏览量和验证码频率限制。</p>
        <div class="mt-3 space-y-2">
          <label v-for="target in targets" :key="target" class="flex items-center gap-2"><input v-model="cache.targets" type="checkbox" :value="target">{{ systemCacheTargetLabels[target] }}</label>
        </div>
        <label v-if="cache.targets.includes('album_contributors')" class="mt-3 block">专辑 ID（可选，不填则清除全部专辑）<input v-model="cache.album_id" inputmode="numeric" pattern="[0-9]*" class="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2"></label>
        <label class="mt-3 block">原因（可选，写入操作日志）<input v-model="cache.reason" maxlength="2000" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"></label>
        <UiButton type="submit" variant="primary" :disabled="busy || !cache.targets.length" class="mt-4">清除选中的缓存</UiButton>
      </form>
      <section class="rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <h2 class="font-semibold">测试邮件</h2>
        <p class="mt-1 text-slate-600">使用固定模板发送到你自己的邮箱，每分钟最多一次。结果由队列执行后回写。</p>
        <UiButton :disabled="busy" class="mt-4" @click="sendTestMail">发送测试邮件</UiButton>
        <p v-if="mailAuditId" role="status" class="mt-3">
          操作 #{{ mailAuditId }}：
          <span :class="statusClass[mailLog?.result ?? 'unknown']">{{ mailLog ? auditResultLabels[mailLog.result] : '已提交' }}</span>
        </p>
      </section>
      <p v-if="notice" role="status" class="text-sm text-emerald-700 lg:col-span-2">{{ notice }}</p>
      <p v-if="message" role="alert" class="text-sm text-red-700 lg:col-span-2">{{ message }}</p>
    </section>
  </div>
</template>
