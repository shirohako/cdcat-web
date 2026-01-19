<script setup lang="ts">
import { Disc3, Eye, Film } from 'lucide-vue-next'

// 模拟数据
interface Series {
  id: number
  name: string
  name_cn?: string
  image_url?: string
  description?: string
  entries_count: number
  works_count: number
  views_count: number
  favorites_count: number
}

const currentPage = ref(1)
const pageSize = 24

// 模拟系列数据
const mockSeriesData: Series[] = [
  {
    id: 1,
    name: 'Atelier',
    name_cn: '炼金工房',
    image_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=450&fit=crop',
    description: '炼金工房系列是由 Gust 公司开发的角色扮演游戏系列，以炼金术为核心玩法',
    entries_count: 23,
    works_count: 156,
    views_count: 12453,
    favorites_count: 892
  },
  {
    id: 2,
    name: 'The Legend of Heroes',
    name_cn: '英雄传说',
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=450&fit=crop',
    description: '英雄传说是 Falcom 公司的知名 RPG 系列，包含轨迹系列等多个子系列',
    entries_count: 18,
    works_count: 234,
    views_count: 23567,
    favorites_count: 1543
  },
  {
    id: 3,
    name: 'Tales of',
    name_cn: '传说',
    image_url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=450&fit=crop',
    description: 'Bandai Namco 的传说系列，以独特的战斗系统和精彩剧情闻名',
    entries_count: 25,
    works_count: 312,
    views_count: 34289,
    favorites_count: 2156
  },
  {
    id: 4,
    name: 'Persona',
    name_cn: '女神异闻录',
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=450&fit=crop',
    description: 'Atlus 旗下的现代奇幻 RPG 系列，融合校园生活与地下城探索',
    entries_count: 12,
    works_count: 198,
    views_count: 45678,
    favorites_count: 3421
  }
]

// 分页逻辑
const totalPages = computed(() => Math.ceil(mockSeriesData.length / pageSize))
const paginatedSeries = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return mockSeriesData.slice(start, end)
})

// 显示的页码（最多显示 7 个页码按钮）
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toLocaleString()
}
</script>

<template>
  <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">系列列表</h1>
      <p class="text-gray-600">浏览所有游戏、动画、音乐系列作品</p>
    </div>

    <!-- 系列卡片网格 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <NuxtLink
        v-for="series in paginatedSeries"
        :key="series.id"
        :to="`/series/${series.id}`"
        class="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <!-- 系列封面 -->
        <div class="relative aspect-video overflow-hidden bg-gray-100">
          <img
            v-if="series.image_url"
            :src="series.image_url"
            :alt="series.name_cn || series.name"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Disc3 class="w-12 h-12 text-gray-400" />
          </div>
        </div>

        <!-- 系列信息 -->
        <div class="p-4">
          <h3 class="font-bold text-gray-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
            {{ series.name_cn || series.name }}
          </h3>
          <p v-if="series.name_cn" class="text-xs text-gray-500 mb-2 truncate">
            {{ series.name }}
          </p>

          <p v-if="series.description" class="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {{ series.description }}
          </p>

          <!-- 统计信息 -->
          <div class="space-y-1.5 text-xs text-gray-600">
            <div class="flex items-center gap-1.5">
              <Film class="w-3.5 h-3.5 text-gray-400" />
              <span>{{ series.entries_count }} 条目</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Disc3 class="w-3.5 h-3.5 text-gray-400" />
              <span>{{ series.works_count }} 专辑</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Eye class="w-3.5 h-3.5 text-gray-400" />
              <span>{{ formatNumber(series.views_count) }}</span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- 分页控制 -->
    <div v-if="totalPages > 1" class="flex justify-center mt-8">
      <div class="join">
        <button
          class="join-item btn btn-sm"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          «
        </button>

        <template v-for="(page, index) in visiblePages" :key="index">
          <button
            v-if="page === '...'"
            class="join-item btn btn-sm btn-disabled"
          >
            ...
          </button>
          <button
            v-else
            class="join-item btn btn-sm"
            :class="{ 'btn-active': currentPage === page }"
            @click="goToPage(page as number)"
          >
            {{ page }}
          </button>
        </template>

        <button
          class="join-item btn btn-sm"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          »
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
