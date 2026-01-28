<template>
  <div class="p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader" class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="works.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:disc-3" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">还没有收藏任何专辑</p>
      <p class="text-sm text-gray-400 mb-6">发现你喜欢的专辑，添加到收藏吧</p>
      <NuxtLink to="/works" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        浏览专辑
      </NuxtLink>
    </div>

    <!-- Works List -->
    <div v-else>
      <!-- List View (one album per row) -->
      <div class="space-y-4 mb-8">
        <div
          v-for="work in works"
          :key="work.id"
          class="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4
                 hover:shadow-md hover:ring-black/10 transition-all duration-200"
        >
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <!-- Cover -->
            <NuxtLink
              :to="`/works/${work.workId}`"
              class="shrink-0 flex items-center gap-3"
              :aria-label="`查看专辑：${work.workTitle}`"
            >
              <div class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5">
                <img
                  v-if="work.cover"
                  :src="work.cover"
                  :alt="work.workTitle"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                  <Icon name="lucide:disc-3" class="w-10 h-10" />
                </div>
              </div>
            </NuxtLink>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <NuxtLink
                :to="`/works/${work.workId}`"
                class="block font-semibold text-gray-900 truncate hover:text-blue-700 transition-colors"
              >
                {{ work.workTitle }}
              </NuxtLink>

              <p class="text-sm text-gray-600 mt-1 truncate">
                {{ work.artists.join(', ') }}
              </p>

              <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                <span v-if="work.releaseDate">发行：{{ formatDate(work.releaseDate) }}</span>
                <span>收藏：{{ formatDate(work.createdAt) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 w-full sm:w-auto flex items-center justify-end gap-2">
              <NuxtLink
                :to="`/works/${work.workId}`"
                class="inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 flex-none"
                :aria-label="`查看专辑：${work.workTitle}`"
                title="查看"
              >
                <Icon name="lucide:arrow-right" class="w-5 h-5 text-gray-600" />
              </NuxtLink>
              <button
                type="button"
                :disabled="!!unliked[work.id] || !!unlikeLoading[work.id]"
                @click="handleUnlike(work.id)"
                class="inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-gray-100 flex-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                :title="unliked[work.id] ? '已取消喜欢' : '取消喜欢'"
              >
                <Icon
                  :name="unliked[work.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                  class="w-5 h-5"
                  :class="unliked[work.id] ? 'text-gray-400' : 'text-red-600'"
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
import type { FavoriteWork, FavoritesStats } from '~/types/favorites'

defineProps<{
  stats: FavoritesStats
}>()

const { getFavoriteWorks, removeFavoriteItem } = useFavorites()

const works = ref<FavoriteWork[]>([])
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

const loadData = async () => {
  isLoading.value = true
  try {
    const response = await getFavoriteWorks(page.value, pageSize)
    works.value = response.data
    totalItems.value = response.total
  } catch (error) {
    console.error('Failed to load works:', error)
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
    await removeFavoriteItem(favoriteId, 'work')
  } catch (error) {
    console.error('Failed to unlike work:', error)
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
