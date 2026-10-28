<script setup lang="ts">
import type { HarvestCandidateStatus, HarvestOverview, HarvestTaskRow } from '~/types/harvest'

definePageMeta({ layout: 'admin', middleware: 'admin' })

/**
 * Every harvest task (one entry of one site) with its records and how far review of its candidates
 * has come. A candidate several tasks list counts for each of them; the totals at the top count it once.
 */
const { $api } = useNuxtApp()
const harvestEventModeLabels: Record<string, string> = { none: '不附加活动', fixed: '固定活动', auto: '自动判断' }
const { data, pending, error, refresh } = await useAsyncData('admin-harvest-tasks', () => $api<{ tasks: HarvestTaskRow[] }>('/v1/admin/harvest/tasks'))
const { data: overview } = await useAsyncData('admin-harvest-overview', () => $api<HarvestOverview>('/v1/admin/harvest/overview'), { lazy: true })

const DONE = ['approved', 'linked', 'rejected'] as const
const count = (counts: Partial<Record<HarvestCandidateStatus, number>>, ...statuses: HarvestCandidateStatus[]) => statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0)
const totals = computed(() => {
  const candidates = overview.value?.candidates ?? {}
  return {
    tasks: data.value?.tasks.length ?? 0,
    records: (overview.value?.sources ?? []).reduce((sum, source) => sum + source.records, 0),
    pending: count(candidates, 'pending', 'approving'),
    done: count(candidates, ...DONE),
    excluded: count(candidates, 'excluded'),
  }
})

/** The figures at the top, over all candidates (each counted once). */
const tiles = computed<Array<{ label: string, value: number, tone?: string, to?: string, hint?: string }>>(() => [
  { label: '任务', value: totals.value.tasks },
  { label: '来源记录', value: totals.value.records },
  { label: '待审候选', value: totals.value.pending, tone: 'text-amber-700', to: '/admin/harvest/candidates' },
  { label: '已完成', value: totals.value.done, tone: 'text-emerald-700', hint: '已建档、站内已有、不收录' },
  { label: '非音乐', value: totals.value.excluded, to: '/admin/harvest/candidates?status=excluded' },
])

const rows = computed(() => (data.value?.tasks ?? []).map((task) => {
  const waiting = count(task.candidates, 'pending', 'approving')
  const done = count(task.candidates, ...DONE)
  return { ...task, waiting, done, excluded: count(task.candidates, 'excluded'), progress: waiting + done ? done / (waiting + done) : null }
}))
type Row = typeof rows.value[number]

// ---- filters and order, in the page (every task comes in one response) ----
const source = ref('')
const q = ref('')
const state = ref<'' | 'waiting' | 'finished' | 'empty'>('')
const sortKey = ref<'id' | 'records' | 'merged' | 'waiting' | 'done' | 'progress' | 'last_seen_at'>('id')
const sortDir = ref<'asc' | 'desc'>('asc')
const sortBy = (key: typeof sortKey.value) => {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else [sortKey.value, sortDir.value] = [key, key === 'id' ? 'asc' : 'desc']
}
const value = (row: Row) => sortKey.value === 'last_seen_at' ? (row.last_seen_at ?? '') : sortKey.value === 'progress' ? (row.progress ?? -1) : row[sortKey.value]
const shown = computed(() => {
  const text = q.value.trim().toLowerCase()
  const list = rows.value.filter(row => (!source.value || row.source === source.value)
    && (!text || `${row.label ?? ''} ${row.key} ${row.event?.name ?? ''}`.toLowerCase().includes(text))
    && (state.value === '' || (state.value === 'waiting' ? row.waiting > 0 : state.value === 'finished' ? row.waiting === 0 && row.done > 0 : row.waiting + row.done === 0)))
  return list.sort((a, b) => {
    const [x, y] = [value(a), value(b)]
    const order = x < y ? -1 : x > y ? 1 : a.id - b.id
    return sortDir.value === 'asc' ? order : -order
  })
})
const columns: Array<{ key?: typeof sortKey.value, label: string, right?: boolean, hint?: string }> = [
  { key: 'id', label: 'ID' }, { label: '任务' }, { label: '活动' }, { key: 'records', label: '记录', right: true },
  { key: 'merged', label: '合并', right: true, hint: '和本任务的其他记录合成了同一条候选的记录数（同一张专辑的不同商品，比如 CD 版、DL 版、套装）。记录 = 候选 + 合并 + 未合并' },
  { key: 'waiting', label: '待审', right: true }, { key: 'done', label: '已完成', right: true }, { label: '非音乐', right: true },
  { key: 'progress', label: '进度' }, { key: 'last_seen_at', label: '最近提交' },
]
const filtered = computed(() => Boolean(source.value || q.value || state.value))
const clear = () => { [source.value, q.value, state.value] = ['', '', ''] }

