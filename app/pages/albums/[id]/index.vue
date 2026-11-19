<template>
  <div class="min-h-screen">
    <!-- Nothing to render when the answer is the album's Markdown (see asMarkdown). -->
    <template v-if="asMarkdown" />

    <AlbumDetail
      v-else-if="album && !mergedInto"
      :class="revealClass"
      :album="album"
      @favorited="setAlbumFavorite"
      @track-favorited="setTrackFavorite"
      @tracked="setTracking"
      @changed="refresh"
    />

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
import { creditedNames, isAlternateTake, oneLine } from '~/utils/seoText'
import { RELEASE_ROLES } from '~/types/album'
import { bylineText } from '~/utils/albumByline'

const route = useRoute()
const { t } = useI18n()
const { localName, formatDate, enumLabel } = useCatalogDisplay()
const { withOriginal, sentence, count, own, albumTitle, songTitle, listing, fill } = useSeoText()
const absolute = useSiteUrl()
const { markdown } = useAlbumExport()

// `/albums/18.md` is the album as Markdown, for language models and anyone who wants the text (docs/seo in the API
// repo). It is this same route, whose id then carries the suffix; a request for `text/markdown` gets it too.
const routeId = String(route.params.id)
const suffix = routeId.endsWith('.md') ? '.md' : ''
const albumId = suffix ? routeId.slice(0, -suffix.length) : routeId
const asMarkdown = useMarkdownRequest(!!suffix)

const { data: album, status, error, refresh, mutate, revealClass } = await usePageAPI<Album>(`/v1/albums/${albumId}`, { notFound: true })

// A merged album answers with the kept one; show its address instead of the old id. The check after the
// await covers the server (a 301) and cached data; the watch covers data that arrives after client-side navigation.
const mergedInto = computed(() => album.value && String(album.value.id) !== albumId ? album.value.id : null)
if (mergedInto.value) {
  await navigateTo({ path: `/albums/${mergedInto.value}${suffix}`, query: route.query }, { replace: true, redirectCode: 301 })
}
else if (asMarkdown && album.value) {
  sendMarkdown(await markdown(album.value), absolute(`/albums/${album.value.id}`))
}
watch(mergedInto, (id) => {
  if (id) navigateTo({ path: `/albums/${id}`, query: route.query }, { replace: true })
})

/** The album liked or unliked: its state and, when that changed, the 喜欢 count in the stats card. */
const setAlbumFavorite = (favorited: boolean) => mutate(current => current.is_favorited === favorited
  ? current
  : { ...current, is_favorited: favorited, favorites_count: Math.max(0, (current.favorites_count ?? 0) + (favorited ? 1 : -1)) })

/** A track favourited from the tracklist: its heart and count change in the page data, so a revisit shows them. */
const setTrackFavorite = (trackId: number, favorited: boolean) => mutate(current => ({
  ...current,
  discs: current.discs.map(disc => ({
    ...disc,
    tracks: disc.tracks.map(track => (track.id === trackId && track.is_favorited !== favorited
      ? { ...track, is_favorited: favorited, favorites_count: Math.max(0, track.favorites_count + (favorited ? 1 : -1)) }
      : track)),
  })),
}))

// The visitor's own pick moves the counts as the server's will: one off the status they leave, one onto the new one.
const setTracking = (tracking: TrackingStatus | null, previous: TrackingStatus | null) => mutate((current) => {
  const now = new Date().toISOString()
  const stats = { ...current.tracking_stats }
  if (previous) stats[previous] = Math.max(0, stats[previous] - 1)
  if (tracking) stats[tracking] += 1
  return { ...current, tracking_stats: stats, user_tracking: tracking ? { created_at: current.user_tracking?.created_at ?? now, updated_at: now, status: tracking } : null }
})

const shownTitle = computed(() => album.value ? localName(album.value.title, album.value.titles) : '')
/** The byline for the page title: the publishers, else up to three 艺术家, else Various Artists. */
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

/** Page titles shorter than this ("one - 鹿乃") also give the year and the kind of release. */
const SHORT_TITLE = 16
const pageTitle = computed(() => {
  const value = album.value
  if (!value) return undefined
  const title = [withOriginal(shownTitle.value, value.title), artistLine.value].filter(Boolean).join(' - ')
  if ([...title].length >= SHORT_TITLE) return title
  const type = enumLabel('album_type', value.type)
  // "同人アルバム", "同人音乐专辑"; otherwise "アルバム", "音乐专辑" (Chinese names it music, the others don't).
  // A drama CD or a radio show is not music: "同人广播剧", "广播剧".
  const spoken = value.type === 'drama' || value.type === 'radio'
  const kind = value.categories.includes('doujin')
    ? t(spoken ? 'seo.title.album_doujin_spoken' : 'seo.title.album_doujin', { type })
    : spoken ? type : t('seo.title.album_music', { type })
  const year = value.release_date?.slice(0, 4)
  return year ? t('seo.title.album_dated', { title, year, kind }) : t('seo.title.album_kind', { title, kind })
})
usePageSeo({
  title: () => pageTitle.value,
  // What the album is and who made it, then what people search it by: its works, songs and the people on it.
  description: () => {
    const value = album.value
    if (!value) return undefined
    const type = enumLabel('album_type', value.type)
    const title = albumTitle(shownTitle.value)
    const tracks = value.discs.filter(disc => !disc.bonus_id).sort((a, b) => a.position - b.position)
      .flatMap(disc => [...disc.tracks].sort((a, b) => a.track_number - b.track_number))
    return fill([
      sentence([
        artistLine.value ? t('seo.album.lead', { title, artists: artistLine.value, type }) : t('seo.album.lead_bare', { title, type }),
        value.release_date && t('seo.album.released', { date: formatDate(value.release_date, value.release_date_precision) }),
        value.release_event && t('seo.album.event', { event: value.release_event.name }),
        value.catalog_number && t('seo.album.catalog', { number: value.catalog_number }),
        count('seo.album.tracks', value.track_count),
      ], { capitalize: false }),
      listing('seo.album.works', value.entries.map(entry => albumTitle(entry.name)), 2),
      listing('seo.album.tracklist', tracks.map(track => localName(track.title, track.titles)).filter(name => !isAlternateTake(name)).map(songTitle), 5),
      listing('seo.album.people', creditedNames([
        ...value.credits.filter(credit => credit.role === 'artist' || !(RELEASE_ROLES as readonly string[]).includes(credit.role)),
        ...tracks.flatMap(track => track.credits),
      ], value.byline?.artists.map(artist => artist.name)), 5),
      { cut: own(oneLine(value.description)) },
    ])
  },
  image: () => album.value?.cover?.medium_url || album.value?.image_url,
  card: () => album.value?.share_card_url,
  // QQ's card: the title, the artists (the type without any) and the cover, as music apps' cards show a song.
  chatCard: () => album.value && {
    title: shownTitle.value,
    description: artistLine.value || enumLabel('album_type', album.value.type),
    image: album.value.cover?.thumbnail_url || album.value.image_url,
  },
  type: 'music.album',
  // The page's own address, also when it was opened as `….md` in the browser.
  path: () => (album.value ? `/albums/${album.value.id}` : undefined),
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
      description: oneLine(value.description),
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

// Where tools that read for a language model find the Markdown form.
useHead(() => ({
  link: album.value && !album.value.is_pending
    ? [{ rel: 'alternate', type: 'text/markdown', href: absolute(`/albums/${album.value.id}.md`), key: 'markdown' }]
    : [],
}))
</script>
