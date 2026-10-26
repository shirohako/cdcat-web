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
const harvestCandidateSortLabels: Record<string, string> = { circle: '按社团', title: '按标题', updated: '最近更新', sources: '来源多的在前', created: '最新加入' }
const harvestReleaseKindLabels: Record<string, string> = { first: '首发', resale: '再贩', unknown: '未知' }
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
const releaseKind = filter('release_kind')
const duplicates = filter('duplicates')
const circle = filter('circle')
const adult = filter('adult')
const sort = filter('sort')
const q = filter('q')
const setPage = (value: number) => router.push({ query: { ...route.query, page: value > 1 ? String(value) : undefined } })
const clear = () => router.push({ query: {} })
const filtered = computed(() => HARVEST_FILTER_KEYS.some(key => key !== 'sort' && filters.value[key]))

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
const select = 'rounded-lg border border-slate-300 px-2 py-1.5'
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-1 text-sm">
      <button v-for="item in statuses" :key="item" type="button" class="rounded-full px-3 py-1" :class="(status || 'pending') === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'" @click="status = item === 'pending' ? '' : item">
        {{ harvestStatusLabels[item] }}
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-2 text-sm">
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
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <input v-model.lazy="q" type="search" placeholder="标题或社团" :class="select" class="w-56">
      <select v-model="complete" :class="select">
        <option v-for="value in ['', 'complete', 'incomplete', 'no_cover', 'no_tracks']" :key="value" :value="value">{{ harvestCandidateCompleteLabels[value || 'label'] }}</option>
      </select>
      <select v-model="releaseKind" :class="select">
        <option value="">首发/再贩</option>
        <option v-for="kind in ['first', 'resale', 'unknown']" :key="kind" :value="kind">{{ harvestReleaseKindLabels[kind] }}</option>
      </select>
      <select v-model="duplicates" :class="select">
        <option v-for="value in ['', 'strong', 'any', 'none']" :key="value" :value="value">{{ harvestCandidateDuplicatesLabels[value || 'label'] }}</option>
      </select>
      <select v-model="circle" :class="select">
        <option v-for="value in ['', 'matched', 'unmatched']" :key="value" :value="value">{{ harvestCandidateCircleLabels[value || 'label'] }}</option>
      </select>
      <select v-model="adult" :class="select">
        <option v-for="value in ['', '1', '0']" :key="value" :value="value">{{ harvestCandidateAdultLabels[value || 'label'] }}</option>
      </select>
      <select v-model="sort" :class="select">
        <option v-for="value in ['', 'title', 'updated', 'sources', 'created']" :key="value" :value="value">{{ harvestCandidateSortLabels[value || 'circle'] }}</option>
      </select>
      <span class="text-slate-500">{{ data?.pagination.total ?? 0 }}</span>
      <button v-if="filtered" type="button" class="text-xs underline" @click="clear">清除筛选</button>
    </div>

    <section class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.candidates.length" @retry="refresh()">
        <table class="w-full min-w-240 text-left text-sm">
          <thead class="border-b border-slate-100 text-xs text-slate-500">
            <tr>
              <th class="px-4 py-2 font-normal">ID</th>
              <th class="px-4 py-2 font-normal">标题</th>
              <th class="px-4 py-2 font-normal">社团</th>
              <th class="px-4 py-2 font-normal">活动 · 发售日期</th>
              <th class="px-4 py-2 font-normal">来源</th>
              <th class="px-4 py-2 text-right font-normal">曲目</th>
              <th class="px-4 py-2 font-normal">标记</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="candidate in data?.candidates" :key="candidate.id" class="align-top">
              <td class="px-4 py-3 font-mono text-xs tabular-nums text-slate-500">#{{ candidate.id }}</td>
              <td class="min-w-56 px-4 py-3">
                <NuxtLink :to="reviewLink(candidate.id)" class="font-medium hover:underline">{{ candidate.title }}</NuxtLink>
                <p v-if="candidate.catalog_numbers.length" class="font-mono text-xs text-slate-500">{{ candidate.catalog_numbers.join(' / ') }}</p>
                <p v-if="candidate.reject_reason" class="text-xs text-slate-500">{{ candidate.reject_reason }}</p>
                <p v-if="candidate.error" class="text-xs text-red-700">{{ candidate.error }}</p>
              </td>
              <td class="px-4 py-3 text-xs" :class="candidate.artist_id ? 'text-slate-700' : 'text-amber-700'">{{ candidate.circle_name ?? '未知社团' }}</td>
              <td class="px-4 py-3 text-xs text-slate-600">
                {{ candidate.event?.name ?? '未关联活动' }}
                <span v-if="candidate.release_date" class="block tabular-nums text-slate-500">{{ candidate.release_date }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1 text-xs">
                  <span v-for="item in candidate.sources" :key="item" class="rounded bg-slate-100 px-1.5 py-0.5">{{ label(item) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right text-xs tabular-nums">
                <template v-if="candidate.has_tracks">{{ candidate.tracks }}</template>
                <span v-else class="text-amber-700">缺曲目</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex max-w-64 flex-wrap gap-1 text-xs">
                  <span v-if="status === 'all'" class="rounded bg-slate-900 px-1.5 py-0.5 text-white">{{ harvestStatusLabels[candidate.status] }}</span>
                  <span v-if="candidate.release_kind !== 'first'" class="rounded px-1.5 py-0.5" :class="candidate.release_kind === 'resale' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-500'">{{ harvestReleaseKindLabels[candidate.release_kind] }}</span>
                  <span v-if="!candidate.has_cover" class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">缺封面</span>
                  <span v-if="candidate.strong_duplicate" class="rounded bg-red-50 px-1.5 py-0.5 text-red-700">站内已有</span>
                  <span v-else-if="candidate.duplicates" class="rounded bg-orange-50 px-1.5 py-0.5 text-orange-800">可能重复</span>
                  <span v-if="candidate.delisted" class="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">已下架</span>
                  <span v-if="candidate.sources_changed_at" class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-800">来源有更新</span>
                  <span v-if="candidate.is_adult" class="rounded bg-pink-50 px-1.5 py-0.5 text-pink-800">成人</span>
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
