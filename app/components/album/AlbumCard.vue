<template>
  <!-- A raised card in neutral greys (the theme colour doesn't tint it): a hairline and a soft shadow; pointed at, it
       lifts and its shadow deepens; pressed, it settles. -->
  <NuxtLink
    :to="`/albums/${album.id}`"
    class="group block rounded-xl bg-white p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.05)] ring-1 ring-black/[0.07] transition-[translate,box-shadow,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgb(0_0_0/0.28),0_2px_6px_rgb(0_0_0/0.05)] hover:ring-black/[0.11] active:translate-y-0 active:shadow-[0_1px_2px_rgb(0_0_0/0.05)] active:duration-100 motion-reduce:hover:translate-y-0 dark:bg-white/[0.04] dark:shadow-none dark:ring-white/[0.08] dark:hover:bg-white/[0.06] dark:hover:shadow-[0_12px_28px_-12px_rgb(0_0_0/0.7)] dark:hover:ring-white/[0.14]"
  >
    <!-- The cover, inset in the card: the type at the top, how many viewed and liked it at the foot -->
    <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
      <img
        v-if="album.image_url"
        v-img-fade
        :src="album.image_url"
        :alt="album.title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        style="image-rendering: -webkit-optimize-contrast;"
      >
      <div v-else class="text-faint"><Disc3 :size="56" /></div>
      <CatalogPendingBadge v-if="album.is_pending" overlay class="absolute left-2 top-2" />
      <span class="absolute right-1.5 top-1.5" :class="PILL">{{ typeLabel }}</span>
      <div class="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between tabular-nums">
        <span :class="PILL" :aria-label="t('albums.card.views', { count: album.views_count || 0 })">
          <!-- a plain eye, an outline and a dot, which stays clear at this size -->
          <svg viewBox="0 0 24 24" class="size-2.5 shrink-0 opacity-90" fill="none" aria-hidden="true">
            <path d="M 2 12 C 4.8 7.3, 8.2 5.5, 12 5.5 C 15.8 5.5, 19.2 7.3, 22 12 C 19.2 16.7, 15.8 18.5, 12 18.5 C 8.2 18.5, 4.8 16.7, 2 12 Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" />
            <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          </svg>{{ compact(album.views_count) }}
        </span>
        <span :class="PILL" :aria-label="t('albums.card.likes', { count: album.favorites_count || 0 })">
          <Heart :size="10" :fill="album.is_favorited ? 'currentColor' : 'none'" class="shrink-0" :class="album.is_favorited ? 'text-red-400' : 'opacity-90'" />{{ compact(album.favorites_count) }}
        </span>
      </div>
    </div>

    <!-- The title and the artists under it; then one row with the date and the size of the release, which keeps the
         card nearer square -->
    <div class="flex flex-col gap-1 px-1.5 pb-1.5 pt-2">
      <!-- Cut off, the title and the artists show in full in a tooltip -->
      <UiTruncate :text="album.title" tag="h3" class="text-[13px] leading-5 font-bold text-title transition-colors group-hover:text-primary" />
      <div class="flex h-4 min-w-0 items-center gap-1.5 text-[11px]" :class="shownArtists ? 'text-meta' : 'text-faint'">
        <UserRound :size="11" class="shrink-0" />
        <UiTruncate v-if="shownArtists" :text="shownArtists" :tooltip="allArtists" class="min-w-0" />
        <span v-else>—</span>
        <!-- More than two: the first two, and the rest counted, all of them in the tooltip -->
        <UiTooltip v-if="moreArtists" :text="allArtists">
          <span class="shrink-0 rounded bg-black/5 px-1 text-[10px] font-semibold leading-4 text-meta dark:bg-white/10">+{{ moreArtists }}</span>
        </UiTooltip>
      </div>
      <div class="mt-1 flex items-center justify-between gap-2 border-t border-line pt-2 text-[11px] tabular-nums text-meta">
        <span class="inline-flex min-w-0 items-center gap-1" :class="{ 'text-faint': !album.release_date }">
          <Calendar :size="11" class="shrink-0" />
          <span class="truncate">{{ shortDate || '—' }}</span>
        </span>
        <span class="inline-flex shrink-0 items-center gap-2">
          <span class="inline-flex items-center gap-1" :aria-label="t('albums.card.discs', { count: album.disc_count || 0 }, album.disc_count || 0)"><Disc3 :size="11" aria-hidden="true" />{{ album.disc_count || 0 }}</span>
          <span class="inline-flex items-center gap-1" :aria-label="t('albums.card.tracks', { count: album.track_count || 0 }, album.track_count || 0)"><ListMusic :size="11" aria-hidden="true" />{{ album.track_count || 0 }}</span>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'
import { Calendar, Disc3, Heart, ListMusic, UserRound } from '@lucide/vue'

const props = defineProps<{
  album: Pick<AlbumSimple, 'id' | 'title' | 'type' | 'image_url' | 'release_date' | 'disc_count' | 'track_count' | 'views_count' | 'favorites_count'>
    & Partial<Pick<AlbumSimple, 'release_date_precision' | 'is_favorited' | 'is_pending' | 'artists'>>
}>()

const { t, te, locale } = useI18n()

/** The three labels on the cover (type, views, likes) share one look. */
const PILL = 'inline-flex items-center gap-1 rounded bg-scrim px-1.5 py-[3px] text-[10px] font-medium leading-none text-on-media backdrop-blur-sm'

const typeLabel = computed(() => te(`albums.type.${props.album.type}`) ? t(`albums.type.${props.album.type}`) : props.album.type)
/** Artists as credited: each name with its join phrase ("feat."), or a list separator where it has none. */
const joinArtists = (list: NonNullable<AlbumSimple['artists']>) =>
  list.map((artist, index) => artist.name + (index < list.length - 1 ? (artist.join_phrase ?? t('albums.card.artist_separator')) : '')).join('')
/** The card names two artists at most; the rest are counted, and all of them are in the count's tooltip. */
const SHOWN_ARTISTS = 2
const shownArtists = computed(() => joinArtists((props.album.artists ?? []).slice(0, SHOWN_ARTISTS)))
const moreArtists = computed(() => Math.max(0, (props.album.artists?.length ?? 0) - SHOWN_ARTISTS))
const allArtists = computed(() => joinArtists(props.album.artists ?? []))
/**
 * The release date as digits, to its precision (2026.10.25, 2026.10, 2026): short and the same in every language, so
 * it fits beside the counts on a narrow card. The album page gives the date in full.
 */
const shortDate = computed(() => {
  const date = props.album.release_date
  if (!date) return ''
  const [year, month, day] = date.slice(0, 10).split('-')
  const precision = props.album.release_date_precision ?? 'day'
  return precision === 'year' ? year : precision === 'month' ? `${year}.${month}` : `${year}.${month}.${day}`
})
/** 1234 as 1.2K / 1234 in the UI language's own short form. */
const compact = (value: number | undefined) => new Intl.NumberFormat(locale.value, { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
</script>
