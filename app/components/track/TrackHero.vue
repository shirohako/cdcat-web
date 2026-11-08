<template>
  <div class="relative w-full overflow-hidden bg-card">
    <img
      v-if="cover"
      v-img-fade
      :src="cover"
      alt=""
      class="absolute inset-0 h-full w-full scale-105 object-cover opacity-30 blur-[3px]"
    >

    <div class="container relative mx-auto max-w-6xl px-4 pb-7 pt-5 md:px-12 md:py-10 lg:px-20 xl:px-8 2xl:max-w-7xl">
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-10">
        <NuxtLink v-if="track.album" :to="`/albums/${track.album.id}#track-${track.id}`" class="flex shrink-0 items-center" :title="track.album.title">
          <img
            v-if="cover"
            v-img-fade
            :src="cover"
            :alt="track.album.title"
            class="h-36 w-36 rounded-md object-cover sm:h-44 sm:w-44 md:h-48 md:w-48 lg:h-56 lg:w-56"
          >
          <div v-else class="flex h-36 w-36 items-center justify-center rounded-md bg-sunken text-faint sm:h-44 sm:w-44 md:h-48 md:w-48 lg:h-56 lg:w-56">
            <Music :size="56" />
          </div>
        </NuxtLink>

        <div class="flex w-full flex-1 items-stretch">
          <div class="flex w-full flex-col justify-between rounded-lg bg-card/60 p-3 backdrop-blur sm:p-4 md:p-6">
            <div>
              <p v-if="track.album" class="mb-2 flex flex-wrap items-center justify-center gap-x-1.5 text-xs text-body md:justify-start">
                <Disc3 :size="13" class="shrink-0 text-meta" />
                <NuxtLink :to="`/albums/${track.album.id}`" class="link link-muted font-medium">{{ albumTitle }}</NuxtLink>
                <span class="text-meta">·</span>
                <span class="font-mono">{{ position }}</span>
              </p>

              <h1 class="mb-1 wrap-break-word text-center text-lg font-bold leading-snug text-title md:text-left md:text-xl lg:text-2xl">{{ shownTitle }}</h1>
              <p v-if="originalTitle" class="mb-2 text-center text-sm text-body md:text-left">{{ originalTitle }}</p>
              <!-- The track's own 艺术家 (else the album's byline), each with the 客串 that belong to it and the
                   word printed before it (utils/artistLine): "Xeudo Code, Xeno feat. eili", "awfuless meets PODA"; each
                   name opens its artist's card -->
              <p v-if="line.lines.length || line.left.length" ref="artistLine" class="flex flex-wrap items-center justify-center gap-x-1 text-sm text-body md:justify-start">
                <UserRound :size="13" class="text-meta" />
                <span>
                  <template v-for="(item, index) in line.lines" :key="index">
                    <CatalogArtistName :name="item.item.name" :artist-id="item.item.id" :artist-name="item.item.artistName" card />
                    <template v-if="item.guests.length">
                      <span class="text-meta"> feat. </span>
                      <template v-for="(guest, guestIndex) in item.guests" :key="guestIndex">
                        <CatalogArtistName :name="guest.name" :artist-id="guest.id" :artist-name="guest.artistName" card /><span v-if="guestIndex < item.guests.length - 1" class="text-meta">, </span>
                      </template>
                    </template>
                    <span v-if="index < line.lines.length - 1" class="text-meta">{{ between(line.lines[index + 1]!.item) }}</span>
                  </template>
                  <!-- 客串 that belong to none of these names (the byline stands in, or a credit of another role) -->
                  <template v-if="line.left.length">
                    <span v-if="line.lines.length" class="text-meta">{{ line.lines.at(-1)!.guests.length ? ', ' : ' feat. ' }}</span>
                    <template v-for="(guest, guestIndex) in line.left" :key="guestIndex">
                      <CatalogArtistName :name="guest.name" :artist-id="guest.id" :artist-name="guest.artistName" card /><span v-if="guestIndex < line.left.length - 1" class="text-meta">, </span>
                    </template>
                  </template>
                </span>
              </p>

              <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-body md:justify-start">
                <span v-if="track.duration" class="flex items-center gap-1.5">
                  <Clock :size="14" class="shrink-0 text-meta" />{{ formatDuration(track.duration) }}
                </span>
                <span v-if="track.has_lyrics" class="flex items-center gap-1.5">
                  <FileText :size="14" class="shrink-0 text-meta" />{{ $t('lyrics_ui.lyrics') }}<span v-if="track.translations_count" class="text-teal-600 dark:text-teal-400">+{{ track.translations_count }}</span>
                </span>
                <span v-if="track.is_instrumental" class="rounded bg-btn px-2 py-1 text-10 font-bold uppercase tracking-wider text-btn-content">{{ $t('content_display.instrumental') }}</span>
                <span v-if="track.isrc" class="font-mono text-xs text-body">ISRC {{ track.isrc }}</span>
                <CatalogPendingBadge v-if="track.is_pending" />
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-1.5">
              <UiButton
                :variant="isFavorited ? 'danger' : 'danger-soft'"
                size="sm"
                class="flex-1 lg:flex-none"
                :disabled="isToggling || (track.is_pending && !isFavorited)"
                :title="track.is_pending ? $t('pending.locked') : undefined"
                @click="toggleFavorite"
              >
                <Heart class="size-4 shrink-0" :fill="isFavorited ? 'currentColor' : 'none'" />
                {{ $t(isFavorited ? 'content_display.liked' : 'content_display.like') }}<span v-if="favoritesCount" class="opacity-70">{{ favoritesCount }}</span>
              </UiButton>
              <UiButton
                :to="isAuthenticated ? editPath : `/auth/login?redirect=${editPath}`"
                variant="outline"
                size="sm"
                :icon="Edit"
                class="flex-1 lg:flex-none"
                :title="$t('tracks.edit_hint')"
              >
                {{ $t('common.edit') }}
              </UiButton>
              <div class="flex gap-1.5 md:ml-auto">
                <UiButton
                  :to="previous ? `/tracks/${previous.id}` : undefined"
                  :disabled="!previous"
                  size="sm"
                  :icon="ChevronLeft"
                  :title="previous ? previous.title : undefined"
                  :aria-label="$t('tracks.previous')"
                >
                  <span class="hidden sm:inline">{{ $t('tracks.previous') }}</span>
                </UiButton>
                <UiButton
                  :to="next ? `/tracks/${next.id}` : undefined"
                  :disabled="!next"
                  size="sm"
                  :icon-right="ChevronRight"
                  :title="next ? next.title : undefined"
                  :aria-label="$t('tracks.next')"
                >
                  <span class="hidden sm:inline">{{ $t('tracks.next') }}</span>
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UiHoverCard :anchor="artistCard.anchor.value" :label="hoverArtist?.name" :text-inset="16" class="w-76 p-0!" @enter="artistCard.enter" @leave="artistCard.leave" @close="artistCard.close">
      <ArtistHoverCard v-if="hoverArtist" :artist="hoverArtist" :roles="hoverRoles" />
    </UiHoverCard>
  </div>
