<template>
  <section class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
        <Heart :size="15" class="text-amber-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('reviews.rating_title') }}</h2>
    </div>

    <div class="px-6 py-4">
      <!-- The average only shows once enough people rated; the distribution always does. -->
      <div class="mb-3 flex items-baseline gap-2">
        <template v-if="enough && rating !== null">
          <span class="text-3xl font-black tabular-nums text-gray-900">{{ rating.toFixed(1) }}</span>
          <span class="text-sm text-gray-400">/ 5</span>
        </template>
        <span class="ml-auto text-xs text-gray-400">
          {{ ratingCount === 0 ? $t('reviews.no_ratings') : enough ? $t('reviews.rating_count', { count: ratingCount }) : $t('reviews.rating_few', { count: ratingCount, min: MIN_RATINGS }) }}
        </span>
      </div>

      <ul class="space-y-1.5">
        <li v-for="value in REVIEW_RATINGS" :key="value" class="flex items-center gap-2 text-xs">
          <span class="w-16 shrink-0 text-gray-500">{{ $t(reviewRatingKey(value)) }}</span>
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div class="h-full rounded-full" :class="reviewRatingBar(value)" :style="{ width: `${share(value)}%` }" />
          </div>
          <span class="w-8 shrink-0 text-right tabular-nums text-gray-400">{{ distribution?.[value - 1] ?? 0 }}</span>
        </li>
      </ul>

      <div class="mt-4">
        <CommonButtonButton01 class="w-full!" @click="emit('writeReview')">
          {{ $t('reviews.write') }}
          <template #icon><PenLine :size="14" /></template>
        </CommonButtonButton01>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ReviewRating } from '~/types/reviews'
import { Heart, PenLine } from '@lucide/vue'

/** The album's rating: average and per-level counts of the visible reviews. Leaderboards come later. */
const props = defineProps<{
  rating: number | null
  ratingCount: number
  distribution: number[] | null
}>()
const emit = defineEmits<{ writeReview: [] }>()

const MIN_RATINGS = 5
const enough = computed(() => props.ratingCount >= MIN_RATINGS)
const share = (value: ReviewRating) => props.ratingCount > 0 ? ((props.distribution?.[value - 1] ?? 0) / props.ratingCount) * 100 : 0
</script>
