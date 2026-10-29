<template>
  <div class="relative w-full overflow-hidden bg-card">
    <img
      v-if="background"
      v-img-fade
      :src="background"
      alt=""
      class="absolute inset-0 h-full w-full scale-105 object-cover opacity-30 blur-[3px]"
    >

    <div class="container relative mx-auto max-w-6xl px-4 pb-7 pt-5 md:px-12 md:py-10 lg:px-20 xl:px-8 2xl:max-w-7xl">
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-10">
        <div class="flex shrink-0 items-center">
          <button type="button" class="cursor-zoom-in" :disabled="!album.cover" @click="$emit('open-cover')">
            <img
              v-if="coverUrl"
              v-img-fade
              :src="coverUrl"
              :alt="album.title"
              class="h-44 w-44 rounded-md object-cover sm:h-56 sm:w-56 md:h-60 md:w-60 lg:h-72 lg:w-72 xl:h-80 xl:w-80 2xl:h-96 2xl:w-96"
            >
            <div v-else class="flex h-44 w-44 items-center justify-center rounded-md bg-sunken text-faint sm:h-56 sm:w-56 md:h-60 md:w-60 lg:h-72 lg:w-72">
              <Disc3 :size="64" />
            </div>
          </button>
        </div>

        <div class="flex w-full flex-1 items-stretch">
          <div class="flex w-full flex-col justify-between rounded-lg bg-card/60 p-3 backdrop-blur sm:p-4 md:p-6">
            <div>
              <h1 class="mb-1 wrap-break-word text-center text-lg font-bold leading-snug text-title md:text-left md:text-xl lg:text-2xl">
                {{ shownTitle }}
              </h1>
              <p v-if="originalTitle" class="mb-2 text-center text-sm text-body md:text-left">{{ originalTitle }}</p>

              <!-- The byline: the publishers, else the 署名艺术家, every one of them here; then the 署名艺术家 under
                   publishers. Who labels, sells or makes the album is in 专辑信息. -->
              <div class="mb-4 flex flex-col items-center gap-1 md:mb-5 md:items-start">
                <p v-if="album.byline" class="flex flex-wrap items-center justify-center gap-x-1 text-sm text-body md:justify-start">
                  <component :is="album.byline.role === 'publisher' ? Building2 : UserRound" :size="13" class="text-meta" />
                  <template v-for="(artist, index) in album.byline.artists" :key="`${artist.id}:${artist.name}`">
                    <NuxtLink v-if="artist.id" :to="`/artists/${artist.id}`" class="link link-muted">{{ artist.name }}</NuxtLink>
                    <span v-else>{{ artist.name }}</span>
                    <span v-if="index < album.byline.artists.length - 1" class="text-meta">,</span>
                  </template>
                </p>
                <p v-if="bylineArtists.length" class="flex flex-wrap items-center justify-center gap-x-1 text-xs text-body md:justify-start">
                  <UserRound :size="12" class="text-meta" />
                  <template v-for="(artist, index) in bylineArtists" :key="artist.key">
                    <NuxtLink v-if="artist.id" :to="`/artists/${artist.id}`" class="link link-muted">{{ artist.name }}</NuxtLink>
                    <span v-else>{{ artist.name }}</span>
                    <span v-if="index < bylineArtists.length - 1" class="text-meta">,</span>
                  </template>
                </p>
              </div>

              <div class="flex flex-col items-center gap-y-1.5 text-sm text-body md:items-start">
                <div class="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <span v-if="album.catalog_number" class="flex items-center gap-1 font-mono text-xs text-body">
                    <Hash :size="12" class="shrink-0 text-meta" />
                    {{ album.catalog_number }}
                  </span>
                  <CatalogPendingBadge v-if="album.is_pending" />
                  <span class="inline-flex items-center gap-1 rounded bg-btn px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-btn-content">
                    <Tag :size="9" class="shrink-0" />
                    {{ typeLabel }}
                  </span>
                  <span
                    v-for="format in specialFormats"
                    :key="format"
                    class="rounded bg-title px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-page"
                  >{{ enumLabel('disc_format', format) }}</span>
                  <span
                    v-for="category in album.categories"
                    :key="category"
                    class="rounded px-2 py-1 text-[10px] font-semibold text-body ring-1 ring-inset ring-line"
                  >{{ enumLabel('album_category', category) }}</span>
                </div>

                <span v-if="album.release_date" class="flex items-center gap-1.5">
                  <Calendar :size="14" class="shrink-0 text-meta" />
                  {{ formatDate(album.release_date, album.release_date_precision) }}
                  <NuxtLink v-if="album.release_event" :to="`/albums?event=${album.release_event.id}`" class="text-meta transition-colors hover:text-primary">
                    · {{ album.release_event.name }}
                  </NuxtLink>
                </span>

                <div class="flex flex-wrap items-center justify-center gap-4 md:justify-start">
                  <span v-if="album.disc_count > 0" class="flex items-center gap-1.5">
                    <Disc3 :size="14" class="shrink-0 text-meta" />
                    {{ $t('content_display.disc_count', { count: album.disc_count }) }}
                  </span>
                  <span v-if="album.track_count > 0" class="flex items-center gap-1.5">
                    <Music :size="14" class="shrink-0 text-meta" />
                    {{ $t('content_display.track_count', { count: album.track_count }) }}
                  </span>
                  <span v-if="album.duration > 0" class="flex items-center gap-1.5">
                    <Clock :size="14" class="shrink-0 text-meta" />
                    {{ formatDuration(album.duration) }}
                  </span>
                </div>

              </div>
            </div>

            <div v-if="album.streaming.length" class="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <p class="flex shrink-0 items-center gap-1 text-sm text-body"><Headphones :size="13" class="text-meta" />{{ $t('content_display.streaming') }}</p>
              <div class="flex flex-wrap items-center gap-1.5">
                <UiButton
                  v-for="link in album.streaming"
                  :key="link.id"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  class="group gap-1"
                  :style="hoveredLinkId === link.id ? { backgroundColor: getStreamingProvider(link.provider?.name ?? '').color + '22' } : {}"
                  @mouseenter="hoveredLinkId = link.id"
                  @mouseleave="hoveredLinkId = null"
                >
                  <Icon
                    :name="getStreamingProvider(link.provider?.name ?? '').icon"
                    size="16"
                    class="shrink-0 transition-all duration-200"
                    :class="hoveredLinkId === link.id ? '' : 'opacity-70'"
                    :style="hoveredLinkId === link.id
                      ? { color: getStreamingProvider(link.provider?.name ?? '').color, filter: 'none' }
                      : { filter: 'grayscale(1)' }"
                  />
                  {{ providerName(link.provider?.name ?? '') }}
                </UiButton>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <UiButton
                :variant="isFavorited ? 'danger' : 'danger-soft'"
                size="sm"
                class="flex-1 lg:flex-none"
                :disabled="isToggling || (album.is_pending && !isFavorited)"
                :title="album.is_pending ? $t('pending.locked') : undefined"
                @click="toggleLike"
              >
                <Heart class="size-4 shrink-0" :fill="isFavorited ? 'currentColor' : 'none'" />
                {{ $t(isFavorited ? 'content_display.liked' : 'content_display.like') }}
              </UiButton>
              <UiButton
                :to="isAuthenticated ? `/contribute/album/${album.id}` : `/auth/login?redirect=/contribute/album/${album.id}`"
                size="sm"
                :icon="Edit"
                class="flex-1 lg:flex-none"
              >
                {{ $t('common.edit') }}
              </UiButton>
              <UiButton :to="`/albums/${album.id}/versions`" size="sm" :icon="History" :title="$t('versions.title')">
                <span class="hidden sm:inline">{{ $t('versions.short', { version: album.version }) }}</span>
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Album } from '~/types/album'
import { getStreamingProvider } from '~/utils/streamingProviders'
import { Building2, Calendar, Clock, Disc3, Edit, Hash, Headphones, Heart, History, Music, Tag, UserRound } from '@lucide/vue'

