<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
        <BarChart3 :size="15" class="text-emerald-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('work.section.stats') }}</h2>
    </div>

    <div class="px-5 py-4 space-y-3">
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500 flex items-center gap-2">
          <Eye :size="14" class="text-gray-400" />
          {{ $t('work.stats.viewed') }}
        </span>
        <span class="font-semibold text-gray-800 tabular-nums">{{ viewsCount }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500 flex items-center gap-2">
          <Heart :size="14" class="text-red-400" />
          {{ $t('work.stats.liked') }}
        </span>
        <span class="font-semibold text-gray-800 tabular-nums">{{ likesCount }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500 flex items-center gap-2">
          <Headphones :size="14" class="text-blue-400" />
          {{ $t('work.stats.plan_to_listen') }}
        </span>
        <span class="font-semibold text-gray-800 tabular-nums">{{ trackingStats.plan_to_listen }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500 flex items-center gap-2">
          <CircleCheck :size="14" class="text-green-400" />
          {{ $t('work.stats.completed') }}
        </span>
        <span class="font-semibold text-gray-800 tabular-nums">{{ trackingStats.completed }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500 flex items-center gap-2">
          <Bookmark :size="14" class="text-yellow-400" />
          {{ $t('work.stats.wishlist') }}
        </span>
        <span class="font-semibold text-gray-800 tabular-nums">{{ trackingStats.wishlist }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500 flex items-center gap-2">
          <Package :size="14" class="text-purple-400" />
          {{ $t('work.stats.owned') }}
        </span>
        <span class="font-semibold text-gray-800 tabular-nums">{{ trackingStats.owned }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-gray-500 flex items-center gap-2">
          <CircleX :size="14" class="text-gray-400" />
          {{ $t('work.stats.dropped') }}
        </span>
        <span class="font-semibold text-gray-800 tabular-nums">{{ trackingStats.dropped }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TrackingStats } from '~/types/work'
import { BarChart3, Eye, Heart, Headphones, CircleCheck, Bookmark, Package, CircleX } from "lucide-vue-next"

withDefaults(defineProps<{
  viewsCount: number
  likesCount: number
  trackingStats: TrackingStats
}>(), {
  viewsCount: 0,
  likesCount: 0,
  trackingStats: () => ({
    plan_to_listen: 0,
    completed: 0,
    wishlist: 0,
    owned: 0,
    dropped: 0,
  }),
})
</script>
