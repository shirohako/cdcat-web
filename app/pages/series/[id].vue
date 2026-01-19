<script setup lang="ts">
import { Disc3, Film, Eye, Heart, Music, Users, ExternalLink } from 'lucide-vue-next'

const route = useRoute()
const seriesId = computed(() => Number(route.params.id))

// 模拟系列详情数据
interface SeriesDetail {
  id: number
  name: string
  image_url?: string
  banner_url?: string
  description: string
  entries_count: number
  works_count: number
  views_count: number
  favorites_count: number
  entries: Entry[]
  recentWorks: Work[]
  stats: {
    total_tracks: number
    total_artists: number
    avg_rating: number
  }
}

interface Entry {
  id: number
  name: string
  type: 'anime' | 'game' | 'movie' | 'tv' | 'other'
  image_url?: string
  works_count: number
}

interface Work {
  id: number
  title: string
  type: string
  image_url?: string
  catalog_number?: string
}

// 模拟数据
const mockSeriesDetail: SeriesDetail = {
  id: seriesId.value,
  name: 'Atelier',
  image_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=450&fit=crop',
  banner_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1200&h=400&fit=crop',
  description: '《炼金工房》（Atelier）系列是由 Gust 公司开发的角色扮演游戏系列，以炼金术为核心玩法。该系列以其独特的合成系统、可爱的角色设计和优美的音乐而闻名。系列作品众多，包括多个子系列如「黄昏系列」、「不可思议系列」、「秘密系列」等。每一代都有独特的世界观和故事，但都围绕着炼金术士的成长与冒险展开。',
  entries_count: 23,
  works_count: 156,
  views_count: 12453,
  favorites_count: 892,
  entries: [
    {
      id: 1,
      name: 'Atelier Ryza: Ever Darkness & the Secret Hideout',
      type: 'game',
      image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=300&fit=crop',
      works_count: 12
    },
    {
      id: 2,
      name: 'Atelier Ryza 2: Lost Legends & the Secret Fairy',
      type: 'game',
      image_url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=300&fit=crop',
      works_count: 10
    },
    {
      id: 3,
      name: 'Atelier Ryza 3: Alchemist of the End & the Secret Key',
      type: 'game',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop',
      works_count: 14
    },
    {
      id: 4,
      name: 'Atelier Sophie: The Alchemist of the Mysterious Book',
      type: 'game',
      image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=300&fit=crop',
      works_count: 8
    },
    {
      id: 5,
      name: 'Atelier Firis: The Alchemist and the Mysterious Journey',
      type: 'game',
      image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=300&fit=crop',
      works_count: 7
    },
    {
      id: 6,
      name: 'Atelier Lydie & Suelle: The Alchemists and the Mysterious Paintings',
      type: 'game',
      image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=300&fit=crop',
      works_count: 9
    }
  ],
  recentWorks: [
    {
      id: 1,
      title: 'Atelier Ryza 3 Original Soundtrack',
      type: 'Original Soundtrack',
      image_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=200&h=200&fit=crop',
      catalog_number: 'KDSD-01168~70'
    },
    {
      id: 2,
      title: 'Atelier Ryza 2 Original Soundtrack',
      type: 'Original Soundtrack',
      image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop',
      catalog_number: 'KDSD-01098~100'
    },
    {
      id: 3,
      title: 'Atelier Ryza Original Soundtrack',
      type: 'Original Soundtrack',
      image_url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&h=200&fit=crop',
      catalog_number: 'KDSD-01050~2'
    },
    {
      id: 4,
      title: 'Atelier Sophie 2 Original Soundtrack',
      type: 'Original Soundtrack',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop',
      catalog_number: 'KDSD-01124~6'
    }
  ],
  stats: {
    total_tracks: 1234,
    total_artists: 89,
    avg_rating: 4.7
  }
}

const series = ref<SeriesDetail>(mockSeriesDetail)

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toLocaleString()
}

// 条目类型标签颜色
const getEntryTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    anime: 'bg-pink-50 text-pink-600 border-pink-200',
    game: 'bg-blue-50 text-blue-600 border-blue-200',
    movie: 'bg-purple-50 text-purple-600 border-purple-200',
    tv: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    other: 'bg-gray-50 text-gray-600 border-gray-200'
  }
  return colors[type] || colors.other
}

