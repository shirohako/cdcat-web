<script setup lang="ts">
import type { HarvestOverview, HarvestTaskRow } from '~/types/harvest'

/** The tasks records came from (one entry of one site each), and the records each source handed in. */
defineProps<{ sources: HarvestOverview['sources'] }>()
const { $api } = useNuxtApp()
const harvestEventModeLabels: Record<string, string> = { none: '不附加活动', fixed: '固定活动', auto: '自动判断' }
const { data, pending, error, refresh } = await useAsyncData('admin-harvest-tasks', () => $api<{ tasks: HarvestTaskRow[] }>('/v1/admin/harvest/tasks'))
const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
</script>

<template>
  <div class="space-y-4">
    <p class="max-w-3xl text-sm text-slate-600">采集器的任务：一个站点的一个入口，例如 Bangumi 的一个目录、BOOTH 的一个店铺、一届活动的活动页。任务由数据包带来，在采集器里新建和运行。</p>
    <p v-if="sources.length" class="flex flex-wrap gap-2 text-xs">
      <span v-for="source in sources" :key="source.source" class="rounded-full bg-slate-100 px-2 py-1 tabular-nums">
        {{ source.label }} {{ source.records }} 条<template v-if="source.non_music"> · 非音乐 {{ source.non_music }}</template><template v-if="source.gone"> · 已消失 {{ source.gone }}</template>
      </span>
    </p>
    <section class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.tasks.length" @retry="refresh()">
        <table class="w-full min-w-180 text-left text-sm">
          <thead class="border-b border-slate-100 text-xs text-slate-500">
            <tr>
              <th class="px-4 py-2 font-normal">ID</th>
              <th class="px-4 py-2 font-normal">任务</th>
              <th class="px-4 py-2 font-normal">活动</th>
              <th class="px-4 py-2 font-normal">列出的记录</th>
              <th class="px-4 py-2 font-normal">候选</th>
              <th class="px-4 py-2 font-normal">最近提交</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="task in data?.tasks" :key="task.id" class="align-top">
              <td class="px-4 py-3 font-mono text-xs tabular-nums text-slate-500">#{{ task.id }}</td>
              <td class="px-4 py-3">
                <p class="font-medium">
                  <a v-if="task.url" :href="task.url" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ task.label ?? task.key }}</a>
                  <template v-else>{{ task.label ?? task.key }}</template>
                </p>
                <p class="text-xs text-slate-500">{{ task.source_label }} · {{ task.entry_label }} · <span class="font-mono">{{ task.key }}</span></p>
              </td>
              <td class="px-4 py-3 text-xs">
                {{ harvestEventModeLabels[task.event_mode] }}<template v-if="task.event"> · {{ task.event.name }}</template>
              </td>
              <td class="px-4 py-3 tabular-nums">
                {{ task.records }}
                <span v-if="task.delisted" class="block text-xs text-slate-500">已下架 {{ task.delisted }}</span>
              </td>
              <td class="px-4 py-3 text-xs tabular-nums">
                <NuxtLink :to="{ path: '/admin/harvest/candidates', query: { task_id: String(task.id) } }" class="text-sky-700 hover:underline">待审 {{ task.candidates.pending ?? 0 }}</NuxtLink>
                <span v-if="task.candidates.approved" class="ml-2 text-slate-500">已建档 {{ task.candidates.approved }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-slate-500">
                {{ time(task.last_seen_at) }}
                <span v-if="task.listed_at" class="block">最近列出 {{ time(task.listed_at) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminListState>
    </section>
  </div>
</template>
