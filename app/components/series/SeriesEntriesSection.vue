<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      <Film class="w-5 h-5 text-emerald-600" />
      系列条目
    </h2>

    <template v-if="groupedEntries.length">
      <div class="space-y-6">
        <div
          v-for="group in groupedEntries"
          :key="group.id"
          class="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-4 shadow-sm"
        >
          <div class="flex flex-wrap items-center gap-3">
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span v-if="group.code" class="px-2 py-0.5 rounded-full bg-white text-emerald-700 text-xs font-semibold border border-emerald-200">
              {{ group.code }}
            </span>
            <h3 class="text-lg font-bold text-slate-900 tracking-tight">
              {{ group.name }}
            </h3>
            <span v-if="group.year" class="text-xs text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
              {{ group.year }}
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            <NuxtLink
              v-for="entry in group.entries"
              :key="entry.id"
              :to="`/entries/${entry.id}`"
              class="group flex flex-col gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-white/90"
            >
              <!-- 条目封面 -->
              <div class="w-full aspect-4/5 rounded-lg overflow-hidden bg-gray-100">
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
                <h3 class="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                  {{ entry.name }}
                </h3>
                <div class="flex items-center justify-between gap-2">
                  <span class="flex items-center gap-1 text-xs text-gray-600">
                    <Disc3 class="w-3.5 h-3.5" />
                    {{ entry.works_count }} 专辑
                  </span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full border shrink-0', getEntryTypeColor(entry.type)]">
                    {{ getEntryTypeLabel(entry.type) }}
                  </span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-if="ungroupedEntries.length" class="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 shadow-sm">
        <div class="flex items-center gap-3">
          <span class="h-2.5 w-2.5 rounded-full bg-slate-400" />
          <h3 class="text-lg font-bold text-slate-900 tracking-tight">
            未分组
          </h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          <NuxtLink
            v-for="entry in ungroupedEntries"
            :key="entry.id"
            :to="`/entries/${entry.id}`"
            class="group flex flex-col gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-white/90"
          >
            <!-- 条目封面 -->
            <div class="w-full aspect-4/5 rounded-lg overflow-hidden bg-gray-100">
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
              <h3 class="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                {{ entry.name }}
              </h3>
              <div class="flex items-center justify-between gap-2">
                <span class="flex items-center gap-1 text-xs text-gray-600">
                  <Disc3 class="w-3.5 h-3.5" />
                  {{ entry.works_count }} 专辑
                </span>
                <span :class="['text-xs px-2 py-0.5 rounded-full border shrink-0', getEntryTypeColor(entry.type)]">
                  {{ getEntryTypeLabel(entry.type) }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        <NuxtLink
          v-for="entry in entries"
          :key="entry.id"
          :to="`/entries/${entry.id}`"
          class="group flex flex-col gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 bg-white/90"
        >
          <!-- 条目封面 -->
          <div class="w-full aspect-4/5 rounded-lg overflow-hidden bg-gray-100">
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
            <h3 class="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
              {{ entry.name }}
            </h3>
            <div class="flex items-center justify-between gap-2">
              <span class="flex items-center gap-1 text-xs text-gray-600">
                <Disc3 class="w-3.5 h-3.5" />
                {{ entry.works_count }} 专辑
              </span>
              <span :class="['text-xs px-2 py-0.5 rounded-full border shrink-0', getEntryTypeColor(entry.type)]">
                {{ getEntryTypeLabel(entry.type) }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Disc3, Film } from 'lucide-vue-next'

type EntryItem = {
  id: number
  name: string
  type: string
  image_url?: string
  works_count: number
}

type EntryGroup = {
  id: string
  name: string
  code?: string
  year?: string
  entry_ids: number[]
}

const props = defineProps<{
  entries: EntryItem[]
  entriesCount: number
  groups?: EntryGroup[]
}>()

const groupedEntries = computed(() => {
  if (!props.groups || props.groups.length === 0) {
    return []
  }
  const entryMap = new Map(props.entries.map((entry) => [entry.id, entry]))
  return props.groups.map((group) => ({
    id: group.id,
    name: group.name,
    code: group.code,
    year: group.year,
    entries: group.entry_ids.map((id) => entryMap.get(id)).filter(Boolean) as EntryItem[]
  }))
})

const ungroupedEntries = computed(() => {
  if (!props.groups || props.groups.length === 0) {
    return props.entries
  }
  const groupedIds = new Set(props.groups.flatMap((group) => group.entry_ids))
  return props.entries.filter((entry) => !groupedIds.has(entry.id))
})

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

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