const props = defineProps<{ album: Album }>()
const emit = defineEmits<{ 'open-cover': [], favorited: [value: boolean] }>()

const { t, te } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavoriteAlbum } = useFavorites()
const route = useRoute()
const { localName, formatDate, formatDuration, enumLabel } = useCatalogDisplay()

const shownTitle = computed(() => localName(props.album.title, props.album.titles))
const originalTitle = computed(() => shownTitle.value !== props.album.title ? props.album.title : '')
/** The album-wide 署名艺术家 when the byline names the publishers instead, each once. */
const bylineArtists = computed(() => {
  if (props.album.byline?.role !== 'publisher') return []
  const seen = new Map<string, { key: string, id: number | null, name: string }>()
  for (const credit of props.album.credits) {
    if (credit.role !== 'artist') continue
    const name = credit.credited_as || credit.artist?.name || ''
    const key = credit.artist ? `id:${credit.artist.id}` : `name:${name}`
    if (name && !seen.has(key)) seen.set(key, { key, id: credit.artist?.id ?? null, name })
  }
  return [...seen.values()]
})
const coverUrl = computed(() => props.album.cover?.medium_url || props.album.image_url)
const background = computed(() => props.album.banner_url || coverUrl.value)
const typeLabel = computed(() => te(`albums.type.${props.album.type}`) ? t(`albums.type.${props.album.type}`) : props.album.type)
/** Formats worth a badge: anything but a plain CD (vinyl, cassette, SACD …). */
const specialFormats = computed(() => props.album.disc_formats.filter(format => format !== 'cd'))

const providerName = (name: string) => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

const hoveredLinkId = ref<number | null>(null)
const isFavorited = ref(props.album.is_favorited)
// The page may swap in a fresher copy of the album after this has rendered (revisit cache).
watch(() => props.album.is_favorited, (value) => { isFavorited.value = value })
const isToggling = ref(false)

const toggleLike = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  if (isToggling.value) return
  isToggling.value = true
  try {
    isFavorited.value = (await setFavoriteAlbum(props.album.id, !isFavorited.value)).favorited
    emit('favorited', isFavorited.value)
  } catch {
    // 401 已由 api 插件处理
  } finally {
    isToggling.value = false
  }
}
</script>
