<script setup lang="ts">
import type { HarvestOverview, HarvestTaskRow } from '~/types/harvest'

/** The tasks records came from (one entry of one site each), and the records each source handed in. */
defineProps<{ sources: HarvestOverview['sources'] }>()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { data, pending, error, refresh } = await useAsyncData('admin-harvest-tasks', () => $api<{ tasks: HarvestTaskRow[] }>('/v1/admin/harvest/tasks'))
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
</script>

<template>
  <div class="space-y-4">
    <p class="max-w-3xl text-sm text-slate-600">{{ t('admin_pages.harvest.tasks.description') }}</p>
    <p v-if="sources.length" class="flex flex-wrap gap-2 text-xs">
      <span v-for="source in sources" :key="source.source" class="rounded-full bg-slate-100 px-2 py-1 tabular-nums">
        {{ t('admin_pages.harvest.tasks.source_records', { source: source.label, count: source.records }) }}<template v-if="source.non_music"> · {{ t('admin_pages.harvest.tasks.non_music', { count: source.non_music }) }}</template><template v-if="source.gone"> · {{ t('admin_pages.harvest.tasks.gone', { count: source.gone }) }}</template>
      </span>
    </p>
    <section class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.tasks.length" @retry="refresh()">
        <table class="w-full min-w-180 text-left text-sm">
          <thead class="border-b border-slate-100 text-xs text-slate-500">
            <tr>
              <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.tasks.task') }}</th>
              <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.tasks.event_mode') }}</th>
              <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.tasks.records') }}</th>
              <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.tasks.candidates') }}</th>
              <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.tasks.last_seen') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="task in data?.tasks" :key="task.id" class="align-top">
              <td class="px-4 py-3">
                <p class="font-medium">
                  <a v-if="task.url" :href="task.url" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ task.label ?? task.key }}</a>
                  <template v-else>{{ task.label ?? task.key }}</template>
                </p>
                <p class="text-xs text-slate-500">{{ task.source_label }} · {{ task.entry_label }} · <span class="font-mono">{{ task.key }}</span></p>
              </td>
              <td class="px-4 py-3 text-xs">
                {{ t(`admin_pages.harvest.event_modes.${task.event_mode}`) }}<template v-if="task.event"> · {{ task.event.name }}</template>
              </td>
              <td class="px-4 py-3 tabular-nums">
                {{ task.records }}
                <span v-if="task.delisted" class="block text-xs text-slate-500">{{ t('admin_pages.harvest.tasks.delisted', { count: task.delisted }) }}</span>
              </td>
              <td class="px-4 py-3 text-xs tabular-nums">
                <NuxtLink :to="{ path: '/admin/harvest', query: { task_id: String(task.id) } }" class="text-sky-700 hover:underline">{{ t('admin_pages.harvest.tasks.pending', { count: task.candidates.pending ?? 0 }) }}</NuxtLink>
                <span v-if="task.candidates.approved" class="ml-2 text-slate-500">{{ t('admin_pages.harvest.status.approved') }} {{ task.candidates.approved }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-500">
                {{ time(task.last_seen_at) }}
                <span v-if="task.listed_at" class="block">{{ t('admin_pages.harvest.tasks.listed_at', { time: time(task.listed_at) }) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminListState>
    </section>
  </div>
</template>
