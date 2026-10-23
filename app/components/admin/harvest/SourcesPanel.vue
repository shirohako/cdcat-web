<script setup lang="ts">
import type { HarvestEventSource } from '~/types/harvest'

defineProps<{ sources: HarvestEventSource[] }>()
const { t } = useAdminI18n()
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
</script>

<template>
  <div class="space-y-3">
    <p class="max-w-3xl text-sm text-slate-600">{{ t('admin_pages.harvest.sources.description') }}</p>
    <section class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <p v-if="!sources.length" class="px-5 py-8 text-center text-sm text-slate-500">{{ t('admin_pages.harvest.sources.empty') }}</p>
      <table v-else class="w-full min-w-160 text-left text-sm">
        <thead class="border-b border-slate-100 text-xs text-slate-500">
          <tr>
            <th class="px-4 py-2 font-normal" />
            <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.sources.records') }}</th>
            <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.sources.non_music') }}</th>
            <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.sources.delisted') }}</th>
            <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.sources.gone') }}</th>
            <th class="px-4 py-2 font-normal">{{ t('admin_pages.harvest.sources.last_seen') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 tabular-nums">
          <tr v-for="source in sources" :key="source.source">
            <td class="px-4 py-3 font-medium">{{ source.label }}</td>
            <td class="px-4 py-3">{{ source.records }}</td>
            <td class="px-4 py-3 text-slate-500">{{ source.non_music }}</td>
            <td class="px-4 py-3 text-slate-500">{{ source.delisted }}</td>
            <td class="px-4 py-3 text-slate-500">{{ source.gone }}</td>
            <td class="px-4 py-3 text-xs text-slate-500">{{ time(source.last_seen_at) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
