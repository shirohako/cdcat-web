<script setup lang="ts">
import type { HarvestCandidateRow, HarvestOverview, HarvestPagination, HarvestTaskRow } from '~/types/harvest'
import { HARVEST_FILTER_KEYS, harvestFilters, type HarvestFilterKey } from '~/utils/harvestFilters'

/** The review queue: every candidate, whatever its events, with the filters in the page's query. */
const props = defineProps<{ sources: HarvestOverview['sources'] }>()
const { $api } = useNuxtApp()
const harvestCandidateAdultLabels: Record<string, string> = { label: '成人', '1': '只看成人', '0': '不含成人' }
const harvestCandidateCircleLabels: Record<string, string> = { label: '社团', matched: '已关联社团', unmatched: '未关联社团' }
const harvestCandidateCompleteLabels: Record<string, string> = { label: '完整度', complete: '资料齐全', incomplete: '资料不全', no_cover: '缺封面', no_tracks: '缺曲目' }
const harvestCandidateDuplicatesLabels: Record<string, string> = { label: '站内重复', strong: '站内已有（强匹配）', any: '可能重复', none: '站内没有' }
const harvestCandidateSortLabels: Record<string, string> = { circle: '按社团', id: '按 ID', title: '按标题', release: '按发售日期', sources: '按来源数', updated: '按更新时间' }
const route = useRoute()
const router = useRouter()

const statuses = ['pending', 'excluded', 'approved', 'linked', 'rejected', 'all'] as const
const filters = computed(() => harvestFilters(route.query))
const page = computed(() => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1))
/** Changes one filter (back to the first page); the event match only means something with an event. */
const setFilter = (key: HarvestFilterKey, value: string) => {
  const next: Record<string, string | undefined> = { ...route.query as Record<string, string>, [key]: value || undefined, page: undefined }
  if (key === 'event_id' && (!value || value === 'none')) next.event_match = undefined
  void router.push({ query: next })
}
const filter = (key: HarvestFilterKey) => computed({ get: () => filters.value[key] ?? '', set: value => setFilter(key, value) })
const status = filter('status')
const eventId = filter('event_id')
const eventMatch = filter('event_match')
const taskId = filter('task_id')
const source = filter('source')
const complete = filter('complete')
const duplicates = filter('duplicates')
const circle = filter('circle')
const adult = filter('adult')
/** Each order and the way it goes first, as CandidateQuery::SORTS; a second click on a column flips it. */
const sortDirections: Record<string, 'asc' | 'desc'> = { circle: 'asc', id: 'desc', title: 'asc', release: 'desc', sources: 'desc', updated: 'desc' }
const sortKey = computed(() => filters.value.sort ?? 'circle')
const sortDir = computed(() => filters.value.dir ?? sortDirections[sortKey.value])
const setSort = (key: string, dir?: 'asc' | 'desc') => router.push({ query: { ...route.query, sort: key && key !== 'circle' ? key : undefined, dir, page: undefined } })
const sort = computed({ get: () => filters.value.sort ?? '', set: value => void setSort(value) })
const sortBy = (key: string) => setSort(key, sortKey.value === key && sortDir.value === sortDirections[key] ? (sortDirections[key] === 'asc' ? 'desc' : 'asc') : undefined)
const ariaSort = (key: string) => sortKey.value !== key ? 'none' : sortDir.value === 'asc' ? 'ascending' : 'descending'
const columns: { label: string, sort?: string, hint?: string, right?: boolean }[] = [
  { label: 'ID', sort: 'id' },
  { label: '标题', sort: 'title' },
  { label: '社团', sort: 'circle' },
  { label: '活动 · 发售日期', sort: 'release', hint: '按发售日期排序' },
  { label: '来源', sort: 'sources', hint: '按来源数排序' },
  { label: '曲目', right: true },
  { label: '标记' },
]
const q = filter('q')
const setPage = (value: number) => router.push({ query: { ...route.query, page: value > 1 ? String(value) : undefined } })
const clear = () => router.push({ query: {} })
const filtered = computed(() => HARVEST_FILTER_KEYS.some(key => key !== 'sort' && key !== 'dir' && filters.value[key]))

