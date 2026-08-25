<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader" class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="artists.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:mic-2" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">{{ $t('collection_components.empty_artists') }}</p>
      <p class="text-sm text-gray-400 mb-6">{{ $t('collection_components.empty_artists_hint') }}</p>
      <NuxtLink to="/artists" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        {{ $t('collection_components.browse_artists') }}
      </NuxtLink>
    </div>

    <!-- Artists List -->
    <div v-else>
      <div class="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
        <div
          v-for="artist in artists"
          :key="artist.id"
          class="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-3 sm:p-4
                 hover:shadow-md hover:ring-black/10 transition-all duration-200"
        >
          <div class="flex items-center gap-3 sm:gap-4">
            <!-- Avatar -->
            <NuxtLink
              :to="`/artists/${artist.id}`"
              class="shrink-0"
              :aria-label="$t('collection_components.view_artist', { name: artist.name })"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-linear-to-br from-purple-200 to-blue-200 ring-1 ring-black/5">
                <img
                  v-if="artist.image_url"
                  :src="artist.image_url"
                  :alt="artist.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-white/40">
                  <Icon name="lucide:mic-2" class="w-6 h-6" />
                </div>
              </div>
            </NuxtLink>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <NuxtLink
                :to="`/artists/${artist.id}`"
                class="block font-semibold text-sm text-gray-900 hover:text-blue-700 transition-colors truncate"
              >
                {{ artist.name }}
              </NuxtLink>

              <p v-if="artist.favorited_at" class="text-xs text-gray-400 mt-0.5">
                {{ $t('collection_components.liked_date', { date: formatDate(artist.favorited_at) }) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center justify-end gap-1 sm:gap-2">
              <NuxtLink
                :to="`/artists/${artist.id}`"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-gray-100 flex-none"
                :aria-label="$t('collection_components.view_artist', { name: artist.name })"
                :title="$t('collection_components.view')"
              >
                <Icon name="lucide:arrow-right" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </NuxtLink>
              <button
                type="button"
                :disabled="!!unlikeLoading[artist.id]"
                @click="handleToggle(artist.id)"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-gray-100 flex-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                :title="$t(unliked[artist.id] ? 'collection_components.unfavorited' : 'collection_components.remove_favorite')"
              >
                <Icon
                  :name="unliked[artist.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  :class="unliked[artist.id] ? 'text-gray-400' : 'text-red-600'"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CommonPagination
        v-model:page="page"
        :total-pages="totalPages"
        :disabled="isLoading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FavoriteArtist } from '~/types/favorites'

const { getFavoriteArtists, toggleFavoriteArtist } = useFavorites()
const { formatDate } = useLocaleFormatting()

const artists = ref<FavoriteArtist[]>([])
const page = ref(1)
const perPage = 15
const totalItems = ref(0)
const isLoading = ref(false)

const totalPages = computed(() => Math.ceil(totalItems.value / perPage))

const loadData = async () => {
  isLoading.value = true
  try {
    const response = await getFavoriteArtists(page.value, perPage)
    artists.value = response.artists
    totalItems.value = response.pagination.total
  } catch (error) {
    console.error('Failed to load artists:', error)
  } finally {
    isLoading.value = false
  }
}

const unliked = ref<Record<number, boolean>>({})
const unlikeLoading = ref<Record<number, boolean>>({})

const handleToggle = async (artistId: number) => {
  if (unlikeLoading.value[artistId]) return
  unlikeLoading.value = { ...unlikeLoading.value, [artistId]: true }
  try {
    const result = await toggleFavoriteArtist(artistId)
    unliked.value = { ...unliked.value, [artistId]: !result.favorited }
  } catch (error) {
    console.error('Failed to toggle artist favorite:', error)
  } finally {
    const { [artistId]: _, ...rest } = unlikeLoading.value
    unlikeLoading.value = rest
  }
}

watch(() => page.value, async () => {
  await loadData()
})

onMounted(() => {
  loadData()
})
</script>
