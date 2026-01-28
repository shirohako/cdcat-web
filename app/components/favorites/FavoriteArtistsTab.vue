<template>
  <div class="p-8">
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
      <!-- List View (one artist per row) -->
      <div class="space-y-4 mb-8">
        <div
          v-for="artist in artists"
          :key="artist.id"
          class="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4
                 hover:shadow-md hover:ring-black/10 transition-all duration-200"
        >
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <!-- Avatar -->
            <NuxtLink
              :to="`/artists/${artist.artistId}`"
              class="shrink-0"
              :aria-label="`查看艺术家：${artist.artistName}`"
            >
              <div class="w-12 h-12 rounded-full overflow-hidden bg-linear-to-br from-purple-200 to-blue-200 ring-1 ring-black/5">
                <img
                  v-if="artist.avatar"
                  :src="artist.avatar"
                  :alt="artist.artistName"
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
                :to="`/artists/${artist.artistId}`"
                class="block font-semibold text-gray-900 truncate hover:text-blue-700 transition-colors"
              >
                {{ artist.artistName }}
              </NuxtLink>

              <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span class="inline-flex items-center gap-1 text-sm text-gray-600">
                  <Icon name="lucide:users" class="w-4 h-4 text-gray-400" />
                  {{ formatFollowers(artist.followersCount) }} 粉丝
                </span>
                <span class="text-xs text-gray-400">
                  已喜欢：{{ formatDate(artist.createdAt) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 w-full sm:w-auto flex items-center justify-end gap-2">
              <NuxtLink
                :to="`/artists/${artist.artistId}`"
                class="inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 flex-none"
                :aria-label="`查看艺术家：${artist.artistName}`"
                title="查看"
              >
                <Icon name="lucide:arrow-right" class="w-5 h-5 text-gray-600" />
              </NuxtLink>
              <button
                type="button"
                :disabled="!!unliked[artist.id] || !!unlikeLoading[artist.id]"
                @click="handleUnlike(artist.id)"
                class="inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 flex-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                :title="unliked[artist.id] ? '已取消喜欢' : '取消喜欢'"
              >
                <Icon
                  :name="unliked[artist.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                  class="w-5 h-5"
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
import type { FavoriteArtist, FavoritesStats } from '~/types/favorites'

defineProps<{
  stats: FavoritesStats
}>()

const { getFavoriteArtists, removeFavoriteItem } = useFavorites()

const artists = ref<FavoriteArtist[]>([])
const page = ref(1)
const pageSize = 12
const totalItems = ref(0)
const isLoading = ref(false)

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize))

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

const formatFollowers = (count?: number) => {
  if (!count) return '0'
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  }
  return count.toString()
}

const loadData = async () => {
  isLoading.value = true
  try {
    const response = await getFavoriteArtists(page.value, pageSize)
    artists.value = response.data
    totalItems.value = response.total
  } catch (error) {
    console.error('Failed to load artists:', error)
  } finally {
    isLoading.value = false
  }
}

const unliked = ref<Record<number, boolean>>({})
const unlikeLoading = ref<Record<number, boolean>>({})

const setLoading = (favoriteId: number, pending: boolean) => {
  if (pending) {
    unlikeLoading.value = { ...unlikeLoading.value, [favoriteId]: true }
    return
  }
  const { [favoriteId]: _removed, ...rest } = unlikeLoading.value
  unlikeLoading.value = rest
}

const handleUnlike = async (favoriteId: number) => {
  if (unliked.value[favoriteId] || unlikeLoading.value[favoriteId]) return
  setLoading(favoriteId, true)
  unliked.value = { ...unliked.value, [favoriteId]: true }
  try {
    await removeFavoriteItem(favoriteId, 'artist')
  } catch (error) {
    console.error('Failed to unlike artist:', error)
    const { [favoriteId]: _removed, ...rest } = unliked.value
    unliked.value = rest
  } finally {
    setLoading(favoriteId, false)
  }
}

const previousPage = () => {
  if (page.value > 1) {
    page.value -= 1
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value += 1
  }
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
