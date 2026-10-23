<script setup lang="ts">
import type { HarvestOverviewRow } from '~/types/harvest'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { hasPermission } = useAuth()
const { data, pending, error, refresh } = await useAsyncData('admin-harvest-overview', () => $api<{ events: HarvestOverviewRow[] }>('/v1/admin/harvest/events'))
// A new key reloads the submission log after an upload.
const imports = ref(0)
const imported = () => {
  void refresh()
  imports.value++
}

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
const statuses = ['pending', 'approved', 'linked', 'rejected', 'excluded'] as const
useHead({ title: computed(() => t('admin_pages.harvest.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.harvest.title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm text-slate-600">{{ t('admin_pages.harvest.description') }}</p>
      </div>
      <div class="w-72">
        <p class="mb-1 text-xs text-slate-500">{{ t('admin_pages.harvest.add_event_help') }}</p>
        <EditorEntityPicker kind="event" :placeholder="t('admin_pages.harvest.add_event')" @select="navigateTo(`/admin/harvest/${$event.id}`)" />
      </div>
    </header>

    <div v-if="hasPermission('harvest.submit')" class="grid gap-4 lg:grid-cols-2">
      <AdminHarvestImportPanel @imported="imported" />
      <AdminHarvestTokensPanel />
    </div>

    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.events.length" @retry="refresh()">
        <ul class="divide-y divide-slate-100">
          <li v-for="row in data?.events" :key="row.event.id" class="flex flex-wrap items-center gap-4 px-5 py-4">
            <div class="min-w-48 flex-1">
              <NuxtLink :to="`/admin/harvest/${row.event.id}`" class="font-semibold hover:underline">{{ row.event.name }}</NuxtLink>
              <p class="text-xs text-slate-500">{{ row.event.slug }} · {{ row.event.start_date }} · {{ t('admin_pages.harvest.last_seen', { time: time(row.last_seen_at) }) }}</p>
            </div>
            <p class="text-sm tabular-nums text-slate-600">{{ t('admin_pages.harvest.circles_covered', { covered: row.covered_circles, total: row.circles }) }}</p>
            <div class="flex flex-wrap gap-2 text-xs">
              <span v-for="status in statuses" :key="status" class="rounded-full bg-slate-100 px-2 py-1 tabular-nums" :class="{ 'bg-amber-100 text-amber-800': status === 'pending' && row.candidates.pending }">
                {{ t(`admin_pages.harvest.status.${status}`) }} {{ row.candidates[status] ?? 0 }}
              </span>
            </div>
            <NuxtLink :to="`/admin/harvest/${row.event.id}`" class="rounded-lg border px-3 py-1.5 text-sm">{{ t('admin_pages.harvest.open') }}</NuxtLink>
          </li>
        </ul>
      </AdminListState>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{{ t('admin_pages.harvest.submissions.title') }}</h2>
      <AdminHarvestSubmissionsPanel :key="imports" />
    </section>
  </div>
</template>
