<script setup lang="ts">
import type { HarvestCandidateRow, HarvestEventSource, HarvestPagination } from '~/types/harvest'

const props = defineProps<{ eventId: number, sources: HarvestEventSource[] }>()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()

const statuses = ['pending', 'excluded', 'approved', 'linked', 'rejected', 'all'] as const
const filters = reactive({ status: 'pending', complete: '', source: '', release_kind: '', duplicates: '', circle: '', adult: '', q: '', sort: 'circle' })
const page = ref(1)
watch(() => ({ ...filters }), () => { page.value = 1 })
const query = computed(() => Object.fromEntries(Object.entries({ ...filters, page: page.value }).filter(([, value]) => value !== '' && value !== null)))
const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-harvest-candidates-${props.eventId}-${JSON.stringify(query.value)}`,
  () => $api<{ candidates: HarvestCandidateRow[], pagination: HarvestPagination }>(`/v1/admin/harvest/events/${props.eventId}/candidates`, { query: query.value }),
  { watch: [query] },
)
const label = (key: string) => props.sources.find(source => source.source === key)?.label ?? key
const select = 'rounded-lg border border-slate-300 px-2 py-1.5'
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-1 text-sm">
      <button v-for="status in statuses" :key="status" type="button" class="rounded-full px-3 py-1" :class="filters.status === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'" @click="filters.status = status">
        {{ t(`admin_pages.harvest.status.${status}`) }}
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <input v-model.lazy="filters.q" type="search" :placeholder="t('admin_pages.harvest.candidates.search')" :class="select" class="w-56">
      <select v-model="filters.complete" :class="select">
        <option v-for="value in ['', 'complete', 'incomplete', 'no_cover', 'no_tracks']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.complete.${value}`) }}</option>
      </select>
      <select v-model="filters.source" :class="select">
        <option value="">{{ t('admin_pages.harvest.candidates.any_source') }}</option>
        <option v-for="source in sources" :key="source.source" :value="source.source">{{ source.label }}</option>
      </select>
      <select v-model="filters.release_kind" :class="select">
        <option value="">{{ t('admin_pages.harvest.candidates.release_kind') }}</option>
        <option v-for="kind in ['first', 'resale', 'unknown']" :key="kind" :value="kind">{{ t(`admin_pages.harvest.release_kind.${kind}`) }}</option>
      </select>
      <select v-model="filters.duplicates" :class="select">
        <option v-for="value in ['', 'strong', 'any']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.duplicates.${value}`) }}</option>
      </select>
      <select v-model="filters.circle" :class="select">
        <option v-for="value in ['', 'matched', 'unmatched']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.circle.${value}`) }}</option>
      </select>
      <select v-model="filters.sort" :class="select">
        <option v-for="value in ['circle', 'title', 'updated', 'sources']" :key="value" :value="value">{{ t(`admin_pages.harvest.candidates.sort.${value}`) }}</option>
      </select>
      <span class="text-slate-500">{{ data?.pagination.total ?? 0 }}</span>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!data?.candidates.length" @retry="refresh()">
        <ul class="divide-y divide-slate-100">
          <li v-for="candidate in data?.candidates" :key="candidate.id" class="flex flex-wrap items-start gap-3 px-4 py-3 text-sm">
            <div class="min-w-64 flex-1">
              <NuxtLink :to="`/admin/harvest/review/${candidate.id}`" class="font-medium hover:underline">{{ candidate.title }}</NuxtLink>
              <p class="text-xs text-slate-600">
                <span :class="{ 'text-amber-700': !candidate.artist_id }">{{ candidate.circle_name ?? t('admin_pages.harvest.candidates.unknown_circle') }}</span>
                <span v-if="candidate.catalog_numbers.length" class="ml-2 font-mono">{{ candidate.catalog_numbers.join(' / ') }}</span>
              </p>
              <p v-if="candidate.reject_reason" class="text-xs text-slate-500">{{ candidate.reject_reason }}</p>
              <p v-if="candidate.error" class="text-xs text-red-700">{{ candidate.error }}</p>
            </div>
            <div class="flex max-w-md flex-wrap justify-end gap-1 text-xs">
              <span v-if="filters.status === 'all'" class="rounded bg-slate-900 px-1.5 py-0.5 text-white">{{ t(`admin_pages.harvest.status.${candidate.status}`) }}</span>
              <span v-for="source in candidate.sources" :key="source" class="rounded bg-slate-100 px-1.5 py-0.5">{{ label(source) }}</span>
              <span v-if="candidate.release_kind !== 'first'" class="rounded px-1.5 py-0.5" :class="candidate.release_kind === 'resale' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-500'">{{ t(`admin_pages.harvest.release_kind.${candidate.release_kind}`) }}</span>
              <span v-if="candidate.has_tracks" class="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800">{{ t('admin_pages.harvest.candidates.tracks', { count: candidate.tracks }) }}</span>
              <span v-else class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">{{ t('admin_pages.harvest.candidates.no_tracks') }}</span>
              <span v-if="!candidate.has_cover" class="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">{{ t('admin_pages.harvest.candidates.no_cover') }}</span>
              <span v-if="candidate.strong_duplicate" class="rounded bg-red-50 px-1.5 py-0.5 text-red-700">{{ t('admin_pages.harvest.candidates.duplicate') }}</span>
              <span v-else-if="candidate.duplicates" class="rounded bg-orange-50 px-1.5 py-0.5 text-orange-800">{{ t('admin_pages.harvest.candidates.maybe_duplicate') }}</span>
              <span v-if="candidate.sources_changed_at" class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-800">{{ t('admin_pages.harvest.candidates.changed') }}</span>
              <span v-if="candidate.is_adult" class="rounded bg-pink-50 px-1.5 py-0.5 text-pink-800">{{ t('admin_pages.harvest.candidates.adult') }}</span>
            </div>
          </li>
        </ul>
      </AdminListState>
    </section>
    <CommonPagination v-if="(data?.pagination.last_page ?? 1) > 1" v-model:page="page" :total-pages="data!.pagination.last_page" />
  </div>
</template>
