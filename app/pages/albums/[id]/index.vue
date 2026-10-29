<template>
  <div class="min-h-screen">
    <div v-if="album && !mergedInto" :class="revealClass">
      <AlbumHero :album="album" @open-cover="gallery?.openCover()" @favorited="value => mutate(current => ({ ...current, is_favorited: value }))" />
      <CatalogPendingBanner :pending="album.is_pending" :revision="album.pending_revision" />

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div class="space-y-8 lg:col-span-2">
            <AlbumDescriptions v-if="album.description" :description="album.description" />

            <AlbumCredits :credits="album.credits" :discs="album.discs" />

            <AlbumTracklist :album-id="album.id" :discs="album.discs" :bonuses="album.bonuses" :languages="album.tracklist_languages" :locked="album.is_pending" />

            <AlbumProducts :products="album.products" :discs="album.discs" :images="album.images" />

            <AlbumBonuses :bonuses="album.bonuses" :products="album.products" :discs="album.discs" :images="album.images" />

            <AlbumLinks :links="album.links" />

            <AlbumGallery ref="gallery" :images="album.images" :products="album.products" :bonuses="album.bonuses" :discs="album.discs" />

            <!-- Albums awaiting review can only be viewed: reviews and tracking open after approval. -->
            <AlbumReviews v-if="!album.is_pending" ref="reviews" :album-id="album.id" @changed="refresh" />
          </div>

          <div class="space-y-6 lg:col-span-1">
            <AlbumInfo :album="album" />
            <div v-if="album.is_pending" class="rounded-xl border border-dashed border-warning/30 bg-warning/10 p-4 text-sm text-body">
              {{ $t('pending.locked') }}
            </div>
            <AlbumStats
              :album-id="album.id"
              :views-count="album.views_count"
              :favorites-count="album.favorites_count"
              :tracking-stats="album.tracking_stats"
              :initial-tracking="album.user_tracking"
              :locked="album.is_pending"
              @tracked="setTracking"
            />
            <AlbumRankings
              v-if="!album.is_pending"
              :rating="album.rating"
              :rating-count="album.rating_count"
              :distribution="album.rating_distribution"
              :reviewed="!!reviews?.mine"
              @write-review="reviews?.openEditor()"
            />
            <AlbumArticles :articles="album.articles ?? []" />
            <DiscussionRelatedDiscussions v-if="!album.is_pending" :id="album.id" type="album" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="status === 'error'" class="flex min-h-screen items-center justify-center">
      <div class="alert alert-error max-w-md">
        <span>{{ $t('albums.load_failed', { message: error?.message ?? '' }) }}</span>
      </div>
    </div>

    <!-- Also while moving on to the album this one was merged into. -->
    <SkeletonCatalogDetail v-else hero="album" />
  </div>
</template>

<script setup lang="ts">
import type { Album } from '~/types/album'
import type { TrackingStatus } from '~/types/tracking'
import type { AlbumReview } from '~/types/reviews'
import { ldDate, musicAlbumLd } from '~/utils/structuredData'
import { composeDescription, descriptionLength, plainText } from '~/utils/seoText'
import { bylineText } from '~/utils/albumByline'

const route = useRoute()
const { t, locale } = useI18n()
const { localName, formatDate, enumLabel } = useCatalogDisplay()
const { withOriginal, sentence, count } = useSeoText()
const absolute = useSiteUrl()

const { data: album, status, error, refresh, mutate, revealClass } = await usePageAPI<Album>(`/v1/albums/${route.params.id}`)

// A merged album answers with the kept one; show its address instead of the old id. The check after the
// await covers the server (a 301) and cached data; the watch covers data that arrives after client-side navigation.
const mergedInto = computed(() => album.value && String(album.value.id) !== String(route.params.id) ? album.value.id : null)
if (mergedInto.value) {
  await navigateTo({ path: `/albums/${mergedInto.value}`, query: route.query }, { replace: true, redirectCode: 301 })
}
watch(mergedInto, (id) => {
  if (id) navigateTo({ path: `/albums/${id}`, query: route.query }, { replace: true })
})