const candidatesOf = (task: Row, status?: string) => ({ path: '/admin/harvest/candidates', query: { task_id: String(task.id), status } })
const percent = (progress: number | null) => progress === null ? '—' : `${Math.floor(progress * 100)}%`
const time = (at: string | null) => at ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(at)) : '—'
const select = 'rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus:border-slate-500 focus:outline-none'
useHead({ title: '任务' })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div class="px-5 pb-4 pt-4">
        <h1 class="text-2xl font-bold">任务</h1>
        <p class="mt-1 max-w-3xl text-sm text-slate-500">采集器的任务是一个站点的一个入口，例如 Bangumi 的一个目录、BOOTH 的一个店铺、一届活动的活动页，由数据包带来，在采集器里新建和运行。一条候选被几个任务列到时，在每个任务里都算一次。</p>
        <p v-if="overview?.sources.length" class="mt-3 flex flex-wrap gap-2 text-xs">
          <span v-for="item in overview.sources" :key="item.source" class="rounded-full bg-slate-100 px-2 py-1 tabular-nums">
            {{ item.label }} {{ item.records }} 条<template v-if="item.non_music"> · 非音乐 {{ item.non_music }}</template><template v-if="item.gone"> · 已消失 {{ item.gone }}</template>
          </span>
        </p>
      </div>
      <dl class="grid grid-cols-2 border-t border-slate-100 sm:grid-cols-5">
        <div v-for="item in tiles" :key="item.label" class="border-b border-r border-slate-100 px-5 py-3 last:border-r-0 sm:border-b-0">
          <dt class="text-xs text-slate-500" :title="item.hint">{{ item.label }}</dt>
          <dd class="mt-0.5 text-2xl font-semibold tabular-nums" :class="item.tone">
            <NuxtLink v-if="item.to" :to="item.to" class="hover:underline">{{ item.value }}</NuxtLink>
            <template v-else>{{ item.value }}</template>
          </dd>
        </div>
      </dl>
      <div class="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-sm">
        <label class="relative">
          <Icon name="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input v-model="q" type="search" placeholder="任务名、key 或活动" aria-label="搜索任务" :class="select" class="w-56 pl-8">
        </label>
        <select v-model="source" aria-label="来源" :class="select">
          <option value="">所有来源</option>
          <option v-for="item in overview?.sources ?? []" :key="item.source" :value="item.source">{{ item.label }}</option>
        </select>
        <select v-model="state" aria-label="进度" :class="select">
          <option value="">全部进度</option>
          <option value="waiting">还有待审</option>
          <option value="finished">都审完了</option>
          <option value="empty">没有候选</option>
        </select>
        <span class="text-xs text-slate-500">{{ shown.length }} 个任务</span>
        <UiButton v-if="filtered" size="xs" icon="lucide:x" class="ml-auto" @click="clear">清除筛选</UiButton>
      </div>
    </section>

    <section class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <AdminListState :pending="pending" :error="error" :empty="!shown.length" @retry="refresh()">
        <table class="w-full min-w-240 text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th v-for="column in columns" :key="column.label" class="whitespace-nowrap px-4 py-2.5 font-medium" :class="column.right && 'text-right'">
                <button v-if="column.key" type="button" class="group inline-flex items-center gap-1 hover:text-slate-900" :class="sortKey === column.key && 'text-slate-900'" :title="column.hint" @click="sortBy(column.key)">
                  {{ column.label }}
                  <Icon v-if="sortKey === column.key" :name="sortDir === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'" class="size-3.5" />
                  <Icon v-else name="lucide:chevrons-up-down" class="size-3.5 text-slate-300 group-hover:text-slate-500" />
                </button>
                <template v-else>{{ column.label }}</template>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="task in shown" :key="task.id" class="align-top even:bg-slate-50/70 hover:bg-sky-50/60">
              <td class="whitespace-nowrap px-4 py-3 font-mono text-xs leading-5 tabular-nums text-slate-500">#{{ task.id }}</td>
              <td class="min-w-64 px-4 py-3">
                <a v-if="task.url" :href="task.url" target="_blank" rel="noopener noreferrer" class="font-medium leading-snug hover:underline">{{ task.label ?? task.key }}</a>
                <p v-else class="font-medium leading-snug">{{ task.label ?? task.key }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ task.source_label }} · {{ task.entry_label }} · <span class="font-mono">{{ task.key }}</span></p>
              </td>
              <td class="min-w-36 px-4 py-3 text-xs leading-5">
                <span class="text-slate-500">{{ harvestEventModeLabels[task.event_mode] }}</span>
                <span v-if="task.event" class="block text-slate-700">{{ task.event.name }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {{ task.records }}
                <span v-if="task.delisted" class="block text-xs text-slate-500">已下架 {{ task.delisted }}</span>
                <span v-if="task.unplaced" class="block text-xs text-amber-700" title="还没合并进候选的记录，下一次合并（每分钟）后会进候选">未合并 {{ task.unplaced }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums" :title="task.merged ? `${task.merged} 条记录和本任务的其他记录合成了同一条候选` : undefined">
                <span :class="task.merged ? 'text-slate-700' : 'text-slate-300'">{{ task.merged }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                <NuxtLink v-if="task.waiting" :to="candidatesOf(task)" class="font-medium text-amber-700 hover:underline">{{ task.waiting }}</NuxtLink>
                <span v-else class="text-slate-300">0</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                <span :class="task.done ? 'text-emerald-700' : 'text-slate-300'">{{ task.done }}</span>
                <span v-if="task.done" class="mt-0.5 flex justify-end gap-1.5 text-xs text-slate-500">
                  <NuxtLink v-if="task.candidates.approved" :to="candidatesOf(task, 'approved')" class="hover:underline">建档 {{ task.candidates.approved }}</NuxtLink>
                  <NuxtLink v-if="task.candidates.linked" :to="candidatesOf(task, 'linked')" class="hover:underline">已有 {{ task.candidates.linked }}</NuxtLink>
                  <NuxtLink v-if="task.candidates.rejected" :to="candidatesOf(task, 'rejected')" class="hover:underline">不收录 {{ task.candidates.rejected }}</NuxtLink>
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                <NuxtLink v-if="task.excluded" :to="candidatesOf(task, 'excluded')" class="text-slate-600 hover:underline">{{ task.excluded }}</NuxtLink>
                <span v-else class="text-slate-300">0</span>
              </td>
              <td class="min-w-36 px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full rounded-full" :class="task.progress === 1 ? 'bg-emerald-500' : 'bg-sky-500'" :style="{ width: `${(task.progress ?? 0) * 100}%` }" />
                  </div>
                  <span class="w-9 text-right text-xs tabular-nums text-slate-500">{{ percent(task.progress) }}</span>
                </div>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-xs leading-5 text-slate-500">
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
