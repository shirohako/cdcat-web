<script setup lang="ts">
import type { HarvestCandidateRow, HarvestOverview, HarvestPagination, HarvestTaskRow } from '~/types/harvest'
import { HARVEST_FILTER_KEYS, harvestFilters, type HarvestFilterKey } from '~/utils/harvestFilters'

/** The review queue: every candidate, whatever its events, with the filters in the page's query. */
const props = defineProps<{ sources: HarvestOverview['sources'] }>()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
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
const clear = () => router.push({ query: { tab: route.query.tab } })
const filtered = computed(() => HARVEST_FILTER_KEYS.some(key => key !== 'sort' && filters.value[key]))

const query = computed(() => ({ ...filters.value, page: page.value }))
const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-harvest-candidates-${JSON.stringify(query.value)}`,
  () => $api<{ candidates: HarvestCandidateRow[], pagination: HarvestPagination }>('/v1/admin/harvest/candidates', { query: query.value }),
  { watch: [query] },
)
const { data: tasks } = await useAsyncData('admin-harvest-task-options', () => $api<{ tasks: HarvestTaskRow[] }>('/v1/admin/harvest/tasks'), { lazy: true })

const label = (key: string) => props.sources.find(item => item.source === key)?.label ?? key
const taskLabel = (task: HarvestTaskRow) => `${task.source_label} · ${task.entry_label} · ${task.label ?? task.key}`
/** The review page keeps the list's filters, so previous / next stay in it. */
const reviewLink = (id: number) => ({ path: `/admin/harvest/review/${id}`, query: filters.value })
const select = 'rounded-lg border border-slate-300 px-2 py-1.5'
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-1 text-sm">
      <button v-for="item in statuses" :key="item" type="button" class="rounded-full px-3 py-1" :class="(status || 'pending') === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'" @click="status = item === 'pending' ? '' : item">
        {{ t(`admin_pages.harvest.status.${item}`) }}
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <AdminHarvestEventSelect v-model="eventId" allow-none search />
      <select v-if="eventId && eventId !== 'none'" v-model="eventMatch" :aria-label="t('admin_pages.harvest.candidates.event_match.label')" :class="select">
        <option value="">{{ t('admin_pages.harvest.candidates.event_match.any') }}</option>
        <option value="suggested">{{ t('admin_pages.harvest.candidates.event_match.suggested') }}</option>
      </select>
      <select v-model="taskId" :aria-label="t('admin_pages.harvest.candidates.task')" :class="select" class="max-w-72">
        <option value="">{{ t('admin_pages.harvest.candidates.any_task') }}</option>
        <option v-for="task in tasks?.tasks ?? []" :key="task.id" :value="String(task.id)">{{ taskLabel(task) }}</option>
      </select>
      <select v-model="source" :aria-label="t('admin_pages.harvest.candidates.source')" :class="select">
        <option value="">{{ t('admin_pages.harvest.candidates.any_source') }}</option>
        <option v-for="item in sources" :key="item.source" :value="item.source">{{ item.label }}</option>
      </select>
    </div>
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <input v-model.lazy="q" type="search" :placeholder="t('admin_pages.harvest.candidates.search')" :class="select" class="w-56">
      <select v-model="complete" :class="select">
        <option v-for="value in ['', 'complete', 'incomplete', 'no_cover', 'no_tracks']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.complete.${value}`) }}</option>
      </select>
      <select v-model="releaseKind" :class="select">
        <option value="">{{ t('admin_pages.harvest.candidates.release_kind') }}</option>
        <option v-for="kind in ['first', 'resale', 'unknown']" :key="kind" :value="kind">{{ t(`admin_pages.harvest.release_kind.${kind}`) }}</option>
      </select>
      <select v-model="duplicates" :class="select">
        <option v-for="value in ['', 'strong', 'any', 'none']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.duplicates.${value}`) }}</option>
      </select>
      <select v-model="circle" :class="select">
        <option v-for="value in ['', 'matched', 'unmatched']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.circle.${value}`) }}</option>
      </select>
      <select v-model="adult" :class="select">
        <option v-for="value in ['', '1', '0']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.adult.${value}`) }}</option>
      </select>
      <select v-model="sort" :class="select">
        <option v-for="value in ['', 'title', 'updated', 'sources', 'created']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.sort.${value || 'circle'}`) }}</option>
      </select>
      <span class="text-slate-500">{{ data?.pagination.total ?? 0 }}</span>
      <button v-if="filtered" type="button" class="text-xs underline" @click="clear">{{ t('admin_pages.harvest.candidates.clear') }}</button>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.candidates.length" @retry="refresh()">
        <ul class="divide-y divide-slate-100">
          <li v-for="candidate in data?.candidates" :key="candidate.id" class="flex flex-wrap items-start gap-3 px-4 py-3 text-sm">
            <div class="min-w-64 flex-1">
              <NuxtLink :to="reviewLink(candidate.id)" class="font-medium hover:underline">{{ candidate.title }}</NuxtLink>
              <p class="text-xs text-slate-600">
                <span :class="{ 'text-amber-700': !candidate.artist_id }">{{ candidate.circle_name ?? t('admin_pages.harvest.candidates.unknown_circle') }}</span>
                <span v-if="candidate.catalog_numbers.length" class="ml-2 font-mono">{{ candidate.catalog_numbers.join(' / ') }}</span>
              </p>
              <p class="text-xs text-slate-500">
                {{ candidate.event?.name ?? t('admin_pages.harvest.no_event') }}<template v-if="candidate.release_date"> · {{ candidate.release_date }}</template>
              </p>
              <p v-if="candidate.reject_reason" class="text-xs text-slate-500">{{ candidate.reject_reason }}</p>
              <p v-if="candidate.error" class="text-xs text-red-700">{{ candidate.error }}</p>
            </div>
            <div class="flex max-w-md flex-wrap justify-end gap-1 text-xs">
              <span v-if="status === 'all'" class="rounded bg-slate-900 px-1.5 py-0.5 text-white">{{ t(`admin_pages.harvest.status.${candidate.status}`) }}</span>
              <span v-for="item in candidate.sources" :key="item" class="rounded bg-slate-100 px-1.5 py-0.5">{{ label(item) }}</span>
              <span v-if="candidate.release_kind !== 'first'" class="rounded px-1.5 py-0.5" :class="candidate.release_kind === 'resale' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-500'">{{ t(`admin_pages.harvest.release_kind.${candidate.release_kind}`) }}</span>
              <span v-if="candidate.has_tracks" class="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">{{ t('admin_pages.harvest.candidates.tracks', { count: candidate.tracks }) }}</span>
              <span v-else class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">{{ t('admin_pages.harvest.candidates.no_tracks') }}</span>
              <span v-if="!candidate.has_cover" class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">{{ t('admin_pages.harvest.candidates.no_cover') }}</span>
              <span v-if="candidate.strong_duplicate" class="rounded bg-red-50 px-1.5 py-0.5 text-red-700">{{ t('admin_pages.harvest.candidates.duplicate') }}</span>
              <span v-else-if="candidate.duplicates" class="rounded bg-orange-50 px-1.5 py-0.5 text-orange-800">{{ t('admin_pages.harvest.candidates.maybe_duplicate') }}</span>
              <span v-if="candidate.delisted" class="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">{{ t('admin_pages.harvest.candidates.delisted') }}</span>
              <span v-if="candidate.sources_changed_at" class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-800">{{ t('admin_pages.harvest.candidates.changed') }}</span>
              <span v-if="candidate.is_adult" class="rounded bg-pink-50 px-1.5 py-0.5 text-pink-800">{{ t('admin_pages.harvest.candidates.adult_badge') }}</span>
            </div>
          </li>
        </ul>
      </AdminListState>
    </section>
    <CommonPagination v-if="(data?.pagination.last_page ?? 1) > 1" :page="page" :total-pages="data!.pagination.last_page" @update:page="setPage" />
  </div>
</template>