const query = computed(() => ({ ...filters.value, page: page.value }))
const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-harvest-candidates-${JSON.stringify(query.value)}`,
  () => $api<{ candidates: HarvestCandidateRow[], pagination: HarvestPagination }>('/v1/admin/harvest/candidates', { query: query.value }),
  { watch: [query] },
)
const { data: tasks } = await useAsyncData('admin-harvest-task-options', () => $api<{ tasks: HarvestTaskRow[] }>('/v1/admin/harvest/tasks'), { lazy: true })

const label = (key: string) => props.sources.find(item => item.source === key)?.label ?? key
const taskLabel = (task: HarvestTaskRow) => `#${task.id} ${task.source_label} · ${task.entry_label} · ${task.label ?? task.key}`
/** The review page keeps the list's filters, so previous / next stay in it. */
const reviewLink = (id: number) => ({ path: `/admin/harvest/candidates/${id}`, query: filters.value })
const select = 'rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus:border-slate-500 focus:outline-none'
</script>

<template>
  <div class="space-y-4">
    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div class="flex flex-wrap items-end justify-between gap-3 px-5 pb-3 pt-4">
        <div class="min-w-0">
          <slot />
        </div>
        <p class="shrink-0 text-sm text-slate-500"><span class="text-2xl font-semibold tabular-nums text-slate-900">{{ data?.pagination.total ?? 0 }}</span> 条</p>
      </div>
      <nav class="flex gap-1 overflow-x-auto border-b border-slate-200 px-3" aria-label="状态">
        <button
          v-for="item in statuses" :key="item" type="button" class="-mb-px shrink-0 border-b-2 px-3 py-2 text-sm transition-colors"
          :class="(status || 'pending') === item ? 'border-slate-900 font-medium text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'"
          @click="status = item === 'pending' ? '' : item"
        >
          {{ harvestStatusLabels[item] }}
        </button>
      </nav>
      <div class="space-y-2.5 bg-slate-50/70 px-5 py-3.5 text-sm">
        <div class="flex flex-wrap items-center gap-2">
          <span class="w-8 shrink-0 text-xs text-slate-500">范围</span>
          <AdminHarvestEventSelect v-model="eventId" allow-none search />
          <select v-if="eventId && eventId !== 'none'" v-model="eventMatch" aria-label="活动的关联方式" :class="select">
            <option value="">关联到这届的</option>
            <option value="suggested">建议首发是这届的</option>
          </select>
          <select v-model="taskId" aria-label="任务" :class="select" class="max-w-72">
            <option value="">所有任务</option>
            <option v-for="task in tasks?.tasks ?? []" :key="task.id" :value="String(task.id)">{{ taskLabel(task) }}</option>
          </select>
          <select v-model="source" aria-label="来源" :class="select">
            <option value="">所有来源</option>
            <option v-for="item in sources" :key="item.source" :value="item.source">{{ item.label }}</option>
          </select>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="w-8 shrink-0 text-xs text-slate-500">条件</span>
          <label class="relative">
            <Icon name="lucide:search" class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input v-model.lazy="q" type="search" placeholder="标题或社团" aria-label="标题或社团" :class="select" class="w-56 pl-8">
          </label>
          <select v-model="complete" aria-label="完整度" :class="select">
            <option v-for="value in ['', 'complete', 'incomplete', 'no_cover', 'no_tracks']" :key="value" :value="value">{{ harvestCandidateCompleteLabels[value || 'label'] }}</option>
          </select>
          <select v-model="duplicates" aria-label="站内重复" :class="select">
            <option v-for="value in ['', 'strong', 'any', 'none']" :key="value" :value="value">{{ harvestCandidateDuplicatesLabels[value || 'label'] }}</option>
          </select>
          <select v-model="circle" aria-label="社团" :class="select">
            <option v-for="value in ['', 'matched', 'unmatched']" :key="value" :value="value">{{ harvestCandidateCircleLabels[value || 'label'] }}</option>
          </select>
          <select v-model="adult" aria-label="成人" :class="select">
            <option v-for="value in ['', '1', '0']" :key="value" :value="value">{{ harvestCandidateAdultLabels[value || 'label'] }}</option>
          </select>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="w-8 shrink-0 text-xs text-slate-500">排序</span>
          <select v-model="sort" aria-label="排序" :class="select">
            <option v-for="value in ['', 'id', 'title', 'release', 'sources', 'updated']" :key="value" :value="value">{{ harvestCandidateSortLabels[value || 'circle'] }}</option>
          </select>
          <span class="text-xs text-slate-400">也可以点表格的表头排序</span>
          <button v-if="filtered" type="button" class="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-200/60" @click="clear">
            <Icon name="lucide:x" class="size-3.5" />清除筛选
          </button>
        </div>
      </div>
    </section>

    <section class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <AdminListState :pending="pending" :error="error" :empty="!data?.candidates.length" @retry="refresh()">
        <table class="w-full min-w-240 text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th v-for="column in columns" :key="column.label" class="whitespace-nowrap px-4 py-2.5 font-medium" :class="column.right && 'text-right'" :aria-sort="column.sort ? ariaSort(column.sort) : undefined">
                <button v-if="column.sort" type="button" class="group inline-flex items-center gap-1 hover:text-slate-900" :class="sortKey === column.sort && 'text-slate-900'" :title="column.hint" @click="sortBy(column.sort)">
                  {{ column.label }}
                  <Icon v-if="sortKey === column.sort" :name="sortDir === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'" class="size-3.5" />
                  <Icon v-else name="lucide:chevrons-up-down" class="size-3.5 text-slate-300 group-hover:text-slate-500" />
                </button>
                <template v-else>{{ column.label }}</template>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="candidate in data?.candidates" :key="candidate.id" class="align-top even:bg-slate-50/70 hover:bg-sky-50/60">
              <td class="whitespace-nowrap px-4 py-3 font-mono text-xs leading-5 tabular-nums text-slate-500">#{{ candidate.id }}</td>
              <td class="min-w-64 space-y-1 px-4 py-3">
                <NuxtLink :to="reviewLink(candidate.id)" class="block font-medium leading-snug hover:underline">{{ candidate.title }}</NuxtLink>
                <p v-if="candidate.catalog_numbers.length" class="font-mono text-xs text-slate-500">{{ candidate.catalog_numbers.join(' / ') }}</p>
                <p v-if="candidate.reject_reason" class="text-xs leading-5 text-slate-500">{{ candidate.reject_reason }}</p>
                <p v-if="candidate.error" class="text-xs leading-5 text-red-700">{{ candidate.error }}</p>
              </td>
              <td class="min-w-36 max-w-56 px-4 py-3 text-xs leading-5" :class="candidate.artist_id ? 'text-slate-700' : 'text-amber-700'">
                <NuxtLink v-if="candidate.artist_id" :to="`/artists/${candidate.artist_id}`" target="_blank" class="hover:underline">{{ candidate.circle_name ?? '未知社团' }}</NuxtLink>
                <template v-else>{{ candidate.circle_name ?? '未知社团' }}</template>
              </td>
              <td class="min-w-44 px-4 py-3 text-xs leading-5">
                <span :class="candidate.event ? 'text-slate-700' : 'text-slate-400'">{{ candidate.event?.name ?? '未关联活动' }}</span>
                <span v-if="candidate.release_date" class="mt-0.5 block tabular-nums text-slate-500">{{ candidate.release_date }}</span>
              </td>
              <td class="min-w-28 px-4 py-3">
                <div class="flex flex-wrap gap-1.5 text-xs">
                  <span v-for="item in candidate.sources" :key="item" class="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{{ label(item) }}</span>
                </div>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right text-xs leading-5 tabular-nums">
                <template v-if="candidate.has_tracks">{{ candidate.tracks }}</template>
                <span v-else class="text-amber-700">缺曲目</span>
              </td>
              <td class="min-w-40 px-4 py-3">
                <div class="flex max-w-64 flex-wrap gap-1.5 text-xs">
                  <span v-if="status === 'all'" class="whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-white">{{ harvestStatusLabels[candidate.status] }}</span>
                  <span v-if="!candidate.has_cover" class="whitespace-nowrap rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">缺封面</span>
                  <span v-if="candidate.strong_duplicate" class="whitespace-nowrap rounded bg-red-50 px-1.5 py-0.5 text-red-700">站内已有</span>
                  <span v-else-if="candidate.duplicates" class="whitespace-nowrap rounded bg-orange-50 px-1.5 py-0.5 text-orange-800">可能重复</span>
                  <span v-if="candidate.delisted" class="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">已下架</span>
                  <span v-if="candidate.sources_changed_at" class="whitespace-nowrap rounded bg-sky-50 px-1.5 py-0.5 text-sky-800">来源有更新</span>
                  <span v-if="candidate.is_adult" class="whitespace-nowrap rounded bg-pink-50 px-1.5 py-0.5 text-pink-800">成人</span>
                  <a v-if="candidate.official_url" :href="candidate.official_url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-0.5 whitespace-nowrap rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800 hover:bg-emerald-100" :title="`打开专辑官网：${candidate.official_url}`">有官网<Icon name="lucide:external-link" class="size-3" /></a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminListState>
    </section>
    <CommonPagination v-if="(data?.pagination.last_page ?? 1) > 1" :page="page" :total-pages="data!.pagination.last_page" @update:page="setPage" />
  </div>
</template>
