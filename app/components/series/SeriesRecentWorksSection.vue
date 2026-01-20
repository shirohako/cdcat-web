<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Disc3 class="w-5 h-5 text-purple-600" />
        关联专辑
      </h2>
    </div>

    <div class="space-y-6">
      <section v-if="mode === 'time'" class="space-y-4">
        <div v-if="worksByYear.length === 0" class="text-sm text-gray-500">暂无专辑。</div>
        <div v-for="bucket in worksByYear" :key="bucket.year" class="rounded-2xl border border-purple-100 bg-purple-50/40 p-5 space-y-4 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <h3 class="text-lg font-bold text-slate-900 tracking-tight">{{ bucket.year }}</h3>
          </div>
          <div class="space-y-3">
            <NuxtLink
              v-for="work in bucket.works"
              :key="work.id"
              :to="`/works/${work.id}`"
              class="group flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white/90 hover:border-purple-200 hover:shadow-sm transition-all duration-200"
            >
              <div class="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                <img
                  v-if="work.image_url"
                  :src="work.image_url"
                  :alt="work.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Disc3 class="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors line-clamp-1">
                  {{ work.title }}
                </h4>
                <div class="text-xs text-gray-500 flex flex-wrap gap-3">
                  <span v-if="work.catalog_number">{{ work.catalog_number }}</span>
                  <span v-if="work.release_date">{{ formatDate(work.release_date) }}</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <section v-else class="space-y-4">
        <div v-if="groupedWorks.length === 0 && ungroupedWorks.length === 0" class="text-sm text-gray-500">暂无专辑。</div>

        <div v-for="group in groupedWorks" :key="group.id" class="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 space-y-4 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <h3 class="text-lg font-bold text-slate-900 tracking-tight">{{ group.name }}</h3>
          </div>
          <div class="space-y-3">
            <NuxtLink
              v-for="work in group.works"
              :key="work.id"
              :to="`/works/${work.id}`"
              class="group flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white/90 hover:border-amber-200 hover:shadow-sm transition-all duration-200"
            >
              <div class="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                <img
                  v-if="work.image_url"
                  :src="work.image_url"
                  :alt="work.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Disc3 class="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-800 group-hover:text-amber-700 transition-colors line-clamp-1">
                  {{ work.title }}
                </h4>
                <div class="text-xs text-gray-500 flex flex-wrap gap-3">
                  <span v-if="work.catalog_number">{{ work.catalog_number }}</span>
                  <span v-if="work.release_date">{{ formatDate(work.release_date) }}</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <div v-if="ungroupedWorks.length" class="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 shadow-sm">
          <div class="flex items-center gap-3">
            <span class="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <h3 class="text-lg font-bold text-slate-900 tracking-tight">未分组</h3>
          </div>
          <div class="space-y-3">
            <NuxtLink
              v-for="work in ungroupedWorks"
              :key="work.id"
              :to="`/works/${work.id}`"
              class="group flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white/90 hover:border-slate-200 hover:shadow-sm transition-all duration-200"
            >
              <div class="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                <img
                  v-if="work.image_url"
                  :src="work.image_url"
                  :alt="work.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Disc3 class="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-800 group-hover:text-slate-700 transition-colors line-clamp-1">
                  {{ work.title }}
                </h4>
                <div class="text-xs text-gray-500 flex flex-wrap gap-3">
                  <span v-if="work.catalog_number">{{ work.catalog_number }}</span>
                  <span v-if="work.release_date">{{ formatDate(work.release_date) }}</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Disc3 } from 'lucide-vue-next'

type WorkItem = {
  id: number
  title: string
  image_url?: string
  catalog_number?: string
  release_date?: string
}

type WorkGroup = {
  id: string
  name: string
  work_ids: number[]
}

const props = withDefaults(defineProps<{
  works: WorkItem[]
  worksCount: number
  groups?: WorkGroup[]
  mode?: 'time' | 'group'
}>(), {
  mode: 'time'
})

const mode = computed(() => props.mode)

const worksByYear = computed(() => {
  const buckets = new Map<string, WorkItem[]>()
  props.works.forEach((work) => {
    const year = work.release_date ? String(new Date(work.release_date).getFullYear()) : '未知时间'
    if (!buckets.has(year)) buckets.set(year, [])
    buckets.get(year)!.push(work)
  })
  const entries = Array.from(buckets.entries())
  entries.sort((a, b) => {
    if (a[0] === '未知时间') return 1
    if (b[0] === '未知时间') return -1
    return Number(b[0]) - Number(a[0])
  })
  return entries.map(([year, items]) => ({ year, works: items }))
})

const groupedWorks = computed(() => {
  if (!props.groups || props.groups.length === 0) return []
  const workMap = new Map(props.works.map((work) => [work.id, work]))
  return props.groups.map((group) => ({
    id: group.id,
    name: group.name,
    works: group.work_ids.map((id) => workMap.get(id)).filter(Boolean) as WorkItem[]
  }))
})

const ungroupedWorks = computed(() => {
  if (!props.groups || props.groups.length === 0) return props.works
  const groupedIds = new Set(props.groups.flatMap((group) => group.work_ids))
  return props.works.filter((work) => !groupedIds.has(work.id))
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
