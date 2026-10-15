<script setup lang="ts">
import { adminMenu } from '~/config/admin'
import type { AdminDashboard } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $api } = useNuxtApp()
const { hasPermission } = useAuth()
const { t } = useAdminI18n()
const range = ref<7 | 30>(7)
const { data, pending, error, refresh } = await useAsyncData('admin-dashboard', () => $api<AdminDashboard>('/v1/admin/dashboard'))
const links = computed(() => adminMenu.filter(item => item.path !== '/admin' && hasPermission(item.permission)))
const points = (daily: { count: number }[]) => {
  const visible = daily.slice(-range.value)
  const max = Math.max(1, ...visible.map(day => day.count))
  return visible.map((day, index) => `${index * 100 / Math.max(1, visible.length - 1)},${36 - day.count * 32 / max}`).join(' ')
}
const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => `${t('admin_pages.dashboard.title')} | CDCAT`) })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div><h1 class="text-3xl font-bold">{{ t('admin_pages.dashboard.title') }}</h1><p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.dashboard.description') }}</p></div>
      <button type="button" :disabled="pending" class="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-50" @click="refresh()">{{ t('admin_pages.refresh') }}</button>
    </header>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <template v-if="data">
        <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p class="text-slate-500">{{ t('admin_pages.last_updated', { time: time(data.generated_at) }) }}</p>
          <div class="flex gap-2"><button v-for="days in ([7, 30] as const)" :key="days" type="button" :aria-pressed="range === days" class="rounded-lg border px-3 py-2" :class="range === days ? 'bg-slate-900 text-white' : 'bg-white'" @click="range = days">{{ t(`admin_pages.dashboard.days_${days}`) }}</button></div>
        </div>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article v-for="metric in data.metrics" :key="metric.key" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 class="text-sm text-slate-600">{{ t(`admin_pages.dashboard.${metric.key}`) }}</h2>
            <p class="mt-2 text-3xl font-semibold tabular-nums">{{ metric.total.toLocaleString('zh-CN') }}</p>
            <p class="mt-2 text-xs text-slate-500">{{ t('admin_pages.dashboard.new_count', { count: range === 7 ? metric.new_7 : metric.new_30 }) }}</p>
            <svg viewBox="0 0 100 40" role="img" :aria-label="t('admin_pages.dashboard.trend', { name: t(`admin_pages.dashboard.${metric.key}`) })" class="mt-3 h-12 w-full text-emerald-600" preserveAspectRatio="none"><title>{{ metric.daily.slice(-range).map(day => `${day.date}: ${day.count}`).join(' · ') }}</title><polyline :points="points(metric.daily)" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" /></svg>
          </article>
        </div>
        <section class="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="font-semibold">{{ t('admin_pages.dashboard.shortcuts') }}</h2>
          <div class="mt-3 flex flex-wrap gap-3">
            <NuxtLink v-for="link in links" :key="link.path" :to="link.path" class="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">{{ t(link.label) }}<span v-if="link.path === '/admin/revisions' && data.pending_revisions !== undefined" class="ml-2 rounded bg-amber-50 px-2 py-0.5 text-amber-800">{{ data.pending_revisions }}</span></NuxtLink>
          </div>
        </section>
        <div class="mt-6 grid gap-6 xl:grid-cols-2">
          <section v-if="hasPermission('audit.view') && data.recent_actions" class="rounded-xl border border-slate-200 bg-white p-5"><h2 class="mb-4 font-semibold">{{ t('admin_pages.dashboard.recent') }}</h2><AdminAuditTimeline :entries="data.recent_actions" /></section>
          <section v-if="hasPermission('system.logs') && data.operations" class="rounded-xl border border-slate-200 bg-white p-5">
            <h2 class="font-semibold">{{ t('admin_pages.dashboard.operations') }}</h2>
            <dl class="mt-4 space-y-4 text-sm">
              <div class="flex justify-between gap-4"><dt>{{ t('admin_pages.dashboard.failed_jobs') }}</dt><dd class="font-semibold">{{ data.operations.failed_jobs }}</dd></div>
              <div v-for="name in (['scheduler', 'worker'] as const)" :key="name" class="flex flex-wrap justify-between gap-2"><dt>{{ t(`admin_pages.dashboard.${name}`) }}</dt><dd>{{ t(`admin_pages.dashboard.${data.operations[name].status}`) }}<span v-if="data.operations[name].last_seen_at" class="ml-2 text-xs text-slate-500">{{ time(data.operations[name].last_seen_at) }}</span></dd></div>
            </dl>
            <p class="mt-4 text-xs text-slate-500">{{ t('admin_pages.dashboard.heartbeat_note') }}</p>
          </section>
        </div>
      </template>
    </AdminListState>
  </div>
</template>
