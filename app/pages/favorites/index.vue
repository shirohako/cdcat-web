<template>
  <div class="min-h-screen bg-gray-50/80">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">我的收藏</h1>
        <p class="mt-1.5 text-sm text-gray-500">管理你喜欢的专辑、歌曲和喜欢的艺术家</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">喜欢的专辑</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.worksCount }}</p>
            </div>
            <Icon name="lucide:disc-3" class="w-12 h-12 text-blue-100" />
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">喜欢的歌曲</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.songsCount }}</p>
            </div>
            <Icon name="lucide:music" class="w-12 h-12 text-purple-100" />
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">喜欢的艺术家</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.artistsCount }}</p>
            </div>
            <Icon name="lucide:mic-2" class="w-12 h-12 text-pink-100" />
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
        <nav class="flex gap-0 border-b border-gray-200" aria-label="Favorites tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.key
              ? 'border-blue-500 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            @click="switchTab(tab.key)"
          >
            <Icon :name="tab.icon" class="w-5 h-5" />
            <span>{{ tab.label }}</span>
            <span class="text-xs font-semibold text-gray-400 ml-1">({{ getTabCount(tab.key) }})</span>
          </button>
        </nav>

        <!-- Tab Content -->
        <FavoriteWorksTab
          v-if="activeTab === 'works'"
          :stats="stats"
        />
        <FavoriteSongsTab
          v-else-if="activeTab === 'songs'"
          :stats="stats"
        />
        <FavoriteArtistsTab
          v-else-if="activeTab === 'artists'"
          :stats="stats"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FavoritesStats } from '~/types/favorites'
import FavoriteWorksTab from '~/components/favorites/FavoriteWorksTab.vue'
import FavoriteSongsTab from '~/components/favorites/FavoriteSongsTab.vue'
import FavoriteArtistsTab from '~/components/favorites/FavoriteArtistsTab.vue'

definePageMeta({
  middleware: 'auth'
})

const { getFavoritesStats } = useFavorites()

const activeTab = ref('works')
const stats = ref<FavoritesStats>({
  worksCount: 0,
  songsCount: 0,
  artistsCount: 0
})

const tabs = [
  { key: 'works', label: '我喜欢的专辑', icon: 'lucide:disc-3' },
  { key: 'songs', label: '我喜欢的歌曲', icon: 'lucide:music' },
  { key: 'artists', label: '我喜欢的艺术家', icon: 'lucide:mic-2' }
]

const getTabCount = (tabKey: string) => {
  switch (tabKey) {
    case 'works':
      return stats.value.worksCount
    case 'songs':
      return stats.value.songsCount
    case 'artists':
      return stats.value.artistsCount
    default:
      return 0
  }
}

const switchTab = (tabKey: string) => {
  activeTab.value = tabKey
}

onMounted(async () => {
  const data = await getFavoritesStats()
  stats.value = data
})

useHead({
  title: 'My Collections | CDCAT'
})
</script>
