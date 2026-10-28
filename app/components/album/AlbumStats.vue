<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.stats')" :icon="BarChart3" class="px-5 pb-2 pt-4" />

    <div class="px-5 py-4 space-y-3">
      <div class="flex justify-between items-center text-sm">
        <span class="text-meta flex items-center gap-2">
          <Eye :size="14" class="text-meta" />
          {{ $t('album.stats.viewed') }}
        </span>
        <span class="font-semibold text-title tabular-nums">{{ viewsCount }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-meta flex items-center gap-2">
          <Heart :size="14" class="text-red-500 dark:text-red-400" />
          {{ $t('album.stats.liked') }}
        </span>
        <span class="font-semibold text-title tabular-nums">{{ favoritesCount }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-meta flex items-center gap-2">
          <Headphones :size="14" class="text-blue-500 dark:text-blue-400" />
          {{ $t('album.stats.plan_to_listen') }}
        </span>
        <span class="font-semibold text-title tabular-nums">{{ trackingStats.plan_to_listen }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-meta flex items-center gap-2">
          <CircleCheck :size="14" class="text-green-500 dark:text-green-400" />
          {{ $t('album.stats.completed') }}
        </span>
        <span class="font-semibold text-title tabular-nums">{{ trackingStats.completed }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-meta flex items-center gap-2">
          <Bookmark :size="14" class="text-yellow-500 dark:text-yellow-400" />
          {{ $t('album.stats.wishlist') }}
        </span>
        <span class="font-semibold text-title tabular-nums">{{ trackingStats.wishlist }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-meta flex items-center gap-2">
          <Package :size="14" class="text-purple-500 dark:text-purple-400" />
          {{ $t('album.stats.owned') }}
        </span>
        <span class="font-semibold text-title tabular-nums">{{ trackingStats.owned }}</span>
      </div>
      <div class="flex justify-between items-center text-sm">
        <span class="text-meta flex items-center gap-2">
          <CircleX :size="14" class="text-meta" />
          {{ $t('album.stats.dropped') }}
        </span>
        <span class="font-semibold text-title tabular-nums">{{ trackingStats.dropped }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlbumTrackingStats } from '~/types/album'
import { BarChart3, Eye, Heart, Headphones, CircleCheck, Bookmark, Package, CircleX } from "@lucide/vue"

withDefaults(defineProps<{
  viewsCount?: number
  favoritesCount?: number
  trackingStats?: AlbumTrackingStats
}>(), {
  viewsCount: 0,
  favoritesCount: 0,
  trackingStats: () => ({
    plan_to_listen: 0,
    completed: 0,
    wishlist: 0,
    owned: 0,
    dropped: 0,
  }),
})
</script>
