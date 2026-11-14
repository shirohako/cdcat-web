<template>
  <div class="min-h-screen">
    <div v-if="track && !mergedInto" :class="revealClass">
      <TrackHero :track="track" :previous="previous" :next="next" :multi-disc="multiDisc" @favorited="value => mutate(current => ({ ...current, is_favorited: value }))" />
      <CatalogPendingBanner :pending="track.is_pending" />

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div class="space-y-8 lg:col-span-2">
            <CatalogSection :title="$t('lyrics_ui.lyrics_and_translations')" :icon="FileText">
              <div class="px-5 py-4"><LyricsPanel :key="track.id" :track-id="track.id" /></div>
            </CatalogSection>

            <TrackOriginals :originals="track.originals ?? []" :derived="track.derived_tracks ?? []" />
          </div>

          <div class="space-y-6 lg:col-span-1">
            <TrackAlbumTracklist :tracks="track.album_tracks ?? []" :current-id="track.id" />
            <AlbumCredits :credits="track.credits ?? []" />
            <CatalogSection v-if="track.titles?.length || track.attributes?.length" :title="$t('album.section.information')" :icon="Info">
              <div class="space-y-4 px-5 py-4 text-sm">
                <CatalogTitleList v-if="track.titles?.length" :titles="track.titles" />
                <CatalogAttributeList v-if="track.attributes?.length" :attributes="track.attributes" />
              </div>
            </CatalogSection>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="status === 'error'" class="flex min-h-screen items-center justify-center">
      <div class="alert alert-error max-w-md"><span>{{ $t('common.load_failed') }}</span></div>
    </div>

    <!-- Also while moving on to the track this one was mapped to. -->
    <SkeletonCatalogDetail v-else hero="track" :sections="2" />
  </div>
</template>

<script setup lang="ts">
import type { TrackDetail } from '~/types/album'
import { FileText, Info } from '@lucide/vue'
import { musicRecordingLd } from '~/utils/structuredData'
import { composeDescription, descriptionLength } from '~/utils/seoText'
import { lyricLines } from '~/utils/lyricText'

const route = useRoute()
const { t, locale } = useI18n()
const { localName, formatDuration } = useCatalogDisplay()
const { withOriginal, sentence, list } = useSeoText()
const absolute = useSiteUrl()

const { data: track, status, error, mutate, revealClass } = await usePageAPI<TrackDetail>(`/v1/tracks/${route.params.id}`, { notFound: true })

// Tracks of a merged album answer with the track they were mapped to: a 301 on the server (and with
// cached data), a replace once the data arrives after client-side navigation.
const mergedInto = computed(() => track.value && String(track.value.id) !== String(route.params.id) ? track.value.id : null)
if (mergedInto.value) {
  await navigateTo({ path: `/tracks/${mergedInto.value}`, query: route.query }, { replace: true, redirectCode: 301 })
}
watch(mergedInto, (id) => {
  if (id) navigateTo({ path: `/tracks/${id}`, query: route.query }, { replace: true })
})

/** The neighbours in the album's disc and track order, across discs. */
const neighbour = (step: -1 | 1) => computed(() => {
  const list = track.value?.album_tracks ?? []
  const item = list[list.findIndex(item => item.id === track.value?.id) + step]
  return item && list.some(entry => entry.id === track.value?.id) ? { id: item.id, title: localName(item.title, item.titles) } : null
})
const previous = neighbour(-1)
const next = neighbour(1)
const multiDisc = computed(() => new Set((track.value?.album_tracks ?? []).map(item => item.disc_number)).size > 1)

const shownTitle = computed(() => track.value ? localName(track.value.title, track.value.titles) : '')

/** Everyone credited on the track, once each. */
const creditedArtists = computed(() => {
  const seen = new Map<number, string>()
  for (const credit of track.value?.credits ?? []) if (credit.artist && !seen.has(credit.artist.id)) seen.set(credit.artist.id, credit.credited_as || credit.artist.name)
  return [...seen].map(([id, name]) => ({ id, name }))
})