// 条目类型中文名
const getEntryTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    anime: '动画',
    game: '游戏',
    movie: '电影',
    tv: '剧集',
    other: '其他'
  }
  return labels[type] || '其他'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Banner 区域 -->
    <div class="relative h-80 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
      <img
        v-if="series.banner_url"
        :src="series.banner_url"
        :alt="series.name"
        class="w-full h-full object-cover opacity-30"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

      <!-- 系列主要信息 -->
      <div class="absolute bottom-0 left-0 right-0 p-8">
        <div class="container mx-auto max-w-7xl">
          <div class="flex items-end gap-6">
            <!-- 系列封面 -->
            <div class="flex-shrink-0">
              <div class="w-40 h-40 rounded-xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm bg-white/10">
                <img
                  v-if="series.image_url"
                  :src="series.image_url"
                  :alt="series.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Disc3 class="w-16 h-16 text-gray-400" />
                </div>
              </div>
            </div>

            <!-- 标题和基本信息 -->
            <div class="flex-1 pb-2">
              <h1 class="text-4xl font-bold text-white mb-2">
                {{ series.name }}
              </h1>
              <div class="flex items-center gap-4 text-white/90">
                <div class="flex items-center gap-2">
                  <Film class="w-5 h-5" />
                  <span>{{ series.entries_count }} 条目</span>
                </div>
                <div class="flex items-center gap-2">
                  <Disc3 class="w-5 h-5" />
                  <span>{{ series.works_count }} 专辑</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="container mx-auto max-w-7xl px-4 md:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 左侧主要内容 -->
        <div class="lg:col-span-2 space-y-8">
          <!-- 系列介绍 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Music class="w-5 h-5 text-blue-600" />
              系列介绍
            </h2>
            <p class="text-gray-700 leading-relaxed whitespace-pre-line">
              {{ series.description }}
            </p>

          </div>

          <!-- 系列条目 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Film class="w-5 h-5 text-emerald-600" />
              系列条目
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NuxtLink
                v-for="entry in series.entries"
                :key="entry.id"
                :to="`/entries/${entry.id}`"
                class="group flex gap-4 p-4 rounded-lg border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300"
              >
                <!-- 条目封面 -->
                <div class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    v-if="entry.image_url"
                    :src="entry.image_url"
                    :alt="entry.name"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Film class="w-8 h-8 text-gray-400" />
                  </div>
                </div>

                <!-- 条目信息 -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <h3 class="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {{ entry.name }}
                      </h3>
                    <span :class="['text-xs px-2 py-0.5 rounded-full border flex-shrink-0', getEntryTypeColor(entry.type)]">
                      {{ getEntryTypeLabel(entry.type) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-gray-600">
                    <span class="flex items-center gap-1">
                      <Disc3 class="w-3.5 h-3.5" />
                      {{ entry.works_count }} 专辑
                    </span>
                  </div>
                </div>
              </NuxtLink>
            </div>

            <div class="text-center mt-6">
              <button class="btn btn-outline btn-sm">
                查看全部 {{ series.entries_count }} 个条目
              </button>
            </div>
          </div>

          <!-- 最新专辑 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Disc3 class="w-5 h-5 text-purple-600" />
              最新专辑
            </h2>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NuxtLink
                v-for="work in series.recentWorks"
                :key="work.id"
                :to="`/works/${work.id}`"
                class="group block"
              >
                <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3 shadow-sm group-hover:shadow-lg transition-all duration-300">
                  <img
                    v-if="work.image_url"
                    :src="work.image_url"
                    :alt="work.title"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Disc3 class="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <h3 class="font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                  {{ work.title }}
                </h3>
                <p class="text-xs text-gray-500 line-clamp-1">
                  {{ work.catalog_number }}
                </p>
              </NuxtLink>
            </div>

            <div class="text-center mt-6">
              <button class="btn btn-outline btn-sm">
                查看全部 {{ series.works_count }} 张专辑
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧侧边栏 -->
        <div class="space-y-6">
          <!-- 统计卡片 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-bold text-gray-800 mb-4">统计信息</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-600">
                  <Eye class="w-5 h-5" />
                  <span>浏览量</span>
                </div>
                <span class="font-semibold text-gray-800">{{ formatNumber(series.views_count) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-600">
                  <Heart class="w-5 h-5" />
                  <span>收藏数</span>
                </div>
                <span class="font-semibold text-gray-800">{{ formatNumber(series.favorites_count) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-600">
                  <Music class="w-5 h-5" />
                  <span>总曲目数</span>
                </div>
                <span class="font-semibold text-gray-800">{{ formatNumber(series.stats.total_tracks) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-gray-600">
                  <Users class="w-5 h-5" />
                  <span>参与艺术家</span>
                </div>
                <span class="font-semibold text-gray-800">{{ series.stats.total_artists }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="space-y-3">
              <button class="btn btn-primary w-full">
                <Heart class="w-4 h-4" />
                收藏系列
              </button>
              <button class="btn btn-outline w-full">
                <ExternalLink class="w-4 h-4" />
                外部链接
              </button>
            </div>
          </div>

          <!-- 系列信息 -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="font-bold text-gray-800 mb-4">系列信息</h3>
            <div class="space-y-3 text-sm">
              <div>
                <span class="text-gray-600">包含条目</span>
                <p class="font-medium text-gray-800 mt-1">{{ series.entries_count }} 个</p>
              </div>
              <div>
                <span class="text-gray-600">相关专辑</span>
                <p class="font-medium text-gray-800 mt-1">{{ series.works_count }} 张</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
