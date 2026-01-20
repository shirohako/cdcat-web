<script setup lang="ts">
import { Disc3, Film } from 'lucide-vue-next'

const route = useRoute()
const seriesId = computed(() => Number(route.params.id))

const tabs = [
  { id: 'entries', label: '已关联条目' },
  { id: 'works-time', label: '专辑（按时间）' },
  { id: 'works-group', label: '专辑（按分组）' }
]

const currentTab = ref('entries')

// 模拟系列详情数据
interface SeriesDetail {
  id: number
  name: string
  banner_url?: string
  entries_count: number
  works_count: number
  views_count: number
  favorites_count: number
  entries: Entry[]
  entry_groups?: EntryGroup[]
  recentWorks: Work[]
  work_groups?: WorkGroup[]
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

interface EntryGroup {
  id: string
  name: string
  code?: string
  year?: string
  entry_ids: number[]
}

interface Work {
  id: number
  title: string
  type: string
  image_url?: string
  catalog_number?: string
  release_date?: string
}

interface WorkGroup {
  id: string
  name: string
  work_ids: number[]
}

// 模拟数据
const mockSeriesDetail: SeriesDetail = {
  id: seriesId.value,
  name: 'Atelier',
  banner_url: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1200&h=400&fit=crop',
  entries_count: 23,
  works_count: 156,
  views_count: 12453,
  favorites_count: 892,
  entry_groups: [
    {
      id: 'secret',
      name: '秘密系列',
      code: '01',
      year: '2019-2024',
      entry_ids: [1, 2, 3]
    },
    {
      id: 'mysterious',
      name: '不可思议系列',
      code: '02',
      year: '2015-2017',
      entry_ids: [4, 5, 6]
    }
  ],
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
      catalog_number: 'KDSD-01168~70',
      release_date: '2023-03-22'
    },
    {
      id: 2,
      title: 'Atelier Ryza 2 Original Soundtrack',
      type: 'Original Soundtrack',
      image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop',
      catalog_number: 'KDSD-01098~100',
      release_date: '2021-02-03'
    },
    {
      id: 3,
      title: 'Atelier Ryza Original Soundtrack',
      type: 'Original Soundtrack',
      image_url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&h=200&fit=crop',
      catalog_number: 'KDSD-01050~2',
      release_date: '2019-10-02'
    },
    {
      id: 4,
      title: 'Atelier Sophie 2 Original Soundtrack',
      type: 'Original Soundtrack',
      image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop',
      catalog_number: 'KDSD-01124~6',
      release_date: '2022-03-16'
    }
  ],
  work_groups: [
    {
      id: 'ryza',
      name: '莱莎系列',
      work_ids: [1, 2, 3]
    },
    {
      id: 'sophie',
      name: '苏菲系列',
      work_ids: [4]
    }
  ],
  stats: {
    total_tracks: 1234,
    total_artists: 89,
    avg_rating: 4.7
  }
}

const series = ref<SeriesDetail>(mockSeriesDetail)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Banner 区域 -->
    <div class="relative h-80 bg-linear-to-br from-blue-500 to-purple-600 overflow-hidden">
      <img
        v-if="series.banner_url"
        :src="series.banner_url"
        :alt="series.name"
        class="w-full h-full object-cover opacity-30"
      />
      <div class="absolute inset-0 bg-linear-to-t from-black/60 via-black/30 to-transparent" />

      <!-- 系列主要信息 -->
      <div class="absolute bottom-0 left-0 right-0 p-8">
        <div class="container mx-auto max-w-7xl">
          <div class="flex items-end gap-6">
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
      <div class="space-y-6">
        <SeriesContentTabs v-model="currentTab" :tabs="tabs" />

        <SeriesEntriesSection
          v-show="currentTab === 'entries'"
          :entries="series.entries"
          :entries-count="series.entries_count"
          :groups="series.entry_groups"
        />
        <SeriesRecentWorksSection
          v-show="currentTab === 'works-time'"
          mode="time"
          :works="series.recentWorks"
          :works-count="series.works_count"
          :groups="series.work_groups"
        />
        <SeriesRecentWorksSection
          v-show="currentTab === 'works-group'"
          mode="group"
          :works="series.recentWorks"
          :works-count="series.works_count"
          :groups="series.work_groups"
        />
      </div>
    </div>
  </div>
</template>
