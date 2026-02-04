<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader" class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="artists.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:mic-2" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">还没有喜欢任何艺术家</p>
      <p class="text-sm text-gray-400 mb-6">把喜欢的艺术家加入列表，随时查看</p>
      <NuxtLink to="/artists" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        浏览艺术家
      </NuxtLink>
    </div>

    <!-- Artists List -->
    <div v-else>
      <div class="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
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
              :aria-label="`查看艺术家：${artist.name}`"
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
                已喜欢：{{ formatDate(artist.favorited_at) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center justify-end gap-1 sm:gap-2">
              <NuxtLink
                :to="`/artists/${artist.id}`"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-gray-100 flex-none"
                :aria-label="`查看艺术家：${artist.name}`"
                title="查看"
              >
                <Icon name="lucide:arrow-right" class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </NuxtLink>
              <button
                type="button"
                :disabled="!!unlikeLoading[artist.id]"
                @click="handleUnlike(artist.id)"
                class="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors hover:bg-gray-100 flex-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                :title="unliked[artist.id] ? '已取消喜欢' : '取消喜欢'"
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

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
        <button
          :disabled="page === 1"
          @click="previousPage"
          class="btn btn-outline btn-sm gap-1"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4" />
          上一页
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="p in visiblePages"
            :key="p"
            @click="goToPage(p)"
            :class="[
              'btn btn-sm',
              page === p ? 'btn-primary' : 'btn-outline'
            ]"
          >
            {{ p }}
          </button>
        </div>

        <button
          :disabled="page === totalPages"
          @click="nextPage"
          class="btn btn-outline btn-sm gap-1"
        >
          下一页
          <Icon name="lucide:chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FavoriteArtist } from '~/types/favorites'

const { getFavoriteArtists, toggleFavoriteArtist } = useFavorites()

const artists = ref<FavoriteArtist[]>([])
const page = ref(1)
const perPage = 15
const totalItems = ref(0)
const isLoading = ref(false)

const totalPages = computed(() => Math.ceil(totalItems.value / perPage))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  const half = Math.floor(maxVisible / 2)

  let start = Math.max(1, page.value - half)
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

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

const handleUnlike = async (artistId: number) => {
  if (unliked.value[artistId] || unlikeLoading.value[artistId]) return
  unlikeLoading.value = { ...unlikeLoading.value, [artistId]: true }
  try {
    const result = await toggleFavoriteArtist(artistId)
    if (!result.favorited) {
      unliked.value = { ...unliked.value, [artistId]: true }
    }
  } catch (error) {
    console.error('Failed to unlike artist:', error)
  } finally {
    const { [artistId]: _, ...rest } = unlikeLoading.value
    unlikeLoading.value = rest
  }
}

const previousPage = () => {
  if (page.value > 1) page.value -= 1
}

const nextPage = () => {
  if (page.value < totalPages.value) page.value += 1
}

const goToPage = (p: number) => {
  page.value = p
}

watch(() => page.value, async () => {
  await loadData()
})

onMounted(() => {
  loadData()
})
</script>
