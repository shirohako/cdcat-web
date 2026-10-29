<template>
  <section class="card overflow-hidden">
    <UiSectionTitle :title="$t('album.section.stats')" :icon="BarChart3" class="px-5 pb-2 pt-4" />

    <div class="space-y-4 px-5 pb-5 pt-2">
      <div class="grid grid-cols-2 gap-2">
        <div v-for="item in figures" :key="item.label" class="flex min-w-0 items-center gap-2.5 rounded-lg bg-sunken px-2.5 py-2">
          <span class="grid size-7 shrink-0 place-items-center rounded-full" :class="item.tint">
            <component :is="item.icon" :size="14" />
          </span>
          <div class="min-w-0">
            <p class="truncate text-base font-bold leading-5 tabular-nums text-title">{{ number.format(item.value) }}</p>
            <p class="truncate text-[11px] leading-4 text-meta">{{ item.label }}</p>
          </div>
        </div>
      </div>

      <div class="border-t border-line pt-4">
        <div class="mb-2 flex items-baseline justify-between text-xs text-meta">
          <span>{{ $t('album.stats.tracking') }}</span>
          <span class="tabular-nums">{{ $t('album.stats.tracking_total', { count: number.format(total) }, total) }}</span>
        </div>

        <!-- One bar split by status. Each part's hover area takes in the gap before it and reaches past the bar's
             edges, so moving along the bar never leaves the tooltips and theirs glides from part to part. -->
        <div class="-my-1.5 flex">
          <UiTooltip v-for="(segment, index) in segments" :key="segment.status" group="album-tracking" :offset="2" :text="`${segment.label} ${number.format(segment.count)} · ${segment.share}%`">
            <div
              class="box-content py-1.5 transition-[flex-grow] duration-300 ease-out"
              :class="[index > 0 && 'pl-0.5', segment.count > 0 ? 'min-w-2' : 'min-w-1']"
              :style="{ flex: `${segment.weight} 1 0%` }"
            >
              <div class="h-1.5" :class="[segment.bar, index === 0 && 'rounded-l-full', index === segments.length - 1 && 'rounded-r-full']" />
            </div>
          </UiTooltip>
        </div>

        <ul class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <li v-for="option in options" :key="option.status" class="flex min-w-0 items-center gap-2">
            <span class="size-2 shrink-0 rounded-full" :class="option.bar" />
            <span class="truncate text-meta">{{ option.label }}</span>
            <span class="ml-auto font-medium tabular-nums text-title">{{ number.format(option.count) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlbumTrackingStats } from '~/types/album'
import type { TrackingStatus } from '~/types/tracking'
import { BarChart3, Eye, Heart } from "@lucide/vue"

const props = withDefaults(defineProps<{
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

const { t, locale } = useI18n()
const number = computed(() => new Intl.NumberFormat(locale.value))

const figures = computed(() => [
  { icon: Eye, label: t('album.stats.viewed'), value: props.viewsCount, tint: 'bg-primary/10 text-primary' },
  { icon: Heart, label: t('album.stats.liked'), value: props.favoritesCount, tint: 'bg-red-500/10 text-red-500 dark:bg-red-400/15 dark:text-red-400' },
])

// Same order and colours as the tracking widget's buttons.
const STATUSES: { status: TrackingStatus, bar: string }[] = [
  { status: 'plan_to_listen', bar: 'bg-blue-500 dark:bg-blue-400' },
  { status: 'completed', bar: 'bg-teal-500 dark:bg-teal-400' },
  { status: 'wishlist', bar: 'bg-orange-400' },
  { status: 'owned', bar: 'bg-purple-500 dark:bg-purple-400' },
  { status: 'dropped', bar: 'bg-faint' },
]

const options = computed(() => STATUSES.map(({ status, bar }) => ({
  status,
  bar,
  label: t(`album.stats.${status}`),
  count: props.trackingStats[status] ?? 0,
})))
const total = computed(() => options.value.reduce((sum, option) => sum + option.count, 0))
/** Percent of the people tracking, as shown: under one but not none reads "<1". */
const shareOf = (count: number) => {
  const share = total.value > 0 ? (count / total.value) * 100 : 0
  return count > 0 && share < 1 ? '<1' : String(Math.round(share))
}
// Shares of the people tracking; while nobody does, every status gets an equal part. A status nobody picked keeps a
// sliver of its colour (min-w-1), narrower than any status somebody picked (min-w-2).
const segments = computed(() => options.value.map(option => ({
  ...option,
  weight: total.value === 0 ? 1 : option.count,
  share: shareOf(option.count),
})))
</script>
