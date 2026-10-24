<template>
  <div class="min-h-screen">
    <div v-if="album && !mergedInto" :class="revealClass">
      <AlbumHero :album="album" @open-cover="gallery?.openCover()" @favorited="value => mutate(current => ({ ...current, is_favorited: value }))" />
      <CatalogPendingBanner :pending="album.is_pending" :revision="album.pending_revision" />

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div class="space-y-8 lg:col-span-2">
            <AlbumDescriptions v-if="album.description" :description="album.description" />

            <AlbumTracklist :album-id="album.id" :discs="album.discs" :bonuses="album.bonuses" :languages="album.tracklist_languages" :locked="album.is_pending" />

            <AlbumProducts :products="album.products" :discs="album.discs" :images="album.images" />

            <AlbumBonuses :bonuses="album.bonuses" :products="album.products" :discs="album.discs" :images="album.images" />

            <AlbumGallery ref="gallery" :images="album.images" :products="album.products" :bonuses="album.bonuses" :discs="album.discs" />

            <AlbumCredits :credits="album.credits" />

            <!-- Albums awaiting review can only be viewed: reviews and tracking open after approval. -->
            <AlbumReviews v-if="!album.is_pending" ref="reviews" :album-id="album.id" @changed="refresh" />
          </div>

          <div class="space-y-6 lg:col-span-1">
            <AlbumArtistCard :artists="album.artists" />
            <div v-if="album.is_pending" class="rounded-xl border border-dashed border-warning/30 bg-warning/10 p-4 text-sm text-body">
              {{ $t('pending.locked') }}
            </div>
            <AlbumTracking v-else :album-id="String(album.id)" :initial-tracking="album.user_tracking" @tracked="setTracking" />
            <AlbumStats :views-count="album.views_count" :favorites-count="album.favorites_count" :tracking-stats="album.tracking_stats" />
            <AlbumRankings v-if="!album.is_pending" :rating="album.rating" :rating-count="album.rating_count" :distribution="album.rating_distribution" @write-review="reviews?.openEditor()" />
            <AlbumInfo :album="album" />
            <AlbumLinks :links="album.links" />
            <AlbumArticles :articles="album.articles ?? []" />
            <DiscussionRelatedDiscussions v-if="!album.is_pending" :id="album.id" type="album" />
            <AlbumContributors :contributors="album.contributors" />
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
import { ldDate, musicAlbumLd } from '~/utils/structuredData'
import { composeDescription, descriptionLength, plainText } from '~/utils/seoText'

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

const setTracking = (tracking: TrackingStatus | null) => mutate((current) => {
  const now = new Date().toISOString()
  return { ...current, user_tracking: tracking ? { created_at: current.user_tracking?.created_at ?? now, updated_at: now, status: tracking } : null }
})

const gallery = ref<{ openCover: () => void } | null>(null)
const reviews = ref<{ openEditor: () => void } | null>(null)

const shownTitle = computed(() => album.value ? localName(album.value.title, album.value.titles) : '')
/** The artists as printed: "A feat. B". */
const artistLine = computed(() => (album.value?.artists ?? [])
  .map((artist, index, all) => `${artist.credited_as || artist.name}${index < all.length - 1 ? artist.join_phrase || ', ' : ''}`).join(''))

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
      artists: value.artists.map(artist => ({ name: artist.credited_as || artist.name, url: absolute(`/artists/${artist.id}`), type: artist.type })),
      labels: value.labels.filter(label => label.role === 'label' || label.role === 'publisher')
        .map(label => ({ name: label.credited_as || label.name, url: absolute(`/labels/${label.id}`) })),
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
