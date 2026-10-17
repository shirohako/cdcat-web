<template>
  <div class="relative w-full overflow-hidden bg-white">
    <img
      v-if="background"
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
              :src="coverUrl"
              :alt="album.title"
              class="h-44 w-44 rounded-md object-cover shadow-2xl sm:h-56 sm:w-56 md:h-60 md:w-60 lg:h-72 lg:w-72 xl:h-80 xl:w-80 2xl:h-96 2xl:w-96"
            >
            <div v-else class="flex h-44 w-44 items-center justify-center rounded-md bg-gray-100 text-gray-300 shadow-2xl sm:h-56 sm:w-56 md:h-60 md:w-60 lg:h-72 lg:w-72">
              <Disc3 :size="64" />
            </div>
          </button>
        </div>

        <div class="flex w-full flex-1 items-stretch">
          <div class="flex w-full flex-col justify-between rounded-lg p-3 backdrop-blur-[4.45px] sm:p-4 md:p-6" style="opacity: 0.94; background-color: rgba(198, 175, 175, 0.3)">
            <div>
              <h1 class="mb-1 wrap-break-word text-center text-lg font-bold leading-snug text-gray-900 md:text-left md:text-xl lg:text-2xl">
                {{ shownTitle }}
              </h1>
              <p v-if="originalTitle" class="mb-2 text-center text-sm text-gray-600 md:text-left">{{ originalTitle }}</p>

              <!-- Artists, joined as printed: "A feat. B", "A × B" -->
              <p v-if="album.artists.length" class="mb-4 text-center text-sm text-gray-700 md:mb-5 md:text-left">
                <template v-for="(artist, index) in album.artists" :key="artist.id">
                  <NuxtLink :to="`/artists/${artist.id}`" class="inline-flex items-center gap-1 hover:text-gray-900 hover:underline">
                    <UserRound v-if="index === 0" :size="13" class="text-gray-500" />
                    {{ artist.credited_as || artist.name }}
                  </NuxtLink>
                  <span v-if="index < album.artists.length - 1" class="whitespace-pre text-gray-500">{{ artist.join_phrase || ', ' }}</span>
                </template>
              </p>

              <div class="flex flex-col items-center gap-y-1.5 text-sm text-gray-700 md:items-start">
                <div class="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <span v-if="album.catalog_number" class="flex items-center gap-1 font-mono text-xs text-gray-600">
                    <Hash :size="12" class="shrink-0 text-gray-400" />
                    {{ album.catalog_number }}
                  </span>
                  <CatalogPendingBadge v-if="album.is_pending" />
                  <span class="inline-flex items-center gap-1 rounded bg-gray-800/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-700">
                    <Tag :size="9" class="shrink-0" />
                    {{ typeLabel }}
                  </span>
                  <span
                    v-for="format in specialFormats"
                    :key="format"
                    class="rounded bg-gray-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                  >{{ enumLabel('disc_format', format) }}</span>
                  <span
                    v-for="category in album.categories"
                    :key="category"
                    class="rounded bg-white/60 px-2 py-1 text-[10px] font-semibold text-gray-600"
                  >{{ enumLabel('album_category', category) }}</span>
                </div>

                <span v-if="album.release_date" class="flex items-center gap-1.5">
                  <Calendar :size="14" class="shrink-0 text-gray-500" />
                  {{ formatDate(album.release_date, album.release_date_precision) }}
                  <NuxtLink v-if="album.release_event" :to="`/albums?event=${album.release_event.id}`" class="text-gray-500 hover:text-gray-800 hover:underline">
                    · {{ album.release_event.name }}
                  </NuxtLink>
                </span>

                <div class="flex flex-wrap items-center justify-center gap-4 md:justify-start">
                  <span v-if="album.disc_count > 0" class="flex items-center gap-1.5">
                    <Disc3 :size="14" class="shrink-0 text-gray-500" />
                    {{ $t('content_display.disc_count', { count: album.disc_count }) }}
                  </span>
                  <span v-if="album.track_count > 0" class="flex items-center gap-1.5">
                    <Music :size="14" class="shrink-0 text-gray-500" />
                    {{ $t('content_display.track_count', { count: album.track_count }) }}
                  </span>
                  <span v-if="album.duration > 0" class="flex items-center gap-1.5">
                    <Clock :size="14" class="shrink-0 text-gray-500" />
                    {{ formatDuration(album.duration) }}
                  </span>
                </div>

                <p v-if="album.labels.length" class="flex flex-wrap items-center justify-center gap-x-2 text-xs text-gray-600 md:justify-start">
                  <Building2 :size="13" class="shrink-0 text-gray-500" />
                  <NuxtLink v-for="label in album.labels" :key="`${label.id}-${label.role}`" :to="`/labels/${label.id}`" class="hover:text-gray-900 hover:underline">
                    {{ label.credited_as || label.name }}<span v-if="label.role !== 'label'" class="text-gray-400"> ({{ enumLabel('label_role', label.role) }})</span>
                  </NuxtLink>
                </p>
              </div>
            </div>

            <div v-if="album.streaming.length" class="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <p class="flex shrink-0 items-center gap-1 text-sm text-gray-600"><Headphones :size="13" class="text-gray-500" />{{ $t('content_display.streaming') }}</p>
              <div class="flex flex-wrap items-center gap-1.5">
                <a
                  v-for="link in album.streaming"
                  :key="link.id"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group inline-flex items-center gap-1 rounded-sm bg-black/6 px-2.5 py-1.5 text-[11px] font-medium text-gray-800 transition-colors"
                  :style="hoveredLinkId === link.id ? { backgroundColor: getStreamingProvider(link.provider?.name ?? '').color + '22' } : {}"
                  @mouseenter="hoveredLinkId = link.id"
                  @mouseleave="hoveredLinkId = null"
                >
                  <Icon
                    :name="getStreamingProvider(link.provider?.name ?? '').icon"
                    size="16"
                    class="shrink-0 transition-all duration-200"
                    :style="hoveredLinkId === link.id
                      ? { color: getStreamingProvider(link.provider?.name ?? '').color, filter: 'none' }
                      : { filter: 'grayscale(1) brightness(0.25)' }"
                  />
                  {{ providerName(link.provider?.name ?? '') }}
                </a>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <button
                class="btn btn-xs h-7 min-h-0 flex-1 gap-1.5 lg:h-8 lg:flex-none lg:px-5"
                :class="isFavorited ? 'border-red-500 bg-red-500 text-white hover:bg-red-600' : 'btn-outline border-red-400 text-red-600 hover:bg-red-50'"
                :disabled="isToggling || (album.is_pending && !isFavorited)"
                :title="album.is_pending ? $t('pending.locked') : undefined"
                @click="toggleLike"
              >
                <Heart :size="13" :fill="isFavorited ? 'currentColor' : 'none'" />
                {{ $t(isFavorited ? 'content_display.liked' : 'content_display.like') }}
              </button>
              <NuxtLink
                :to="isAuthenticated ? `/contribute/album/${album.id}` : `/auth/login?redirect=/contribute/album/${album.id}`"
                class="btn btn-xs btn-outline h-7 min-h-0 flex-1 gap-1.5 border-gray-400 text-gray-700 hover:bg-gray-50 lg:h-8 lg:flex-none lg:px-5"
              >
                <Edit :size="13" />
                {{ $t('common.edit') }}
              </NuxtLink>
              <NuxtLink
                :to="`/albums/${album.id}/versions`"
                class="btn btn-xs btn-ghost h-7 min-h-0 gap-1.5 text-gray-600 lg:h-8"
                :title="$t('versions.title')"
              >
                <History :size="13" />
                <span class="hidden sm:inline">{{ $t('versions.short', { version: album.version }) }}</span>
              </NuxtLink>
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
defineEmits<{ 'open-cover': [] }>()

const { t, te } = useI18n()
const { isAuthenticated } = useAuth()
const { setFavoriteAlbum } = useFavorites()
const route = useRoute()
const { localName, formatDate, formatDuration, enumLabel } = useCatalogDisplay()

const shownTitle = computed(() => localName(props.album.title, props.album.titles))
const originalTitle = computed(() => shownTitle.value !== props.album.title ? props.album.title : '')
const coverUrl = computed(() => props.album.cover?.medium_url || props.album.image_url)
const background = computed(() => props.album.banner_url || coverUrl.value)
const typeLabel = computed(() => te(`albums.type.${props.album.type}`) ? t(`albums.type.${props.album.type}`) : props.album.type)
/** Formats worth a badge: anything but a plain CD (vinyl, cassette, SACD …). */
const specialFormats = computed(() => props.album.disc_formats.filter(format => format !== 'cd'))

const providerName = (name: string) => name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

const hoveredLinkId = ref<number | null>(null)
const isFavorited = ref(props.album.is_favorited)
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
  } catch {
    // 401 已由 api 插件处理
  } finally {
    isToggling.value = false
  }
}
</script>
