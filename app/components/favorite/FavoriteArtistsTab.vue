<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State: only until the first page is in -->
    <SkeletonRows v-if="isLoading && !loaded" page :count="5" thumb="round" cards />

    <!-- Empty State -->
    <UiEmpty
      v-else-if="artists.length === 0"
      :title="$t('collection_components.empty_artists')"
      :description="$t('collection_components.empty_artists_hint')"
      icon="lucide:mic-2"
    >
      <template #actions>
        <UiButton to="/artists" variant="primary" size="sm" icon="lucide:search">
          {{ $t('collection_components.browse_artists') }}
        </UiButton>
      </template>
    </UiEmpty>

    <!-- Artists List: dimmed while another page loads -->
    <div v-else class="transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :inert="isLoading">
      <div class="mb-4 space-y-3 sm:mb-5 sm:space-y-4">
        <div
          v-for="artist in artists"
          :key="artist.id"
          class="rounded-xl bg-sunken p-3 sm:p-4"
        >
          <div class="flex items-center gap-3 sm:gap-4">
            <!-- Avatar -->
            <NuxtLink
              :to="`/artists/${artist.id}`"
              class="shrink-0"
              :aria-label="$t('collection_components.view_artist', { name: artist.name })"
            >
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-sunken ring-1 ring-line">
                <img
                  v-if="artist.image_url"
                  :src="artist.image_url"
                  :alt="artist.name"
                  class="w-full h-full object-cover"
                >
                <div v-else class="w-full h-full flex items-center justify-center text-faint">
                  <Icon name="lucide:mic-2" class="w-6 h-6" />
                </div>
              </div>
            </NuxtLink>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <NuxtLink
                :to="`/artists/${artist.id}`"
                class="block font-semibold text-sm text-title hover:text-primary transition-colors truncate"
              >
                {{ artist.name }}
              </NuxtLink>

              <p v-if="artist.favorited_at" class="text-xs text-meta mt-0.5">
                {{ $t('collection_components.liked_date', { date: formatDate(artist.favorited_at) }) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center justify-end gap-1 sm:gap-2">
              <UiButton
                :to="`/artists/${artist.id}`"
                icon="lucide:arrow-right"
                :label="$t('collection_components.view_artist', { name: artist.name })"
                :tooltip="$t('collection_components.view')"
                size="sm"
                round
                class="flex-none"
              />
              <UiButton
                :icon="unliked[artist.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                :icon-class="unliked[artist.id] ? 'size-4 text-meta' : 'size-4 text-red-600 dark:text-red-400'"
                :label="$t(unliked[artist.id] ? 'collection_components.unfavorited' : 'collection_components.remove_favorite')"
                :disabled="!!unlikeLoading[artist.id]"
                size="sm"
                round
                class="flex-none"
                @click="handleToggle(artist.id)"
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
import type { FavoriteArtist } from '~/types/favorites'

const { getFavoriteArtists, setFavoriteArtist } = useFavorites()
const { formatDate } = useLocaleFormatting()

const artists = ref<FavoriteArtist[]>([])
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
    const response = await getFavoriteArtists(page.value, perPage)
    artists.value = response.artists
    totalItems.value = response.pagination.total
  } catch (error) {
    console.error('Failed to load artists:', error)
  } finally {
    isLoading.value = false
    loaded.value = true
  }
}

const unliked = ref<Record<number, boolean>>({})
const unlikeLoading = ref<Record<number, boolean>>({})

const handleToggle = async (artistId: number) => {
  if (unlikeLoading.value[artistId]) return
  unlikeLoading.value = { ...unlikeLoading.value, [artistId]: true }
  try {
    const result = await setFavoriteArtist(artistId, !!unliked.value[artistId])
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

// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) loadData()
else onMounted(loadData)
</script>
