<script setup lang="ts">
import { ArrowLeft, Calendar, CalendarDays, Disc3, ExternalLink, MapPin } from '@lucide/vue'

interface SeriesEvent {
  id: number
  name: string
  slug: string
  start_date: string | null
  end_date: string | null
  venue: string | null
  location: string | null
  main_visual_url: string | null
  released_works_count: number
}

interface SeriesEventPage {
  events: SeriesEvent[]
  pagination: { total: number, per_page: number, current_page: number, last_page: number }
}

interface EventSeriesDetail {
  id: number
  name: string
  slug: string
  location: string | null
  description: Record<string, string> | null
  website: string | null
  banner_url: string | null
  visual_orientation: 'portrait' | 'landscape'
  events_count: number
}

const route = useRoute()
const router = useRouter()
const seriesId = Number(route.params.id)

const { t } = useI18n()
const { localizedContent, formatDate } = useLocaleFormatting()
const { localizeError } = useLocalizedApiError()

const { data: series, pending, error } = await useAPI<EventSeriesDetail>(`/v1/events/series/${seriesId}`)

// 24 fills whole rows in every grid (2/3/4 portrait columns, 1/2/3 landscape).
const PER_PAGE = 24
const page = computed(() => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1))
const SORTS = {
  newest: { sort_by: 'start_date', sort_order: 'desc' },
  oldest: { sort_by: 'start_date', sort_order: 'asc' },
  works: { sort_by: 'released_works_count', sort_order: 'desc' },
} as const
type SortKey = keyof typeof SORTS
const sortKeys = Object.keys(SORTS) as SortKey[]
// Changing the order starts again from the first page.
const sort = computed<SortKey>({
  get: () => (sortKeys as string[]).includes(String(route.query.sort)) ? route.query.sort as SortKey : 'newest',
  set: value => { router.push({ query: { ...route.query, sort: value === 'newest' ? undefined : value, page: undefined } }) },
})
const { data: eventPage, pending: eventsPending, error: eventsError } = await useAPI<SeriesEventPage>('/v1/events', {
  query: computed(() => ({ series_id: seriesId, page: page.value, per_page: PER_PAGE, ...SORTS[sort.value] })),
})
const events = computed(() => eventPage.value?.events ?? [])
const lastPage = computed(() => eventPage.value?.pagination.last_page ?? 1)
const eventsList = ref<HTMLElement | null>(null)
const goToPage = (value: number) => {
  router.push({ query: { ...route.query, page: value > 1 ? value : undefined } })
  eventsList.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const description = computed(() => series.value ? localizedContent(series.value.description, t('collection_pages.events.no_description')) : '')

// The series decides the visual format (Comic Market and M3 portrait catalogs, TGS landscape),
// so every card in a series shares one ratio and a missing visual keeps its slot.
const landscape = computed(() => series.value?.visual_orientation === 'landscape')
const visualRatio = computed(() => landscape.value ? '16 / 9' : '5 / 7')
const gridClass = computed(() => landscape.value ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4')

const formatEventDate = (event: SeriesEvent) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' } as const
  const start = event.start_date ? formatDate(event.start_date, options) : ''
  const end = event.end_date ? formatDate(event.end_date, options) : ''
  if (start && end && start !== end) return `${start} ~ ${end}`
  return start || end
}

useHead({
  title: computed(() => series.value?.name ?? t('collection_pages.events.title')),
  meta: [{ name: 'description', content: computed(() => description.value || t('collection_pages.events.seo_description')) }],
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto max-w-6xl space-y-6 px-4 py-10 md:px-6 2xl:max-w-7xl">
      <NuxtLink to="/events" class="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900">
        <ArrowLeft :size="16" />
        {{ t('collection_pages.events.back') }}
      </NuxtLink>

      <CollectionLoadingSkeleton v-if="pending" />

      <div v-else-if="error || !series" class="flex min-h-60 items-center justify-center">
        <div class="alert alert-error max-w-md">
          <span>{{ error?.statusCode === 404 || !series ? t('collection_pages.events.not_found') : localizeError(error) }}</span>
        </div>
      </div>

      <template v-else>
        <section class="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:p-8">
          <div class="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-gray-50 md:w-80 lg:w-96">
            <img v-if="series.banner_url" :src="series.banner_url" :alt="series.name" class="h-full w-full object-contain">
            <div v-else class="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-50 to-gray-100">
              <CalendarDays class="h-12 w-12 text-amber-300" />
            </div>
          </div>
          <div class="min-w-0 flex-1 space-y-3">
            <h1 class="text-3xl font-bold tracking-tight text-gray-900">{{ series.name }}</h1>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span v-if="series.location" class="inline-flex items-center gap-1.5"><MapPin :size="15" class="text-gray-400" />{{ series.location }}</span>
              <span class="inline-flex items-center gap-1.5"><CalendarDays :size="15" class="text-gray-400" />{{ t('collection_pages.events.event_count', { count: series.events_count }) }}</span>
            </div>
            <p class="max-w-2xl text-sm leading-relaxed text-gray-500">{{ description }}</p>
            <a
              v-if="series.website"
              :href="series.website"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-blue-600"
            >
              {{ t('collection_pages.events.official_site') }}
              <ExternalLink :size="14" />
            </a>
          </div>
        </section>

        <div v-if="series.events_count" class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-500">{{ t('collection_pages.events.event_count', { count: series.events_count }) }}</p>
          <label class="flex items-center gap-2 text-sm text-gray-600">
            {{ t('collection_pages.events.sort_label') }}
            <select v-model="sort" class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
              <option v-for="key in sortKeys" :key="key" :value="key">{{ t(`collection_pages.events.sorts.${key}`) }}</option>
            </select>
          </label>
        </div>

        <div v-if="eventsError" class="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
          {{ localizeError(eventsError) }}
        </div>

        <div v-else-if="!eventsPending && events.length === 0" class="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
          {{ t('collection_pages.events.empty') }}
        </div>

        <div v-else ref="eventsList" class="grid scroll-mt-6 gap-4 transition-opacity" :class="[gridClass, { 'opacity-60': eventsPending }]">
          <div
            v-for="event in events"
            :key="event.id"
            class="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            <div class="bg-gray-50" :style="{ aspectRatio: visualRatio }">
              <img v-if="event.main_visual_url" :src="event.main_visual_url" :alt="event.name" loading="lazy" class="h-full w-full object-contain">
              <div v-else class="flex h-full w-full items-center justify-center">
                <CalendarDays class="h-10 w-10 text-gray-300" />
              </div>
            </div>
            <div class="flex flex-1 flex-col justify-between p-5">
              <div>
                <span class="mb-3 inline-block rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-gray-500">{{ event.slug }}</span>
                <h2 class="mb-4 text-lg font-bold leading-snug text-gray-900">{{ event.name || event.slug }}</h2>
              </div>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <Calendar :size="15" class="shrink-0 text-gray-400" />
                  <span class="truncate font-medium">{{ formatEventDate(event) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Disc3 :size="15" class="shrink-0 text-gray-400" />
                  <NuxtLink
                    v-if="event.released_works_count"
                    :to="{ path: '/works', query: { event: event.id } }"
                    class="text-blue-600 underline decoration-blue-200 underline-offset-4 hover:decoration-blue-500"
                  >
                    {{ t('content_display.works_count', { count: event.released_works_count }) }}
                  </NuxtLink>
                  <span v-else class="text-gray-400">{{ t('content_display.works_count', { count: 0 }) }}</span>
                </div>
                <div v-if="event.venue || event.location" class="flex items-center gap-2">
                  <MapPin :size="15" class="shrink-0 text-gray-400" />
                  <span class="truncate" :title="[event.venue, event.location].filter(Boolean).join(' · ')">{{ [event.venue, event.location].filter(Boolean).join(' · ') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CommonPagination :page="page" :total-pages="lastPage" :disabled="eventsPending" @update:page="goToPage" />
      </template>
    </div>
  </div>
</template>