</template>

<script setup lang="ts">
import type { TrackDetail } from '~/types/album'
import type { CatalogCredit } from '~/types/catalog'
import type { TracklistArtist, TracklistArtistRole } from '~/utils/tracklistView'
import { ARTIST_ROLE, attachGuests, FEATURING_ROLE } from '~/utils/artistLine'
import { ChevronLeft, ChevronRight, Clock, Disc3, Edit, FileText, Heart, Music, UserRound } from '@lucide/vue'

/** The top of a track page: the album's cover and banner, the title, favorite, edit and moving to the next track. */
const props = defineProps<{
  track: TrackDetail
  previous: { id: number, title: string } | null
  next: { id: number, title: string } | null
  /** The album has more than one disc, so the position names it. */
  multiDisc: boolean
}>()
const emit = defineEmits<{ favorited: [value: boolean] }>()

const { isAuthenticated } = useAuth()
const { setFavoriteTrack } = useFavorites()
const route = useRoute()
const { localName, formatDuration } = useCatalogDisplay()
const { roleName, roleCategory } = useCatalogSchema()

const shownTitle = computed(() => localName(props.track.title, props.track.titles))
const originalTitle = computed(() => shownTitle.value !== props.track.title ? props.track.title : '')
const albumTitle = computed(() => props.track.album?.title ?? '')
const credits = computed(() => props.track.credits ?? [])
type LineName = { creditId: number | null, parentId: number | null, id: number | null, name: string, artistName: string | null, joinPhrase: string | null }
const named = (credit: CatalogCredit): LineName => ({
  creditId: credit.id, parentId: credit.parent_id ?? null, id: credit.artist?.id ?? null, name: credit.credited_as || credit.artist?.name || '', artistName: credit.artist?.name ?? null, joinPhrase: credit.join_phrase ?? null,
})
const between = (next: LineName) => next.joinPhrase ? ` ${next.joinPhrase} ` : ', '
/** The artist line (utils/artistLine): the track's own 艺术家, else the album's byline, each with its 客串. */
const line = computed(() => {
  const own = credits.value.filter(credit => credit.role === ARTIST_ROLE).map(named)
  const lead = own.length
    ? own
    : (props.track.album?.byline?.artists ?? []).map(artist => ({ creditId: null, parentId: null, id: artist.id, name: artist.name, artistName: null, joinPhrase: null }))
  const featuring = credits.value.filter(credit => credit.role === FEATURING_ROLE).map(named)
  return attachGuests(lead, featuring, item => item.creditId, guest => guest.parentId)
})

