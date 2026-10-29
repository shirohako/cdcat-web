<script setup lang="ts">
import { CalendarClock, CalendarDays, MapPin } from '@lucide/vue'

interface EventSeriesSummary {
  id: number
  name: string
  slug: string
  location: string | null
  banner_url: string | null
  events_count: number
  latest_start_date: string | null
}

/** One column fewer than the franchise grid from md up, so the facts fit beside their icons. */
const GRID = 'grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4'

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()
const { localizeError } = useLocalizedApiError()

const { data, status, error, revealClass } = usePageAPI<{ event_series: EventSeriesSummary[] }>('/v1/event-series')
const seriesList = computed(() => (data.value?.event_series ?? []).map(series => ({
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

          <div v-else :class="['grid', GRID]">
            <NuxtLink
              v-for="series in seriesList"
              :key="series.id"
              :to="`/event-series/${series.id}`"
              class="group flex flex-col overflow-hidden rounded-xl bg-sunken transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
            >
              <div class="relative aspect-video shrink-0 overflow-hidden">
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
              <!-- The name takes up to two lines; the facts get a row each at the foot, so cards in a row line up.
                   The icons sit in the text on its baseline, centred on the glyphs (0.37em up) rather than on the
                   line box, which puts them a pixel high in fonts with a tall ascent. -->
              <div class="flex flex-1 flex-col p-4">
                <h2 class="line-clamp-2 font-bold leading-snug text-title transition-colors group-hover:text-primary" :title="series.name">{{ series.name }}</h2>
                <div class="mt-auto space-y-1.5 pt-3 text-xs text-meta">
                  <p v-if="series.location" class="truncate" :title="series.location">
                    <MapPin class="mr-1.5 inline-block size-3.5 align-[calc(0.37em-7px)]" />{{ series.location }}
                  </p>
                  <p class="truncate font-medium text-body">
                    <CalendarDays class="mr-1.5 inline-block size-3.5 align-[calc(0.37em-7px)] text-meta" />{{ t('collection_pages.events.event_count', { count: series.events_count }) }}
                  </p>
                  <p v-if="series.latest_start_date" class="truncate">
                    <CalendarClock class="mr-1.5 inline-block size-3.5 align-[calc(0.37em-7px)]" />{{ t('collection_pages.events.latest', { date: latestDate(series) }) }}
                  </p>
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

        <CollectionLoadingSkeleton v-else variant="wide" :grid-class="GRID" />
      </CollectionPageCard>
    </div>
  </div>
</template>
