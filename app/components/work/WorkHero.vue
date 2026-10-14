<template>
  <div class="relative w-full overflow-hidden bg-white">
    <!-- Background Image -->
    <img
      :src="albumData.backgroundImage"
      alt="Background"
      class="absolute inset-0 w-full h-full object-cover opacity-30 blur-[3px] scale-105"
    />

    <!-- Content Container -->
    <div class="relative container mx-auto px-4 md:px-12 lg:px-20 xl:px-8 pt-5 pb-7 md:py-10 max-w-6xl 2xl:max-w-7xl">
      <div class="flex flex-col items-center md:flex-row md:items-stretch gap-6 md:gap-10 max-w-5xl mx-auto">

        <!-- Album Cover -->
        <div class="shrink-0 flex items-center">
          <img
            :src="albumData.coverImage"
            :alt="albumData.title"
            class="w-44 h-44 sm:w-56 sm:h-56 md:w-60 md:h-60 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96 object-cover rounded-md shadow-2xl"
          />
        </div>

        <!-- Album Info -->
        <div class="flex-1 flex items-stretch w-full">
          <div
            class="backdrop-blur-[4.45px] rounded-lg p-3 sm:p-4 md:p-6 flex flex-col justify-between w-full"
            style="opacity: 0.94; background-color: rgba(198, 175, 175, 0.3)"
          >
            <div>
              <!-- Title -->
              <h1 class="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 text-gray-900 leading-snug wrap-break-word text-center md:text-left">
                {{ albumData.title }}
              </h1>

              <!-- Artists -->
              <div v-if="albumData.artists && albumData.artists.length > 0" class="flex flex-wrap justify-center md:justify-start gap-2 text-sm text-gray-700 mb-4 md:mb-5">
                <NuxtLink
                  v-for="artist in albumData.artists"
                  :key="artist.id"
                  :to="`/artists/${artist.id}`"
                  class="inline-flex items-center gap-1 hover:underline hover:text-gray-900 transition-colors"
                >
                  <UserRound :size="13" class="text-gray-500" />
                  {{ artist.pivot?.display_name || artist.name }}
                </NuxtLink>
              </div>

              <!-- Meta info -->
              <div class="flex flex-col items-center md:items-start gap-y-1.5 text-sm text-gray-700">
                <!-- Type badge + Catalog on same line -->
                <div v-if="albumData.type || albumData.catalogNumber" class="flex items-center gap-2">
                  <span v-if="albumData.catalogNumber" class="flex items-center gap-1 font-mono text-xs text-gray-600">
                    <Hash :size="12" class="text-gray-400 shrink-0" />
                    {{ albumData.catalogNumber }}
                  </span>
                  <span
                    v-if="albumData.type"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-gray-800/10 text-gray-700"
                  >
                    <Tag :size="9" class="shrink-0" />
                    {{ formatType(albumData.type) }}
                  </span>
                </div>
                <span v-if="albumData.releaseDate" class="flex items-center gap-1.5">
                  <Calendar :size="14" class="text-gray-500 shrink-0" />
                  {{ albumData.releaseDate }}
                </span>
                <!-- Disc + Tracks grouped on same line -->
                <div class="flex items-center gap-4">
                  <span v-if="albumData.discCount > 0" class="flex items-center gap-1.5">
                    <Disc3 :size="14" class="text-gray-500 shrink-0" />
                    {{ $t('content_display.disc_count', { count: albumData.discCount }) }}
                  </span>
                  <span v-if="albumData.trackCount > 0" class="flex items-center gap-1.5">
                    <Music :size="14" class="text-gray-500 shrink-0" />
                    {{ $t('content_display.track_count', { count: albumData.trackCount }) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Streaming Links -->
            <div v-if="streaming && streaming.length > 0" class="mt-3 flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <p class="text-sm text-gray-600 shrink-0 flex items-center gap-1"><Headphones :size="13" class="text-gray-500" />{{ $t('content_display.streaming') }}</p>
              <div class="flex items-center gap-1.5 flex-wrap">
                <a
                  v-for="link in streaming"
                  :key="link.id"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-[11px] font-medium text-gray-800 bg-black/6 transition-colors"
                  :style="hoveredLinkId === link.id ? { backgroundColor: getStreamingProvider(link.provider?.name).color + '22' } : {}"
                  @mouseenter="hoveredLinkId = link.id"
                  @mouseleave="hoveredLinkId = null"
                >
                  <Icon
                    :name="getStreamingProvider(link.provider?.name).icon"
                    size="16"
                    class="shrink-0 transition-all duration-200"
                    :style="hoveredLinkId === link.id
                      ? { color: getStreamingProvider(link.provider?.name).color, filter: 'none' }
                      : { filter: 'grayscale(1) brightness(0.25)' }"
                  />
                  {{ formatProviderName(link.provider?.name) }}
                </a>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-3 flex gap-1.5">
              <button
                class="btn btn-xs flex-1 lg:flex-none lg:px-5 gap-1.5 h-7 lg:h-8 min-h-0"
                :class="isFavorited
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                  : 'btn-outline border-red-400 text-red-600 hover:bg-red-50'"
                :disabled="isToggling"
                @click="toggleLike"
              >
                <Heart :size="13" :fill="isFavorited ? 'currentColor' : 'none'" />
                {{ $t(isFavorited ? 'content_display.liked' : 'content_display.like') }}
              </button>
              <NuxtLink
                v-if="workId"
                :to="isAuthenticated ? `/contribute/work/${workId}` : `/auth/login?redirect=/contribute/work/${workId}`"
                class="btn btn-xs flex-1 lg:flex-none lg:px-5 h-7 lg:h-8 min-h-0 btn-outline border-gray-400 text-gray-700 hover:bg-gray-50 gap-1.5"
              >
                <Edit :size="13" />
                {{ $t('common.edit') }}
              </NuxtLink>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkHeroData } from '~/types/work'
import { getStreamingProvider } from '~/utils/streamingProviders'
import {
  Heart,
  Calendar,
  Disc3,
  Music,
  Hash,
  Edit,
  UserRound,
  Headphones,
  Tag,
} from "@lucide/vue"

const formatType = (type: string | null | undefined): string => {
  const map: Record<string, string> = {
    album: 'Album',
    single: 'Single',
    ep: 'EP',
    mini_album: 'Mini Album',
    compilation: 'Compilation',
    live: 'Live',
    soundtrack: 'Soundtrack',
    other: 'Other',
  }
  return map[type?.toLowerCase() ?? ''] ?? type ?? ''
}


const { isAuthenticated } = useAuth()
const { $api } = useNuxtApp()
const route = useRoute()

const props = withDefaults(defineProps<{
  albumData: WorkHeroData
  workId?: string | number | null
  initialFavorited?: boolean
  streaming?: { id: number; url: string; provider: { name: string } }[]
}>(), {
  workId: null,
  initialFavorited: false,
  streaming: () => [],
})

const formatProviderName = (name: string) =>
  name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const hoveredLinkId = ref<number | null>(null)
const isFavorited = ref(props.initialFavorited)
const isToggling = ref(false)

const toggleLike = async () => {
  if (!isAuthenticated.value) {
    await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  if (!props.workId || isToggling.value) return

  isToggling.value = true
  try {
    const result = await $api<{ favorited: boolean }>(`/v1/favorites/works/${props.workId}`, {
      method: 'POST',
    })
    isFavorited.value = result.favorited
  } catch {
    // 401 已由 api 插件处理
  } finally {
    isToggling.value = false
  }
}
</script>
