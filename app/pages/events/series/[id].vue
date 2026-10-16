<script setup lang="ts">
import { ArrowLeft, Calendar, CalendarDays, ExternalLink, MapPin } from '@lucide/vue'

interface SeriesEvent {
  id: number
  name: string
  slug: string
  start_date: string | null
  end_date: string | null
  venue: string | null
  location: string | null
}

interface EventSeriesDetail {
  id: number
  name: string
  slug: string
  location: string | null
  description: Record<string, string> | null
  website: string | null
  banner_url: string | null
  events_count: number
  events: SeriesEvent[]
}

const route = useRoute()
const seriesId = Number(route.params.id)

const { t } = useI18n()
const { localizedContent, formatDate } = useLocaleFormatting()
const { localizeError } = useLocalizedApiError()

const { data: series, pending, error } = await useAPI<EventSeriesDetail>(`/v1/events/series/${seriesId}`)

const description = computed(() => series.value ? localizedContent(series.value.description, t('collection_pages.events.no_description')) : '')

const formatEventDate = (event: SeriesEvent) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' } as const
  const start = event.start_date ? formatDate(event.start_date, options) : ''
  const end = event.end_date ? formatDate(event.end_date, options) : ''
  if (start && end && start !== end) return `${start} ~ ${end}`
  return start || end
}

useHead({
  title: computed(() => `${series.value?.name ?? t('collection_pages.events.title')} | CDCAT`),
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

        <div v-if="series.events.length === 0" class="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
          {{ t('collection_pages.events.empty') }}
        </div>

        <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="event in series.events"
            :key="event.id"
            class="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5"
          >
            <div>
              <span class="mb-3 inline-block rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-gray-500">{{ event.slug }}</span>
              <h2 class="mb-4 text-lg font-bold leading-snug text-gray-900">{{ event.name || event.slug }}</h2>
            </div>
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-center gap-2">
                <Calendar :size="15" class="shrink-0 text-gray-400" />
                <span class="truncate font-medium">{{ formatEventDate(event) }}</span>
              </div>
              <div v-if="event.venue || event.location" class="flex items-center gap-2">
                <MapPin :size="15" class="shrink-0 text-gray-400" />
                <span class="truncate" :title="[event.venue, event.location].filter(Boolean).join(' · ')">{{ [event.venue, event.location].filter(Boolean).join(' · ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
