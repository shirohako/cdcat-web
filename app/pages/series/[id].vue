<script setup lang="ts">
import { Disc3, Film, Pencil } from 'lucide-vue-next'

const route = useRoute()
const seriesId = computed(() => Number(route.params.id))

const tabs = [
  { id: 'entries', label: '已关联条目' },
  { id: 'works-time', label: '专辑（按时间）' },
  { id: 'works-group', label: '专辑（按分组）' }
]

const currentTab = ref('entries')

interface FranchiseGroup {
  id: string
  order: number
  meta: {
    name: string
    name_cn?: string
    name_ja?: string
  }
}

interface FranchiseEntry {
  id: number
  name: string
  slug: string
  type: string
  source: string
  release_date?: string
  group_id?: string
  order: number
  image_url?: string
  meta?: {
    description?: string
    catalog_number?: string
  }
}

interface FranchiseWork {
  id: number
  title: string
  type: string
  image_url?: string
  catalog_number?: string
  release_date?: string
  group_id?: string
}

interface Franchise {
  id: number
  name: string
  image_url?: string
  meta?: Record<string, any>
  groups: FranchiseGroup[]
  groups_count: number
  entries_count: number
  works_count: number
  entries: FranchiseEntry[]
  works: FranchiseWork[]
  created_at: string
  updated_at: string
}

const { $api } = useNuxtApp()
const { data: series } = await useAsyncData(
  `franchise-${seriesId.value}`,
  () => $api<Franchise>(`/v1/franchises/${seriesId.value}`)
)

// 转换 entries 为组件需要的格式
const entriesForComponent = computed(() => {
  if (!series.value?.entries) return []
  return series.value.entries.map(entry => ({
    id: entry.id,
    name: entry.name,
    type: entry.type,
    image_url: entry.image_url,
    works_count: 0
  }))
})

// 转换 groups 为组件需要的 entry_groups 格式
const entryGroups = computed(() => {
  if (!series.value?.groups || !series.value?.entries) return []
  return series.value.groups.map(group => ({
    id: group.id,
    name: group.meta.name_cn || group.meta.name,
    entry_ids: series.value!.entries
      .filter(entry => entry.group_id === group.id)
      .map(entry => entry.id)
  }))
})
</script>

<template>
  <div v-if="series" class="min-h-screen bg-gray-50">
    <!-- Banner 区域 -->
    <div class="relative h-80 bg-linear-to-br from-blue-500 to-purple-600 overflow-hidden">
      <img
        v-if="series.image_url"
        :src="series.image_url"
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
            <!-- 编辑按钮 -->
            <NuxtLink
              :to="`/contribute/series/${series.id}`"
              class="btn btn-ghost btn-sm text-white border-white/30 hover:bg-white/20"
            >
              <Pencil class="w-4 h-4" />
              编辑
            </NuxtLink>
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
          :entries="entriesForComponent"
          :entries-count="series.entries_count"
          :groups="entryGroups"
        />
        <SeriesRecentWorksSection
          v-show="currentTab === 'works-time'"
          mode="time"
          :works="series.works"
          :works-count="series.works_count"
        />
        <SeriesRecentWorksSection
          v-show="currentTab === 'works-group'"
          mode="group"
          :works="series.works"
          :works-count="series.works_count"
          :groups="series.groups"
        />
      </div>
    </div>
  </div>
</template>
