<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
      <BarChart3 :size="20" />
      Stats
    </h3>
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-gray-600 flex items-center gap-2">
          <Eye :size="16" class="text-gray-400" />
          Viewed
        </span>
        <span class="font-bold">{{ viewsCount }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-600 flex items-center gap-2">
          <Heart :size="16" class="text-red-400" />
          Liked
        </span>
        <span class="font-bold">{{ likesCount }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-600 flex items-center gap-2">
          <Headphones :size="16" class="text-blue-400" />
          Plan to Listen
        </span>
        <span class="font-bold">{{ trackingStats.plan_to_listen }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-600 flex items-center gap-2">
          <CircleCheck :size="16" class="text-green-400" />
          Completed
        </span>
        <span class="font-bold">{{ trackingStats.completed }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-600 flex items-center gap-2">
          <Bookmark :size="16" class="text-yellow-400" />
          Wishlist
        </span>
        <span class="font-bold">{{ trackingStats.wishlist }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-600 flex items-center gap-2">
          <Package :size="16" class="text-purple-400" />
          Owned
        </span>
        <span class="font-bold">{{ trackingStats.owned }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-600 flex items-center gap-2">
          <CircleX :size="16" class="text-gray-400" />
          Dropped
        </span>
        <span class="font-bold">{{ trackingStats.dropped }}</span>
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
