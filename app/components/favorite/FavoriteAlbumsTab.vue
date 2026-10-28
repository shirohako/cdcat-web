<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State: only until the first page is in -->
    <SkeletonRows v-if="isLoading && !loaded" page :count="5" thumb="square" cards />

    <!-- Empty State -->
    <UiEmpty
      v-else-if="albums.length === 0"
      :title="$t('collection_components.empty_albums')"
      :description="$t('collection_components.empty_albums_hint')"
      icon="lucide:disc-3"
    >
      <template #actions>
        <UiButton to="/albums" variant="primary" size="sm" icon="lucide:search">
          {{ $t('collection_components.browse_albums') }}
        </UiButton>
      </template>
    </UiEmpty>

    <!-- Albums List: dimmed while another page loads -->
    <div v-else class="transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :inert="isLoading">
      <div class="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
        <div
          v-for="album in albums"
          :key="album.id"
          class="rounded-xl bg-sunken p-4"
        >
          <div class="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-4">
            <!-- Cover -->
            <NuxtLink
              :to="`/albums/${album.id}`"
              class="shrink-0"
              :aria-label="$t('collection_components.view_album', { name: album.title })"
            >
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-sunken ring-1 ring-line">
                <img
                  v-if="album.image_url"
                  :src="album.image_url"
                  :alt="album.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-faint">
                  <Icon name="lucide:disc-3" class="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>
            </NuxtLink>

            <!-- Info -->
            <div class="min-w-0 flex-1 text-center sm:text-left">
              <NuxtLink
                :to="`/albums/${album.id}`"
                class="block font-semibold text-sm sm:text-base text-title hover:text-primary transition-colors line-clamp-2"
              >
                {{ album.title }}
              </NuxtLink>

              <p v-if="album.byline" class="text-xs sm:text-sm text-body mt-1 line-clamp-1">
                {{ bylineText(album.byline, 1) }}
              </p>

              <div class="mt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-meta">
                <span v-if="album.release_date">{{ $t('collection_components.release_date', { date: formatDate(album.release_date) }) }}</span>
                <span v-if="album.favorited_at">{{ $t('collection_components.favorited_date', { date: formatDate(album.favorited_at) }) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center justify-center sm:justify-end gap-2 sm:gap-1">
              <UiButton
                :to="`/albums/${album.id}`"
                icon="lucide:arrow-right"
                :label="$t('collection_components.view_album', { name: album.title })"
                :tooltip="$t('collection_components.view')"
                size="sm"
                round
                class="flex-none"
              />
              <UiButton
                :icon="unliked[album.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                :icon-class="unliked[album.id] ? 'size-4 text-meta' : 'size-4 text-red-600 dark:text-red-400'"
                :label="$t(unliked[album.id] ? 'collection_components.unfavorited' : 'collection_components.remove_favorite')"
                :disabled="!!unlikeLoading[album.id]"
                size="sm"
                round
                class="flex-none"
                @click="handleToggle(album.id)"
              />
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
import { bylineText } from '~/utils/albumByline'

const { getFavoriteAlbums, setFavoriteAlbum } = useFavorites()
const { formatDate } = useLocaleFormatting()

const albums = ref<FavoriteAlbum[]>([])
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
    const response = await getFavoriteAlbums(page.value, perPage)
    albums.value = response.albums
    totalItems.value = response.pagination.total
  } catch (error) {
    console.error('Failed to load albums:', error)
  } finally {
    isLoading.value = false
    loaded.value = true
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

// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) loadData()
else onMounted(loadData)
</script>
