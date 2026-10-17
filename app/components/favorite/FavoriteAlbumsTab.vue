<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader" class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="albums.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:disc-3" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">{{ $t('collection_components.empty_albums') }}</p>
      <p class="text-sm text-gray-400 mb-6">{{ $t('collection_components.empty_albums_hint') }}</p>
      <NuxtLink to="/albums" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        {{ $t('collection_components.browse_albums') }}
      </NuxtLink>
    </div>

    <!-- Albums List -->
    <div v-else>
      <div class="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
        <div
          v-for="album in albums"
          :key="album.id"
          class="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4
                 hover:shadow-md hover:ring-black/10 transition-all duration-200"
        >
          <div class="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-4">
            <!-- Cover -->
            <NuxtLink
              :to="`/albums/${album.id}`"
              class="shrink-0"
              :aria-label="$t('collection_components.view_album', { name: album.title })"
            >
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5">
                <img
                  v-if="album.image_url"
                  :src="album.image_url"
                  :alt="album.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                  <Icon name="lucide:disc-3" class="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>
            </NuxtLink>

            <!-- Info -->
            <div class="min-w-0 flex-1 text-center sm:text-left">
              <NuxtLink
                :to="`/albums/${album.id}`"
                class="block font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-700 transition-colors line-clamp-2"
              >
                {{ album.title }}
              </NuxtLink>

              <p v-if="album.artists?.length" class="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">
                {{ album.artists.map(a => a.pivot?.display_name || a.name).join(', ') }}
              </p>

              <div class="mt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-gray-400">
                <span v-if="album.release_date">{{ $t('collection_components.release_date', { date: formatDate(album.release_date) }) }}</span>
                <span v-if="album.favorited_at">{{ $t('collection_components.favorited_date', { date: formatDate(album.favorited_at) }) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center justify-center sm:justify-end gap-2 sm:gap-1">
              <NuxtLink
                :to="`/albums/${album.id}`"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-gray-100 flex-none"
                :aria-label="$t('collection_components.view_album', { name: album.title })"
                :title="$t('collection_components.view')"
              >
                <Icon name="lucide:arrow-right" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </NuxtLink>
              <button
                type="button"
                :disabled="!!unlikeLoading[album.id]"
                @click="handleToggle(album.id)"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-gray-100 flex-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                :title="$t(unliked[album.id] ? 'collection_components.unfavorited' : 'collection_components.remove_favorite')"
              >
                <Icon
                  :name="unliked[album.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  :class="unliked[album.id] ? 'text-gray-400' : 'text-red-600'"
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
import type { FavoriteAlbum } from '~/types/favorites'

const { getFavoriteAlbums, setFavoriteAlbum } = useFavorites()
const { formatDate } = useLocaleFormatting()

const albums = ref<FavoriteAlbum[]>([])
const page = ref(1)
const perPage = 15
const totalItems = ref(0)
const isLoading = ref(false)

const totalPages = computed(() => Math.ceil(totalItems.value / perPage))

const loadData = async () => {
  isLoading.value = true
  try {
    const response = await getFavoriteAlbums(page.value, perPage)
    albums.value = response.albums
    totalItems.value = response.pagination.total
  } catch (error) {
    console.error('Failed to load albums:', error)
  } finally {
    isLoading.value = false
  }
}

const unliked = ref<Record<number, boolean>>({})
const unlikeLoading = ref<Record<number, boolean>>({})

const handleToggle = async (albumId: number) => {
  if (unlikeLoading.value[albumId]) return
  unlikeLoading.value = { ...unlikeLoading.value, [albumId]: true }
  try {
    const result = await setFavoriteAlbum(albumId, !!unliked.value[albumId])
    unliked.value = { ...unliked.value, [albumId]: !result.favorited }
  } catch (error) {
    console.error('Failed to toggle album favorite:', error)
  } finally {
    const { [albumId]: _, ...rest } = unlikeLoading.value
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
