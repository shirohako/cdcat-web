<script setup lang="ts">
import { CalendarDays, MapPin } from '@lucide/vue'

interface EventSeriesSummary {
  id: number
  name: string
  slug: string
  location: string | null
  banner_url: string | null
  events_count: number
  latest_start_date: string | null
}

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()
const { localizeError } = useLocalizedApiError()

const { data, status, error, revealClass } = usePageAPI<EventSeriesSummary[]>('/v1/event-series')
const seriesList = computed(() => (Array.isArray(data.value) ? data.value : []).map(series => ({
  ...series,
  banner_url: eventSeriesBanner(series),
})))

const latestDate = (series: EventSeriesSummary) => series.latest_start_date
  ? formatDate(series.latest_start_date, { year: 'numeric', month: '2-digit', day: '2-digit' })
  : ''

usePageSeo({
  title: () => t('collection_pages.events.title'),
  description: () => t('collection_pages.events.seo_description'),
})
</script>

<template>
  <div class="min-h-screen">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader
            :title="t('collection_pages.events.title')"
            :description="t('collection_pages.events.description')"
            icon="lucide:calendar">
            <template #icon>
              <HeaderArtEvents />
            </template>
          </CollectionPageHeader>
        </template>

        <div v-if="data" :class="revealClass">
          <div v-if="seriesList.length === 0" class="flex min-h-72 items-center justify-center text-sm text-meta">
            {{ t('collection_pages.events.no_series') }}
          </div>

          <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            <NuxtLink
              v-for="series in seriesList"
              :key="series.id"
              :to="`/event-series/${series.id}`"
              class="group block overflow-hidden rounded-xl bg-sunken transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
            >
              <div class="relative aspect-video overflow-hidden">
                <img
                  v-if="series.banner_url"
                  v-img-fade
                  :src="series.banner_url"
                  :alt="series.name"
                  loading="lazy"
                  class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                >
                <div v-else class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-transparent">
                  <CalendarDays class="h-12 w-12 text-primary/40" />
                </div>
              </div>
              <div class="space-y-1.5 p-4">
                <h2 class="truncate font-bold text-title transition-colors group-hover:text-primary">{{ series.name }}</h2>
                <div v-if="series.location" class="flex items-center gap-1.5 text-xs text-body">
                  <MapPin class="h-3.5 w-3.5 shrink-0 text-meta" />
                  <span class="truncate">{{ series.location }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-body">
                  <CalendarDays class="h-3.5 w-3.5 shrink-0 text-meta" />
                  <span>{{ t('collection_pages.events.event_count', { count: series.events_count }) }}</span>
                  <span v-if="series.latest_start_date" class="truncate text-meta">· {{ t('collection_pages.events.latest', { date: latestDate(series) }) }}</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <div v-else-if="status === 'error'" class="flex items-center justify-center min-h-60">
          <div class="alert alert-error max-w-md">
            <span>{{ localizeError(error) }}</span>
          </div>
        </div>

        <CollectionLoadingSkeleton v-else variant="wide" />
      </CollectionPageCard>
    </div>
  </div>
</template>