// The visitor's own pick moves the counts as the server's will: one off the status they leave, one onto the new one.
const setTracking = (tracking: TrackingStatus | null, previous: TrackingStatus | null) => mutate((current) => {
  const now = new Date().toISOString()
  const stats = { ...current.tracking_stats }
  if (previous) stats[previous] = Math.max(0, stats[previous] - 1)
  if (tracking) stats[tracking] += 1
  return { ...current, tracking_stats: stats, user_tracking: tracking ? { created_at: current.user_tracking?.created_at ?? now, updated_at: now, status: tracking } : null }
})

const gallery = ref<{ openCover: () => void } | null>(null)
const reviews = ref<{ openEditor: () => void, mine: AlbumReview | null } | null>(null)

const shownTitle = computed(() => album.value ? localName(album.value.title, album.value.titles) : '')
/** The byline for the page title: the publishers, else up to three 署名艺术家, else Various Artists. */
const artistLine = computed(() => bylineText(album.value?.byline))
/** Album-wide credits in these roles, each artist once, for structured data. */
const creditedAs = (roles: string[]) => {
  const seen = new Map<string, { name: string, url?: string, type?: string | null }>()
  for (const credit of album.value?.credits ?? []) {
    const name = credit.credited_as || credit.artist?.name
    if (!roles.includes(credit.role) || !name) continue
    seen.set(credit.artist ? `id:${credit.artist.id}` : `name:${name}`, { name, url: credit.artist ? absolute(`/artists/${credit.artist.id}`) : undefined, type: credit.artist?.type })
  }
  return [...seen.values()]
}

usePageSeo({
  title: () => album.value ? [withOriginal(shownTitle.value, album.value.title), artistLine.value].filter(Boolean).join(' - ') : undefined,
  description: () => {
    const value = album.value
    if (!value) return undefined
    const type = enumLabel('album_type', value.type)
    const lead = sentence([
      artistLine.value ? t('seo.album.by', { artists: artistLine.value, type }) : type,
      value.release_date && t('seo.album.released', { date: formatDate(value.release_date, value.release_date_precision) }),
      value.release_event && t('seo.album.event', { event: value.release_event.name }),
      value.catalog_number && t('seo.album.catalog', { number: value.catalog_number }),
      count('seo.album.tracks', value.track_count),
    ])
    return composeDescription(lead, plainText(value.description), descriptionLength(locale.value))
  },
  image: () => album.value?.cover?.medium_url || album.value?.image_url,
  card: () => album.value?.share_card_url,
  type: 'music.album',
  noindex: () => album.value?.is_pending,
  adult: () => album.value?.is_adult,
  error,
  breadcrumbs: () => album.value ? [{ name: t('menu.album'), path: '/albums' }, { name: shownTitle.value, path: `/albums/${album.value.id}` }] : null,
  jsonLd: () => {
    const value = album.value
    if (!value) return null
    return musicAlbumLd({
      name: shownTitle.value,
      alternateNames: [value.title, ...value.titles.map(title => title.title)],
      url: absolute(`/albums/${value.id}`),
      image: value.cover?.url || value.image_url,
      description: plainText(value.description),
      datePublished: ldDate(value.release_date, value.release_date_precision),
      genre: value.categories.map(category => enumLabel('album_category', category)),
      artists: creditedAs(['artist']),
      labels: creditedAs(['label', 'publisher']),
      catalogNumber: value.catalog_number,
      // The album's own discs; bonus discs come with some editions only.
      tracks: value.discs.filter(disc => !disc.bonus_id).flatMap(disc => disc.tracks)
        .map(track => ({ name: localName(track.title, track.titles), url: absolute(`/tracks/${track.id}`), duration: track.duration })),
      rating: value.rating !== null ? { value: value.rating, count: value.rating_count } : null,
      isAdult: value.is_adult,
    })
  },
})
</script>
