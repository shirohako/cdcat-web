<template>
  <section class="animate-fade-in-up-slow rounded-2xl border border-black/5 bg-white/75 p-5 shadow-sm backdrop-blur-xl">
    <header class="mb-5 flex items-center justify-between gap-3">
      <h2 class="text-base font-semibold leading-6 text-gray-900">我的音乐</h2>
      <p class="shrink-0 text-xs text-gray-500">共5项目</p>
    </header>

    <div class="divide-y divide-gray-100">
      <div
        v-for="stat in statCards"
        :key="stat.label"
        class="group flex items-center justify-between rounded-lg px-1 py-2.5 transition-colors hover:bg-gray-50/80"
      >
        <div class="flex min-w-0 items-center gap-2.5">
          <span
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            :class="stat.iconBg"
          >
            <component :is="stat.icon" :size="15" :class="stat.iconColor" />
          </span>
          <p class="text-sm font-medium text-gray-700">{{ stat.label }}</p>
        </div>
        <p class="tabular-nums text-lg font-bold text-gray-900">{{ stat.value }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Bookmark, CheckCircle, Headphones, Package, XCircle } from 'lucide-vue-next'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
})

const statCards = computed(() => [
  { label: '想听', value: props.stats.plan_to_listen, icon: Headphones, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
  { label: '听过', value: props.stats.completed, icon: CheckCircle, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { label: '想购入', value: props.stats.wishlist, icon: Bookmark, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { label: '已购入', value: props.stats.owned, icon: Package, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  { label: '抛弃', value: props.stats.dropped, icon: XCircle, iconBg: 'bg-rose-50', iconColor: 'text-rose-600' }
])
</script>
