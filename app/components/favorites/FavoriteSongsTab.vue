<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader" class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="songs.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:music" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">还没有收藏任何歌曲</p>
      <p class="text-sm text-gray-400 mb-6">收藏你喜欢的歌曲，随时随地享受音乐</p>
      <NuxtLink to="/works" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        浏览专辑
      </NuxtLink>
    </div>

    <!-- Songs List -->
    <div v-else class="space-y-3">
      <!-- Songs Table (Desktop) -->
      <div class="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">歌曲</th>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">所属专辑</th>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">时长</th>
              <th class="px-6 py-3 text-left font-semibold text-gray-700">收藏时间</th>
              <th class="px-6 py-3 text-center font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="song in songs"
              :key="song.id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <!-- Song Title -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <Icon name="lucide:music" class="w-5 h-5 text-gray-400" />
                  <div class="min-w-0">
                    <p class="font-medium text-gray-900 truncate">{{ song.songTitle }}</p>
                  </div>
                </div>
              </td>

              <!-- Album -->
              <td class="px-6 py-4 text-gray-600 truncate">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-md overflow-hidden bg-gray-100 ring-1 ring-black/5 shrink-0">
                    <img
                      v-if="song.cover"
                      :src="song.cover"
                      :alt="song.workTitle || song.songTitle"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                      <Icon name="lucide:disc-3" class="w-4 h-4" />
                    </div>
                  </div>
                  <span v-if="song.workTitle" class="text-blue-600 hover:underline cursor-pointer truncate">
                    {{ song.workTitle }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </div>
              </td>

              <!-- Duration -->
              <td class="px-6 py-4 text-gray-600">
                {{ formatDuration(song.duration) }}
              </td>

              <!-- Created At -->
              <td class="px-6 py-4 text-gray-600 text-sm">
                {{ formatDate(song.createdAt) }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled
                    class="text-gray-600 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100
                           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="添加笔记（即将支持）"
                  >
                    <Icon name="lucide:sticky-note" class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    :disabled="!!unliked[song.id] || !!unlikeLoading[song.id]"
                    @click="handleUnlike(song.id)"
                    class="transition-colors p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    :title="unliked[song.id] ? '已取消喜欢' : '取消喜欢'"
                  >
                    <Icon
                      :name="unliked[song.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                      class="w-4 h-4"
                      :class="unliked[song.id] ? 'text-gray-400' : 'text-red-600'"
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Songs Cards (Mobile) -->
      <div class="md:hidden space-y-3">
        <div
          v-for="song in songs"
          :key="song.id"
          class="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all duration-200"
        >
          <div class="flex items-center gap-3">
            <!-- Cover -->
            <div class="w-12 h-12 rounded-md overflow-hidden bg-gray-100 ring-1 ring-black/5 shrink-0">
              <img
                v-if="song.cover"
                :src="song.cover"
                :alt="song.songTitle"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                <Icon name="lucide:disc-3" class="w-6 h-6" />
              </div>
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-gray-900 text-sm line-clamp-1">{{ song.songTitle }}</p>
              <p class="text-xs text-gray-600 mt-0.5 line-clamp-1">
                {{ song.workTitle || '无专辑' }}
              </p>
              <div class="flex gap-2 mt-2 text-xs text-gray-500">
                <span>{{ formatDuration(song.duration) }}</span>
                <span>{{ formatDate(song.createdAt) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="shrink-0 flex items-center gap-1">
              <button
                type="button"
                disabled
                class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                title="添加笔记（即将支持）"
              >
                <Icon name="lucide:sticky-note" class="w-4 h-4 text-gray-500" />
              </button>
              <button
                type="button"
                :disabled="!!unliked[song.id] || !!unlikeLoading[song.id]"
                @click="handleUnlike(song.id)"
                class="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                :title="unliked[song.id] ? '已取消喜欢' : '取消喜欢'"
              >
                <Icon
                  :name="unliked[song.id] ? 'heroicons-outline:heart' : 'heroicons-solid:heart'"
                  class="w-4 h-4"
                  :class="unliked[song.id] ? 'text-gray-400' : 'text-red-600'"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
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
import type { FavoriteSong } from '~/types/favorites'

const { getFavoriteSongs, removeFavoriteItem } = useFavorites()

const songs = ref<FavoriteSong[]>([])
const page = ref(1)
const pageSize = 10
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

const formatDuration = (seconds?: number) => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const loadData = async () => {
  isLoading.value = true
  try {
    const response = await getFavoriteSongs(page.value, pageSize)
    songs.value = response.data
    totalItems.value = response.total
  } catch (error) {
    console.error('Failed to load songs:', error)
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
    await removeFavoriteItem(favoriteId, 'song')
  } catch (error) {
    console.error('Failed to unlike song:', error)
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
