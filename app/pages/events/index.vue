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

const { data, pending, error } = useAPI<EventSeriesSummary[]>('/v1/events/series', { lazy: true })
const seriesList = computed(() => Array.isArray(data.value) ? data.value : [])

const latestDate = (series: EventSeriesSummary) => series.latest_start_date
  ? formatDate(series.latest_start_date, { year: 'numeric', month: '2-digit', day: '2-digit' })
  : ''

useHead({
  title: computed(() => `${t('collection_pages.events.title')} | CDCAT`),
  meta: [{ name: 'description', content: computed(() => t('collection_pages.events.seo_description')) }],
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader
            :title="t('collection_pages.events.title')"
            :description="t('collection_pages.events.description')"
            icon="lucide:calendar-days"
            tone="amber"
          />
        </template>

        <CollectionLoadingSkeleton v-if="pending" />

        <div v-else-if="error" class="flex items-center justify-center min-h-60">
          <div class="alert alert-error max-w-md">
            <span>{{ localizeError(error) }}</span>
          </div>
        </div>

        <div v-else class="collection-content-enter">
          <div v-if="seriesList.length === 0" class="flex min-h-72 items-center justify-center text-sm text-slate-400">
            {{ t('collection_pages.events.no_series') }}
          </div>

          <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            <NuxtLink
              v-for="series in seriesList"
              :key="series.id"
              :to="`/events/series/${series.id}`"
              class="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div class="relative aspect-video overflow-hidden bg-gray-50">
                <img
                  v-if="series.banner_url"
                  :src="series.banner_url"
                  :alt="series.name"
                  loading="lazy"
                  class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                >
                <div v-else class="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-50 to-gray-100">
                  <CalendarDays class="h-12 w-12 text-amber-300" />
                </div>
              </div>
              <div class="space-y-1.5 p-4">
                <h2 class="truncate font-bold text-gray-800 transition-colors group-hover:text-blue-600">{{ series.name }}</h2>
                <div v-if="series.location" class="flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin class="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span class="truncate">{{ series.location }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-gray-600">
                  <CalendarDays class="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span>{{ t('collection_pages.events.event_count', { count: series.events_count }) }}</span>
                  <span v-if="series.latest_start_date" class="truncate text-gray-400">· {{ t('collection_pages.events.latest', { date: latestDate(series) }) }}</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </CollectionPageCard>
    </div>
  </div>
</template>