// The artist hover card of the line, as in the tracklist, with the artist's roles on this track.
const artistLine = ref<HTMLElement | null>(null)
const artistCard = useHoverCard(artistLine, '[data-artist-card]')
const cardArtists = computed(() => {
  const known = new Map<number, TracklistArtist>()
  for (const artist of props.track.album?.byline?.artists ?? []) {
    if (artist.id) known.set(artist.id, { id: artist.id, name: artist.name })
  }
  for (const credit of credits.value) {
    if (credit.artist) known.set(credit.artist.id, credit.artist)
  }
  return known
})
const hoverArtist = computed(() => cardArtists.value.get(Number(artistCard.current.value?.dataset.artistCard)) ?? null)
const hoverRoles = computed<TracklistArtistRole[]>(() => [...new Set(credits.value.filter(credit => credit.artist && credit.artist.id === hoverArtist.value?.id).map(credit => credit.role))]
  .map(role => ({ role, label: roleName(role), category: roleCategory(role), count: 1 })))
const cover = computed(() => props.track.album?.image_url ?? null)
const number = computed(() => props.track.number_label || String(props.track.track_number).padStart(2, '0'))
const position = computed(() => props.multiDisc ? `Disc ${props.track.disc_number} · ${number.value}` : number.value)
// Tracks are edited with their album.
const editPath = computed(() => `/contribute/album/${props.track.album_id}`)

const isFavorited = ref(props.track.is_favorited)
const favoritesCount = ref(props.track.favorites_count)
watch(() => props.track, (track) => {
  isFavorited.value = track.is_favorited
  favoritesCount.value = track.favorites_count
})
const isToggling = ref(false)

const toggleFavorite = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (isToggling.value) return
  isToggling.value = true
  try {
    const favorited = (await setFavoriteTrack(props.track.id, !isFavorited.value)).favorited
    if (favorited !== isFavorited.value) favoritesCount.value += favorited ? 1 : -1
    isFavorited.value = favorited
    emit('favorited', favorited)
  } catch {
    // A 401 is handled by the api plugin.
  } finally {
    isToggling.value = false
  }
}
</script>
