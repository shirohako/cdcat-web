<template>
  <section class="relative isolate overflow-hidden bg-hero text-on-media">
    <!-- Always dark, over a blur of the main visual, in both themes -->
    <img
      v-if="event.main_visual_url"
      v-img-fade
      :src="event.main_visual_url"
      alt=""
      class="absolute inset-0 -z-10 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
    >
    <div class="absolute inset-0 -z-10 bg-linear-to-br from-hero/70 via-hero/80 to-hero" />

    <div class="container mx-auto max-w-6xl px-4 pb-10 pt-6 md:px-8 md:pb-14 2xl:max-w-7xl">
      <NuxtLink
        :to="event.series ? `/event-series/${event.series.id}` : '/events'"
        class="inline-flex items-center gap-1.5 text-sm text-on-media/60 transition-colors duration-150 ease-out hover:text-on-media"
      >
        <ArrowLeft :size="16" />
        {{ event.series?.name ?? t('collection_pages.events.title') }}
      </NuxtLink>

      <div class="mt-6 flex flex-col gap-8 md:flex-row md:items-end">
        <div
          class="mx-auto shrink-0 overflow-hidden rounded-2xl bg-on-media/5 ring-1 ring-on-media/15 md:mx-0"
          :style="{ aspectRatio: landscape ? '16 / 9' : '5 / 7' }"
          :class="landscape ? 'w-full sm:w-96 lg:w-md' : 'w-48 sm:w-56 lg:w-64'"
        >
          <img v-if="event.main_visual_url" v-img-fade :src="event.main_visual_url" :alt="event.name" class="h-full w-full object-cover">
          <div v-else class="flex h-full w-full items-center justify-center"><CalendarDays class="size-12 text-on-media/30" /></div>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-md bg-on-media/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-on-media/80 ring-1 ring-on-media/15">{{ event.slug }}</span>
            <span v-if="status" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1" :class="status.class">
              <span class="size-1.5 rounded-full bg-current" />{{ status.label }}
            </span>
          </div>
          <h1 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{{ event.name }}</h1>

          <dl class="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div class="flex items-start gap-2.5">
              <CalendarDays :size="18" class="mt-0.5 shrink-0 text-on-media/50" />
              <div>
                <dt class="sr-only">{{ t('event_page.hero.date') }}</dt>
                <dd class="font-semibold">{{ dateText }}</dd>
                <dd v-if="timeText" class="text-on-media/60">{{ timeText }}</dd>
              </div>
            </div>
            <div v-if="event.venue || event.location" class="flex items-start gap-2.5">
              <MapPin :size="18" class="mt-0.5 shrink-0 text-on-media/50" />
              <div>
                <dt class="sr-only">{{ t('event_page.hero.venue') }}</dt>
                <dd class="font-semibold">{{ event.venue }}</dd>
                <dd v-if="event.location" class="text-on-media/60">{{ event.location }}</dd>
              </div>
            </div>
          </dl>

          <p v-if="description" class="mt-4 max-w-2xl text-sm leading-relaxed text-on-media/70">{{ description }}</p>

          <div class="mt-6 flex flex-wrap items-center gap-2">
            <div v-for="stat in stats" :key="stat.key" class="min-w-24 rounded-xl bg-on-media/8 px-4 py-2.5 ring-1 ring-on-media/10">
              <p class="text-xl font-bold tabular-nums">{{ stat.value.toLocaleString() }}</p>
              <p class="text-xs text-on-media/55">{{ stat.label }}</p>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-2">
            <UiButton v-if="hasMap" variant="primary" :icon="MapIcon" @click="$emit('jump-map')">
              {{ t('event_page.hero.open_map') }}
            </UiButton>
            <UiButton
              v-for="link in links"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener"
              :icon-right="ExternalLink"
            >
              {{ link.label }}
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EventDetail } from '~/types/event'
import { ArrowLeft, CalendarDays, ExternalLink, Map as MapIcon, MapPin } from '@lucide/vue'

const props = defineProps<{
  event: EventDetail
  stats: { key: string, label: string, value: number }[]
  hasMap: boolean
}>()
defineEmits<{ 'jump-map': [] }>()
const { t } = useI18n()
const { formatDate, localizedContent } = useLocaleFormatting()

const landscape = computed(() => props.event.series?.visual_orientation === 'landscape')
const description = computed(() => localizedContent(props.event.description))

// Event dates are calendar days, stored as midnight UTC.
const dayOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', timeZone: 'UTC' } as const
const dateText = computed(() => {
  const start = props.event.start_date ? formatDate(props.event.start_date, dayOptions) : ''
  const end = props.event.end_date && props.event.end_date !== props.event.start_date ? formatDate(props.event.end_date, dayOptions) : ''
  return end ? `${start} – ${end}` : start
})
const timeText = computed(() => props.event.start_time
  ? `${props.event.start_time}${props.event.end_time ? ` – ${props.event.end_time}` : ''}`
  : '')

// The hero is dark in both themes, so the status chips keep fixed light hues (the theme's status colours would turn
// dark in the light theme).
const status = computed(() => {
  if (!props.event.start_date) return null
  const today = new Date().toISOString().slice(0, 10)
  const start = props.event.start_date.slice(0, 10)
  const end = (props.event.end_date ?? props.event.start_date).slice(0, 10)
  if (today < start) {
    const days = Math.round((Date.parse(start) - Date.parse(today)) / 86_400_000)
    return { label: t('event_page.hero.days_left', { count: days }, days), class: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30' }
  }
  if (today <= end) return { label: t('event_page.hero.today'), class: 'bg-rose-400/15 text-rose-300 ring-rose-400/30' }
  return { label: t('event_page.hero.ended'), class: 'bg-on-media/10 text-on-media/60 ring-on-media/15' }
})

const links = computed(() => {
  const out: { label: string, url: string }[] = []
  if (props.event.website_url) out.push({ label: t('event_page.hero.edition_site'), url: props.event.website_url })
  if (props.event.series?.website && props.event.series.website !== props.event.website_url) out.push({ label: t('event_page.hero.series_site', { name: props.event.series.name }), url: props.event.series.website })
  return out
})
</script>
