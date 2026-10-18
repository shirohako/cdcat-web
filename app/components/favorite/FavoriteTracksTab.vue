<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State: only until the first page is in -->
    <SkeletonRows v-if="isLoading && !loaded" page :count="5" cards />

    <!-- Empty State -->
    <div v-else-if="tracks.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:music" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">{{ $t('collection_components.empty_tracks') }}</p>
      <p class="text-sm text-gray-400 mb-6">{{ $t('collection_components.empty_tracks_hint') }}</p>
      <NuxtLink to="/albums" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        {{ $t('collection_components.browse_albums') }}
      </NuxtLink>
    </div>

    <!-- Tracks List: dimmed while another page loads -->
    <div v-else class="space-y-3 transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :inert="isLoading">
      <!-- Tracks Table (Desktop) -->
      <div class="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">{{ $t('collection_components.track') }}</th>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">{{ $t('collection_components.album') }}</th>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">{{ $t('collection_components.favorited_at') }}</th>
              <th class="px-6 py-3 text-center font-semibold text-gray-700">{{ $t('collection_components.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="track in tracks"
              :key="track.id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <!-- Track Title -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <Icon name="lucide:music" class="w-5 h-5 text-gray-400" />
                  <div class="min-w-0">
                    <p class="font-medium text-gray-900 truncate">{{ track.title }}</p>
                  </div>
                </div>
              </td>

              <!-- Album -->
              <td class="px-6 py-4 text-gray-600 truncate">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-md overflow-hidden bg-gray-100 ring-1 ring-black/5 shrink-0">
                    <img
                      v-if="track.album?.image_url"
                      :src="track.album.image_url"
                      :alt="track.album?.title || track.title"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                      <Icon name="lucide:disc-3" class="w-4 h-4" />
                    </div>
                  </div>
                  <NuxtLink
                    v-if="track.album"
                    :to="`/albums/${track.album.id}`"
                    class="text-blue-600 hover:underline truncate"
                  >
                    {{ track.album.title }}
                  </NuxtLink>
                  <span v-else class="text-gray-400">-</span>
                </div>
              </td>

              <!-- Created At -->
              <td class="px-6 py-4 text-gray-600 text-sm">
                {{ formatDate(track.favorited_at) }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    :disabled="!!unlikeLoading[track.id]"
                    @click="handleToggle(track.id)"
                    class="transition-colors p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    :title="$t(unliked[track.id] ? 'collection_components.unfavorited' : 'collection_components.remove_favorite')"
                  >
                    <Icon
                      :name="unliked[track.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                      class="w-4 h-4"
                      :class="unliked[track.id] ? 'text-gray-400' : 'text-red-600'"
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tracks Cards (Mobile) -->
      <div class="md:hidden space-y-3">
        <div
          v-for="track in tracks"
          :key="track.id"
          class="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200"
        >
          <div class="flex items-center gap-3">
            <!-- Cover -->
            <div class="w-12 h-12 rounded-md overflow-hidden bg-gray-100 ring-1 ring-black/5 shrink-0">
              <img
                v-if="track.album?.image_url"
                :src="track.album.image_url"
                :alt="track.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                <Icon name="lucide:disc-3" class="w-6 h-6" />
              </div>
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-gray-900 text-sm line-clamp-1">{{ track.title }}</p>
              <p class="text-xs text-gray-600 mt-0.5 line-clamp-1">
                <NuxtLink
                  v-if="track.album"
                  :to="`/albums/${track.album.id}`"
                  class="hover:underline"
                >
                  {{ track.album.title }}
                </NuxtLink>
                <span v-else>{{ $t('collection_components.no_album') }}</span>
              </p>
              <div class="flex gap-2 mt-2 text-xs text-gray-500">
                <span>{{ formatDate(track.favorited_at) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center gap-1">
              <button
                type="button"
                :disabled="!!unliked[track.id] || !!unlikeLoading[track.id]"
                @click="handleToggle(track.id)"
                class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                :title="$t(unliked[track.id] ? 'collection_components.unfavorited' : 'collection_components.remove_favorite')"
              >
                <Icon
                  :name="unliked[track.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                  class="w-4 h-4"
                  :class="unliked[track.id] ? 'text-gray-400' : 'text-red-600'"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CommonPagination
        class="mt-4"
        v-model:page="page"
        :total-pages="totalPages"
        :disabled="isLoading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FavoriteTrack } from '~/types/favorites'

const { getFavoriteTracks, setFavoriteTrack } = useFavorites()
const { formatDate } = useLocaleFormatting()

const tracks = ref<FavoriteTrack[]>([])
const page = ref(1)
const perPage = 15
const totalItems = ref(0)
// True from the start, so the empty state doesn't show before the first load.
const isLoading = ref(true)
const loaded = ref(false)

const totalPages = computed(() => Math.ceil(totalItems.value / perPage))

const loadData = async () => {
  isLoading.value = true
  try {
    const response = await getFavoriteTracks(page.value, perPage)
    tracks.value = response.tracks
    totalItems.value = response.pagination.total
  } catch (error) {
    console.error('Failed to load tracks:', error)
  } finally {
    isLoading.value = false
    loaded.value = true
  }
}

const unliked = ref<Record<number, boolean>>({})
const unlikeLoading = ref<Record<number, boolean>>({})

const handleToggle = async (trackId: number) => {
  if (unlikeLoading.value[trackId]) return
  unlikeLoading.value = { ...unlikeLoading.value, [trackId]: true }
  try {
    const result = await setFavoriteTrack(trackId, !!unliked.value[trackId])
    unliked.value = { ...unliked.value, [trackId]: !result.favorited }
  } catch (error) {
    console.error('Failed to toggle track favorite:', error)
  } finally {
    const { [trackId]: _, ...rest } = unlikeLoading.value
    unlikeLoading.value = rest
  }
}

watch(() => page.value, async () => {
  await loadData()
})

// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) loadData()
else onMounted(loadData)
</script>
