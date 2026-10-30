<script setup lang="ts">
import { ArrowLeft, Calendar, CalendarDays, Disc3, ExternalLink, MapPin } from '@lucide/vue'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { namedLd } from '~/utils/structuredData'
import { plainText } from '~/utils/seoText'

interface SeriesEvent {
  id: number
  name: string
  slug: string
  start_date: string | null
  end_date: string | null
  venue: string | null
  location: string | null
  main_visual_url: string | null
  released_albums_count: number
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

const { data: series, status, error, revealClass } = await usePageAPI<EventSeriesDetail>(`/v1/event-series/${seriesId}`, { notFound: true })

// 24 fills whole rows in every grid (2/3/4 portrait columns, 1/2/3 landscape).
const PER_PAGE = 24
const page = computed(() => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1))
const SORTS = {
  newest: { sort: 'start_date', direction: 'desc' },
  oldest: { sort: 'start_date', direction: 'asc' },
  albums: { sort: 'released_albums_count', direction: 'desc' },
} as const
type SortKey = keyof typeof SORTS
const sortKeys = Object.keys(SORTS) as SortKey[]
const sortOptions = computed<UiSelectOption<SortKey>[]>(() => sortKeys.map(key => ({ value: key, label: t(`collection_pages.events.sorts.${key}`) })))
// Changing the order starts again from the first page.
const sort = computed<SortKey>({
  get: () => (sortKeys as string[]).includes(String(route.query.sort)) ? route.query.sort as SortKey : 'newest',
  set: value => { router.push({ query: { ...route.query, sort: value === 'newest' ? undefined : value, page: undefined } }) },
})
// Not awaited: on the server it loads alongside the series rather than after it.
const {
  data: eventPage,
  status: eventsStatus,
  error: eventsError,
  loading: eventsLoading,
  refetching: eventsRefetching,
  revealKey: eventsRevealKey,
  revealClass: eventsRevealClass,
} = usePageAPI<SeriesEventPage>('/v1/events', {
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
const bannerUrl = computed(() => series.value ? eventSeriesBanner(series.value) : null)

// The series decides the visual format (Comic Market and M3 portrait catalogs, TGS landscape),
// so every card in a series shares one ratio and a missing visual keeps its slot. Portrait cards
// go three to a row on phones; each card tightens its text by its own width (@container).
const landscape = computed(() => series.value?.visual_orientation === 'landscape')
const visualRatio = computed(() => landscape.value ? '16 / 9' : '5 / 7')
const gridClass = computed(() => landscape.value ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-3 md:grid-cols-4 xl:grid-cols-5')

const startDate = (event: SeriesEvent) => event.start_date
  ? formatDate(event.start_date, { year: 'numeric', month: '2-digit', day: '2-digit' })
  : undefined

const formatEventDate = (event: SeriesEvent) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' } as const
  const start = event.start_date ? formatDate(event.start_date, options) : ''
  const end = event.end_date ? formatDate(event.end_date, options) : ''
  if (start && end && start !== end) return `${start} ~ ${end}`
  return start || end
}

const absolute = useSiteUrl()
usePageSeo({
  title: () => series.value?.name,
  description: () => plainText(series.value ? localizedContent(series.value.description) : '') || t('collection_pages.events.seo_description'),
  image: () => bannerUrl.value,
  wideImage: true,
  error,
  breadcrumbs: () => series.value
    ? [{ name: t('collection_pages.events.title'), path: '/events' }, { name: series.value.name, path: `/event-series/${series.value.id}` }]
    : null,
  jsonLd: () => series.value && namedLd('EventSeries', {
    name: series.value.name,
    alternateNames: [],
    url: absolute(`/event-series/${series.value.id}`),
    image: bannerUrl.value,
    description: plainText(localizedContent(series.value.description)),
    sameAs: series.value.website ? [series.value.website] : [],
  }),
})
</script>

<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-6xl space-y-6 px-4 py-10 md:px-6 2xl:max-w-7xl">
      <!-- Icons beside text sit in the text on its baseline, centred on the glyphs (0.37em up) rather than on the
           line box, which puts them a pixel high in fonts with a tall ascent. -->
      <NuxtLink to="/events" class="inline-block text-sm text-meta transition-colors duration-150 ease-out hover:text-primary">
        <ArrowLeft :size="16" class="mr-1.5 inline-block align-[calc(0.37em-8px)]" />{{ t('collection_pages.events.back') }}
      </NuxtLink>

      <div v-if="series" class="space-y-6" :class="revealClass">
        <section class="card flex flex-col gap-6 p-6 md:flex-row md:p-8">
          <div class="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-sunken md:w-80 lg:w-96">
            <img v-if="bannerUrl" v-img-fade :src="bannerUrl" :alt="series.name" class="h-full w-full object-contain">
            <div v-else class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-transparent">
              <CalendarDays class="h-12 w-12 text-primary/40" />
            </div>
          </div>
          <div class="min-w-0 flex-1 space-y-3">
            <h1 class="text-3xl font-bold tracking-tight text-title">{{ series.name }}</h1>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body">
              <span v-if="series.location"><MapPin :size="15" class="mr-1.5 inline-block align-[calc(0.37em-7.5px)] text-meta" />{{ series.location }}</span>
              <span><CalendarDays :size="15" class="mr-1.5 inline-block align-[calc(0.37em-7.5px)] text-meta" />{{ t('collection_pages.events.event_count', { count: series.events_count }) }}</span>
            </div>
            <p class="max-w-2xl text-sm leading-relaxed text-meta">{{ description }}</p>
            <UiButton
              v-if="series.website"
              :href="series.website"
              target="_blank"
              rel="noopener"
              :icon-right="ExternalLink"
            >
              {{ t('collection_pages.events.official_site') }}
            </UiButton>
          </div>
        </section>

        <div v-if="series.events_count" class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-meta">{{ t('collection_pages.events.event_count', { count: series.events_count }) }}</p>
          <label class="flex items-center gap-2 text-sm text-body">
            {{ t('collection_pages.events.sort_label') }}
            <UiSelect v-model="sort" :options="sortOptions" size="sm" />
          </label>
        </div>

        <div v-if="eventsStatus === 'error'" class="card flex min-h-40 items-center justify-center text-sm text-meta">
          {{ localizeError(eventsError) }}
        </div>

        <CollectionLoadingSkeleton v-if="eventsLoading" variant="events" :portrait="!landscape" />

        <div
          v-else-if="events.length"
          ref="eventsList"
          :key="eventsRevealKey"
          class="grid scroll-mt-6 gap-2.5 transition-opacity sm:gap-4"
          :class="[gridClass, eventsRevealClass, { 'pointer-events-none opacity-60': eventsRefetching }]"
          :inert="eventsRefetching"
        >
          <!-- Raised like ArticleCard (a hairline ring, a soft shadow, the visual inset), since it sits on the page
               rather than in a card. The name's link stretches over the whole card; the albums link stays above it. -->
          <article
            v-for="event in events"
            :key="event.id"
            class="group @container relative flex flex-col rounded-[14px] bg-card p-1.5 shadow-[0_1px_2px_oklch(0_0_0/0.05)] ring-1 ring-line transition-shadow duration-200 ease-out
                   hover:shadow-[0_14px_32px_-16px_color-mix(in_oklch,var(--primary)_60%,transparent)] hover:ring-primary/40"
          >
            <div class="overflow-hidden rounded-lg bg-sunken" :style="{ aspectRatio: visualRatio }">
              <img
                v-if="event.main_visual_url" v-img-fade :src="event.main_visual_url" :alt="event.name" loading="lazy"
                class="size-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
              >
              <EventVisualPlaceholder
                v-else :code="event.slug" :date="startDate(event)" :landscape="landscape"
                class="transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
              />
            </div>

            <div class="flex flex-1 flex-col px-1 pb-1 pt-2 @min-[9rem]:px-2.5 @min-[9rem]:pb-2.5 @min-[9rem]:pt-3">
              <p class="mb-1 truncate text-[10px] font-semibold uppercase tracking-wide text-primary @min-[9rem]:mb-1.5 @min-[9rem]:text-[11px]">{{ event.slug }}</p>
              <h2 class="line-clamp-2 text-[13px] font-bold leading-snug text-title transition-colors duration-150 ease-out group-hover:text-primary @min-[9rem]:text-[15px]">
                <NuxtLink
                  :to="`/events/${event.id}`"
                  class="outline-none after:absolute after:inset-0 after:rounded-[14px] focus-visible:after:ring-2 focus-visible:after:ring-primary"
                >{{ event.name || event.slug }}</NuxtLink>
              </h2>

              <div class="mt-auto space-y-1 pt-2.5 text-[11px] text-meta @min-[9rem]:space-y-1.5 @min-[9rem]:pt-3.5 @min-[9rem]:text-xs">
                <!-- Each icon gets a line box of its own in the same font, so it lines up with the text's baseline. -->
                <p class="flex gap-1.5">
                  <span class="shrink-0"><Calendar class="inline-block size-3.5 align-[calc(0.37em-7px)]" /></span>
                  <span class="truncate font-medium text-body">{{ formatEventDate(event) }}</span>
                </p>
                <p class="flex min-w-0 gap-1.5">
                  <span class="shrink-0"><Disc3 class="inline-block size-3.5 align-[calc(0.37em-7px)]" /></span>
                  <NuxtLink
                    v-if="event.released_albums_count"
                    :to="{ path: '/albums', query: { event: event.id } }"
                    class="link relative z-10 truncate"
                  >
                    {{ t('content_display.albums_count', { count: event.released_albums_count }) }}
                  </NuxtLink>
                  <span v-else class="truncate">{{ t('content_display.albums_count', { count: 0 }) }}</span>
                </p>
                <p v-if="event.venue || event.location" class="flex gap-1.5">
                  <span class="shrink-0"><MapPin class="inline-block size-3.5 align-[calc(0.37em-7px)]" /></span>
                  <span class="truncate" :title="[event.venue, event.location].filter(Boolean).join(' · ')">{{ [event.venue, event.location].filter(Boolean).join(' · ') }}</span>
                </p>
              </div>
            </div>
          </article>
        </div>

        <div v-else-if="eventsStatus !== 'error'" class="card flex min-h-40 items-center justify-center text-sm text-meta">
          {{ t('collection_pages.events.empty') }}
        </div>

        <CommonPagination :page="page" :total-pages="lastPage" :disabled="eventsRefetching" @update:page="goToPage" />
      </div>

      <div v-else-if="status === 'error'" class="flex min-h-60 items-center justify-center">
        <div class="alert alert-error max-w-md">
          <span>{{ localizeError(error) }}</span>
        </div>
      </div>

      <div v-else class="space-y-6">
        <SkeletonCatalogDetail hero="series" :sections="0" />
        <CollectionLoadingSkeleton variant="events" portrait />
      </div>
    </div>
  </div>
</template>
