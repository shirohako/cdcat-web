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
              <!-- The track's own 署名艺术家, else the album's byline -->
              <p v-if="artists.length" class="flex flex-wrap items-center justify-center gap-x-1 text-sm text-body md:justify-start">
                <UserRound :size="13" class="text-meta" />
                <template v-for="(artist, index) in artists" :key="`${artist.id}:${artist.name}`">
                  <NuxtLink v-if="artist.id" :to="`/artists/${artist.id}`" class="link link-muted">{{ artist.name }}</NuxtLink>
                  <span v-else>{{ artist.name }}</span>
                  <span v-if="index < artists.length - 1" class="text-meta">,</span>
                </template>
              </p>

              <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-body md:justify-start">
                <span v-if="track.duration" class="flex items-center gap-1.5">
                  <Clock :size="14" class="shrink-0 text-meta" />{{ formatDuration(track.duration) }}
                </span>
                <span v-if="track.has_lyrics" class="flex items-center gap-1.5">
                  <FileText :size="14" class="shrink-0 text-meta" />{{ $t('lyrics_ui.lyrics') }}<span v-if="track.translations_count" class="text-teal-600 dark:text-teal-400">+{{ track.translations_count }}</span>
                </span>
                <span v-if="track.is_instrumental" class="rounded bg-btn px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-btn-content">{{ $t('content_display.instrumental') }}</span>
                <span v-if="track.isrc" class="font-mono text-xs text-body">ISRC {{ track.isrc }}</span>
                <CatalogPendingBadge v-if="track.is_pending" />
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-1.5">
              <button
                type="button"
                class="btn btn-xs h-7 min-h-0 flex-1 gap-1.5 lg:h-8 lg:flex-none lg:px-5"
                :class="isFavorited ? 'border-red-500 bg-red-500 text-white hover:bg-red-600 dark:border-red-400 dark:bg-red-400 dark:text-red-950 dark:hover:bg-red-500' : 'btn-outline border-red-400 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/15'"
                :disabled="isToggling || (track.is_pending && !isFavorited)"
                :title="track.is_pending ? $t('pending.locked') : undefined"
                @click="toggleFavorite"
              >
                <Heart :size="13" :fill="isFavorited ? 'currentColor' : 'none'" />
                {{ $t(isFavorited ? 'content_display.liked' : 'content_display.like') }}<span v-if="favoritesCount" class="opacity-70">{{ favoritesCount }}</span>
              </button>
              <NuxtLink
                :to="isAuthenticated ? editPath : `/auth/login?redirect=${editPath}`"
                class="btn btn-xs btn-outline h-7 min-h-0 flex-1 gap-1.5 lg:h-8 lg:flex-none lg:px-5"
                :title="$t('tracks.edit_hint')"
              >
                <Edit :size="13" />
                {{ $t('common.edit') }}
              </NuxtLink>
              <div class="flex gap-1.5 md:ml-auto">
                <component
                  :is="previous ? NuxtLink : 'span'"
                  :to="previous ? `/tracks/${previous.id}` : undefined"
                  class="btn btn-xs btn-ghost h-7 min-h-0 gap-1 lg:h-8"
                  :class="{ 'btn-disabled opacity-40': !previous }"
                  :title="previous ? previous.title : undefined"
                  :aria-label="$t('tracks.previous')"
                >
                  <ChevronLeft :size="14" /><span class="hidden sm:inline">{{ $t('tracks.previous') }}</span>
                </component>
                <component
                  :is="next ? NuxtLink : 'span'"
                  :to="next ? `/tracks/${next.id}` : undefined"
                  class="btn btn-xs btn-ghost h-7 min-h-0 gap-1 lg:h-8"
                  :class="{ 'btn-disabled opacity-40': !next }"
                  :title="next ? next.title : undefined"
                  :aria-label="$t('tracks.next')"
                >
                  <span class="hidden sm:inline">{{ $t('tracks.next') }}</span><ChevronRight :size="14" />
                </component>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrackDetail } from '~/types/album'
import { NuxtLink } from '#components'
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

const shownTitle = computed(() => localName(props.track.title, props.track.titles))
const originalTitle = computed(() => shownTitle.value !== props.track.title ? props.track.title : '')
const albumTitle = computed(() => props.track.album?.title ?? '')
const artists = computed(() => {
  const own = (props.track.credits ?? []).filter(credit => credit.role === 'artist')
    .map(credit => ({ id: credit.artist?.id ?? null, name: credit.credited_as || credit.artist?.name || '' }))
  return own.length ? own : (props.track.album?.byline?.artists ?? [])
})
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
