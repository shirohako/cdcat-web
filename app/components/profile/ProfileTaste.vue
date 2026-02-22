<template>
  <section class="animate-fade-in-up-slow">
    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-5 shadow-sm">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-base font-semibold leading-6 text-gray-900">
          <Music :size="18" class="text-gray-400" />
          喜欢的类型
        </h2>
      </div>

      <div class="flex flex-wrap gap-2">
        <span
          v-for="tag in displayTags"
          :key="tag.name"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default"
          :class="getTagClasses(tag.color)"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="getTagDotClass(tag.color)" />
          {{ tag.name }}
          <span class="text-[10px] opacity-60">({{ tag.count }})</span>
        </span>
      </div>

      <!-- Taste visualization bar -->
      <div class="mt-4 h-2.5 rounded-full overflow-hidden flex bg-gray-100">
        <div
          v-for="tag in displayTags.slice(0, 5)"
          :key="'bar-' + tag.name"
          class="h-full transition-all duration-500"
          :class="getTagBarClass(tag.color)"
          :style="{ width: `${(tag.count / totalCount) * 100}%` }"
          :title="`${tag.name}: ${tag.count}`"
        />
      </div>
      <div class="flex justify-between mt-1.5 text-[10px] text-gray-400">
        <span>{{ displayTags[0]?.name }}</span>
        <span>{{ displayTags.length }} {{ $t('profile.genres') }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Music } from 'lucide-vue-next'

const props = defineProps({
  tags: {
    type: Array,
    default: () => []
  }
})

// TODO: 接口暂未返回数据，使用模拟数据展示
const mockTags = [
  { name: 'Touhou Arrange', count: 42, color: 'sky' },
  { name: 'VOCALOID', count: 31, color: 'emerald' },
  { name: 'Doujin', count: 28, color: 'amber' },
  { name: 'Anime OST', count: 19, color: 'rose' },
  { name: 'Game Music', count: 15, color: 'violet' },
  { name: 'Electronic', count: 12, color: 'indigo' },
  { name: 'Rock', count: 9, color: 'orange' },
  { name: 'Orchestral', count: 7, color: 'teal' }
]

const displayTags = computed(() =>
  props.tags.length > 0 ? props.tags : mockTags
)

const totalCount = computed(() =>
  displayTags.value.reduce((sum, t) => sum + t.count, 0)
)

function getTagClasses(color) {
  const map = {
    sky: 'bg-sky-50 text-sky-700 ring-sky-200/50',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200/50',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200/50',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200/50',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200/50',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200/50',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200/50'
  }
  return map[color] || 'bg-gray-50 text-gray-700 ring-gray-200/50'
}

function getTagDotClass(color) {
  const map = {
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    indigo: 'bg-indigo-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500'
  }
  return map[color] || 'bg-gray-500'
}

function getTagBarClass(color) {
  const map = {
    sky: 'bg-sky-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    violet: 'bg-violet-400',
    indigo: 'bg-indigo-400',
    orange: 'bg-orange-400',
    teal: 'bg-teal-400'
  }
  return map[color] || 'bg-gray-400'
}
</script>
