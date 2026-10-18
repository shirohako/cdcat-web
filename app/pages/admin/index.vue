<script setup lang="ts">
import type { AdminDashboard } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { t, te } = useAdminI18n()
const range = ref<7 | 30>(7)
const { data, pending, error, refresh } = await useAsyncData('admin-dashboard', () => $api<AdminDashboard>('/v1/admin/dashboard'))
const points = (daily: { count: number }[]) => {
  const visible = daily.slice(-range.value)
  const max = Math.max(1, ...visible.map(day => day.count))
  return visible.map((day, index) => `${index * 100 / Math.max(1, visible.length - 1)},${34 - day.count * 30 / max}`).join(' ')
}
const action = (value: string) => {
  const key = `admin_pages.audit_actions.${value.replace(/[.-]/g, '_')}`
  return te(key) ? t(key) : value
}
const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const shortTime = (value: string) => {
  const date = new Date(value)
  const today = new Date().toDateString() === date.toDateString()
  return new Intl.DateTimeFormat('zh-CN', today ? { timeStyle: 'short' } : { month: 'numeric', day: 'numeric' }).format(date)
}
const heartbeatClass: Record<string, string> = { healthy: 'text-emerald-700', stale: 'text-amber-700', unknown: 'text-slate-500' }
useHead({ title: computed(() => t('admin_pages.dashboard.title')) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 p-4 sm:px-8 sm:py-7">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-[28px] font-bold leading-tight">{{ t('admin_pages.dashboard.title') }}</h1>
        <p class="mt-1.5 text-sm text-slate-600">{{ t('admin_pages.dashboard.description') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-[13px]">
        <span v-if="data" class="mr-1 text-slate-500">{{ t('admin_pages.last_updated', { time: time(data.generated_at) }) }}</span>
        <button
          v-for="days in ([7, 30] as const)" :key="days" type="button" :aria-pressed="range === days"
          class="rounded-lg px-3.5 py-1.5 font-medium" :class="range === days ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
          @click="range = days"
        >{{ t(`admin_pages.dashboard.days_${days}`) }}</button>
        <button type="button" :disabled="pending" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50" @click="refresh()">
          <Icon name="lucide:refresh-cw" class="size-3.5" :class="pending ? 'animate-spin' : ''" />{{ t('admin_pages.refresh') }}
        </button>
      </div>
    </header>

    <AdminListState :pending="pending && !data" :error="error" @retry="refresh()">
      <template v-if="data">
        <section class="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <NuxtLink v-if="data.pending_revisions !== undefined" to="/admin/revisions?status=pending" class="rounded-xl bg-[#0f1115] p-4 text-white shadow-sm transition-transform hover:-translate-y-0.5">
            <p class="text-[13px] text-slate-400">{{ t('admin_pages.dashboard.pending') }}</p>
            <div class="mt-1.5 flex items-baseline justify-between gap-2">
              <span class="font-mono text-[28px] font-semibold tabular-nums">{{ data.pending_revisions }}</span>
              <span class="rounded-md bg-amber-400 px-1.5 py-0.5 text-xs font-medium text-slate-900">{{ t('admin_pages.dashboard.go_review') }}</span>
            </div>
            <p class="mt-4 text-xs text-slate-400">
              {{ t('admin_pages.dashboard.pending_help') }}
              <template v-if="data.conflicted_revisions"> · <span class="text-rose-300">{{ t('admin_pages.dashboard.conflicted', { count: data.conflicted_revisions }) }}</span></template>
            </p>
          </NuxtLink>
          <NuxtLink v-if="data.unchecked_lyrics !== undefined" to="/admin/lyrics" class="rounded-xl bg-[#0f1115] p-4 text-white shadow-sm transition-transform hover:-translate-y-0.5">
            <p class="text-[13px] text-slate-400">{{ t('admin_pages.dashboard.unchecked_lyrics') }}</p>
            <div class="mt-1.5 flex items-baseline justify-between gap-2">
              <span class="font-mono text-[28px] font-semibold tabular-nums">{{ data.unchecked_lyrics }}</span>
              <span class="rounded-md bg-amber-400 px-1.5 py-0.5 text-xs font-medium text-slate-900">{{ t('admin_pages.dashboard.go_patrol') }}</span>
            </div>
            <p class="mt-4 text-xs text-slate-400">{{ t('admin_pages.dashboard.pending_lyric_revisions', { count: data.pending_lyric_revisions ?? 0 }) }}</p>
          </NuxtLink>
          <NuxtLink v-if="data.pending_reports !== undefined" to="/admin/reports" class="rounded-xl bg-[#0f1115] p-4 text-white shadow-sm transition-transform hover:-translate-y-0.5">
            <p class="text-[13px] text-slate-400">{{ t('admin_pages.dashboard.reports_card') }}</p>
            <div class="mt-1.5 flex items-baseline justify-between gap-2">
              <span class="font-mono text-[28px] font-semibold tabular-nums">{{ data.pending_reports }}</span>
              <span class="rounded-md bg-amber-400 px-1.5 py-0.5 text-xs font-medium text-slate-900">{{ t('admin_pages.dashboard.go_handle') }}</span>
            </div>
          </NuxtLink>
          <article v-for="metric in data.metrics" :key="metric.key" class="rounded-xl bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,.06),0_4px_16px_rgba(17,24,39,.04)]">
            <p class="text-[13px] text-slate-600">{{ t(`admin_pages.dashboard.${metric.key}`) }}</p>
            <div class="mt-1.5 flex items-baseline justify-between gap-2">
              <span class="font-mono text-[28px] font-semibold tabular-nums">{{ metric.total.toLocaleString('zh-CN') }}</span>
              <span class="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">+{{ range === 7 ? metric.new_7 : metric.new_30 }}</span>
            </div>
            <svg viewBox="0 0 100 36" role="img" :aria-label="t('admin_pages.dashboard.trend', { name: t(`admin_pages.dashboard.${metric.key}`) })" class="mt-3 h-9 w-full text-slate-900" preserveAspectRatio="none">
              <title>{{ metric.daily.slice(-range).map(day => `${day.date}: ${day.count}`).join(' · ') }}</title>
              <polyline :points="points(metric.daily)" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
            </svg>
          </article>
        </section>

        <div v-if="(hasPermission('audit.view') && data.recent_actions) || (hasPermission('system.logs') && data.operations)" class="mt-6 grid gap-4 xl:grid-cols-2">
          <section v-if="hasPermission('audit.view') && data.recent_actions" class="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,.06)]">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ t('admin_pages.dashboard.recent') }}</h2>
              <NuxtLink to="/admin/audit" class="text-[13px] text-amber-700 hover:text-amber-900">{{ t('admin_pages.dashboard.all_logs') }}</NuxtLink>
            </div>
            <ol v-if="data.recent_actions.length" class="mt-3">
              <li v-for="entry in data.recent_actions" :key="entry.id" class="flex gap-3 border-t border-slate-100 py-2.5 text-sm first:border-t-0">
                <span class="mt-[7px] size-2 shrink-0 rounded-full" :class="entry.result === 'failed' ? 'bg-red-500' : 'bg-amber-400'" />
                <span class="min-w-0 flex-1">
                  <b class="font-semibold">{{ action(entry.action) }}</b><span class="text-slate-500"> · {{ entry.actor_name || '—' }}</span>
                  <span v-if="entry.reason" class="block truncate text-xs text-slate-500">{{ entry.reason }}</span>
                </span>
                <time class="shrink-0 font-mono text-xs text-slate-500" :datetime="entry.created_at">{{ shortTime(entry.created_at) }}</time>
              </li>
            </ol>
            <p v-else class="mt-3 text-sm text-slate-500">{{ t('admin_pages.audit_empty') }}</p>
          </section>
          <section v-if="hasPermission('system.logs') && data.operations" class="rounded-xl bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,.06)]">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ t('admin_pages.dashboard.operations') }}</h2>
              <NuxtLink to="/admin/system" class="text-[13px] text-amber-700 hover:text-amber-900">{{ t('admin_pages.dashboard.view_system') }}</NuxtLink>
            </div>
            <dl class="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div class="rounded-[10px] bg-slate-50 px-3.5 py-3">
                <dt class="text-xs text-slate-500">{{ t('admin_pages.dashboard.failed_jobs') }}</dt>
                <dd class="mt-1 text-[15px] font-semibold" :class="data.operations.failed_jobs ? 'text-red-700' : 'text-emerald-700'">{{ data.operations.failed_jobs }}</dd>
              </div>
              <div v-for="name in (['scheduler', 'worker'] as const)" :key="name" class="rounded-[10px] bg-slate-50 px-3.5 py-3">
                <dt class="text-xs text-slate-500">{{ t(`admin_pages.dashboard.${name}`) }}</dt>
                <dd class="mt-1 text-[15px] font-semibold" :class="heartbeatClass[data.operations[name].status]">{{ t(`admin_pages.dashboard.${data.operations[name].status}`) }}</dd>
                <dd v-if="data.operations[name].last_seen_at" class="mt-0.5 text-xs text-slate-500">{{ time(data.operations[name].last_seen_at) }}</dd>
              </div>
            </dl>
            <p class="mt-3 text-xs text-slate-500">{{ t('admin_pages.dashboard.heartbeat_note') }}</p>
          </section>
        </div>
      </template>
    </AdminListState>
  </div>
</template>