/** The people credited in these roles, once each, for the title and structured data. */
const creditedAs = (roles: string[]) => {
  const seen = new Map<number, { name: string, url: string, type?: string | null }>()
  for (const credit of track.value?.credits ?? []) {
    if (credit.artist && roles.includes(credit.role) && !seen.has(credit.artist.id)) {
      seen.set(credit.artist.id, { name: credit.credited_as || credit.artist.name, url: absolute(`/artists/${credit.artist.id}`), type: credit.artist.type })
    }
  }
  return [...seen.values()]
}
/** Who performs the track: its 艺术家, else its vocalists. */
const performers = computed(() => {
  const artists = creditedAs(['artist'])
  return artists.length ? artists : creditedAs(['vocals'])
})

// The lyric texts the panel below has loaded; the original's first lines go into the description.
const lyricTexts = useLyricTexts(Number(route.params.id))
const lyricsOriginal = computed(() => Object.values(lyricTexts.value).find(lyric => lyric.kind === 'original') ?? null)
const lyricsLead = computed(() => (lyricsOriginal.value
  ? lyricLines(lyricsOriginal.value.content, lyricsOriginal.value.format).filter(Boolean).slice(0, 4).join(' / ')
  : ''))

usePageSeo({
  // A track with lyrics is searched for as "title + lyrics", often with who sings it: the title says both. Without
  // lyrics the page stays out of search results (see noindex) and keeps the plain title.
  title: () => {
    const value = track.value
    if (!value) return undefined
    const name = withOriginal(shownTitle.value, value.title)
    return value.has_lyrics
      ? [t('seo.title.track_lyrics', { title: name }), list(performers.value.slice(0, 2).map(artist => artist.name))].filter(Boolean).join(' - ')
      : [name, value.album?.title].filter(Boolean).join(' - ')
  },
  description: () => {
    const value = track.value
    if (!value) return undefined
    const lead = sentence([
      value.album && t('seo.track.from', { album: value.album.title }),
      creditedArtists.value.length && t('seo.track.artists', { artists: list(creditedArtists.value.slice(0, 4).map(artist => artist.name)) }),
      value.duration && t('seo.track.duration', { time: formatDuration(value.duration) }),
      value.originals?.length && t('seo.track.original', { titles: list(value.originals.map(original => original.title)) }),
      value.has_lyrics ? t('seo.track.lyrics') : value.is_instrumental && t('seo.track.instrumental'),
    ])
    return composeDescription(lead, lyricsLead.value, descriptionLength(locale.value))
  },
  image: () => track.value?.album?.image_url,
  type: 'music.song',
  // A track without lyrics says nothing its album's page doesn't: only tracks with lyrics are offered to search
  // engines (docs/seo in the API repo). The page itself stays, and the album links to it.
  noindex: () => track.value?.is_pending || !track.value?.has_lyrics,
  adult: () => track.value?.album?.is_adult,
  error,
  breadcrumbs: () => track.value?.album
    ? [{ name: t('menu.album'), path: '/albums' }, { name: track.value.album.title, path: `/albums/${track.value.album.id}` }, { name: shownTitle.value, path: `/tracks/${track.value.id}` }]
    : null,
  jsonLd: () => track.value && musicRecordingLd({
    name: shownTitle.value,
    alternateNames: [track.value.title, ...(track.value.titles ?? []).map(title => title.title)],
    url: absolute(`/tracks/${track.value.id}`),
    duration: track.value.duration,
    isrc: track.value.isrc,
    album: track.value.album ? { name: track.value.album.title, url: absolute(`/albums/${track.value.album.id}`) } : null,
    artists: performers.value.length ? performers.value : creditedArtists.value.map(artist => ({ name: artist.name, url: absolute(`/artists/${artist.id}`) })),
    composers: creditedAs(['composer']),
    lyricists: creditedAs(['lyricist']),
    lyricsLanguage: lyricsOriginal.value?.language,
  }),
})
</script>
