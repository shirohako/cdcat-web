<template>
  <section class="card overflow-hidden">
    <!-- Spaced like the stats card: a 20px title line, 20px to the card's bottom edge. -->
    <UiSectionTitle :title="$t('reviews.rating_title')" :icon="Heart" size="sm" class="px-5 pb-5 pt-4 [&_h2]:leading-5" />

    <div class="px-5 pb-5">
      <!-- After Metacritic: the score in a square coloured by how good it is; too few ratings, and the square reads
           "TBD" (in every language) in the theme colour, its tooltip saying when the score shows. Square and text are
           one group, centred in the card like the columns under the bar. -->
      <div class="flex items-center justify-center gap-3">
        <UiTooltip :text="$t('reviews.score.few_hint', { min: MIN_RATINGS })" :disabled="!!score">
          <div
            class="grid size-12 shrink-0 place-items-center rounded-md tabular-nums"
            :class="score ? REVIEW_BAND_COLORS[score.band].solid : 'bg-primary text-on-primary'"
          >
            <span v-if="score" class="text-xl font-black leading-none">{{ score.value }}</span>
            <span v-else class="text-xs font-black">{{ $t('reviews.score.tbd') }}</span>
          </div>
        </UiTooltip>
        <div class="min-w-0">
          <!-- The verdict; under five ratings, how many rated; nobody yet, that. -->
          <p class="truncate text-[15px] font-bold leading-5 text-title">
            <template v-if="score">{{ $t(`reviews.score.verdict.${score.verdict}`) }}</template>
            <template v-else-if="ratingCount === 0">{{ $t('reviews.no_ratings') }}</template>
            <template v-else>{{ $t('reviews.score.few', { count: number.format(ratingCount) }, ratingCount) }}</template>
          </p>
          <!-- Under it the 高评分 rank, with the list tab's award icon, opening that list: always "Rank N", whatever
               the UI language; no rank yet (unrated, or rated since the last daily update), a grey "awaiting rank". -->
          <UiTooltip :text="$t(ranking ? 'reviews.score.rank_hint' : 'reviews.score.rank_pending_hint')">
            <NuxtLink
              :to="{ path: '/albums', query: { sort: 'top_rated' } }"
              class="mt-1 inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold tabular-nums transition-colors duration-150"
              :class="ranking
                ? 'bg-[oklch(0.86_0.1_85)]/35 text-[oklch(0.4_0.08_70)] hover:bg-[oklch(0.86_0.1_85)]/60 dark:bg-[oklch(0.86_0.1_85)]/15 dark:text-[oklch(0.86_0.1_85)] dark:hover:bg-[oklch(0.86_0.1_85)]/25'
                : 'bg-black/[0.05] text-meta hover:bg-black/[0.09] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]'"
            >
              <Award :size="13" class="shrink-0" />
              {{ ranking ? `Rank ${ranking.toLocaleString('en-US')}` : $t('reviews.score.rank_pending') }}
            </NuxtLink>
          </UiTooltip>
        </div>
      </div>

      <!-- One bar: positive, mixed and negative by count; nobody yet, three equal parts. A group nobody is in keeps a
           sliver of its colour (min-w-1), narrower than any group somebody is in (min-w-2). Each part's hover area
           takes in the gap before it and reaches past the bar, so its tooltip glides from part to part. -->
      <div class="-mb-1.5 mt-2.5 flex">
        <UiTooltip v-for="(group, index) in groups" :key="group.band" group="album-rating" :offset="2" :text="group.tip">
          <div
            class="box-content py-1.5 transition-[flex-grow] duration-300 ease-out"
            :class="[index > 0 && 'pl-0.5', group.count > 0 ? 'min-w-2' : 'min-w-1']"
            :style="{ flex: `${group.weight} 1 0%` }"
          >
            <div class="h-1.5" :class="[REVIEW_BAND_COLORS[group.band].solid, index === 0 && 'rounded-l-full', index === groups.length - 1 && 'rounded-r-full']" />
          </div>
        </UiTooltip>
      </div>

      <!-- The groups' shares and counts in three columns, as under Metacritic's bar. -->
      <div class="mt-3 grid grid-cols-3 divide-x divide-line text-center">
        <div v-for="group in groups" :key="group.band" class="min-w-0 px-1">
          <p class="truncate text-[13px] font-bold leading-5 text-title"><span class="tabular-nums">{{ group.share }}%</span> {{ $t(`reviews.score.group.${group.band}`) }}</p>
          <p class="truncate text-xs leading-5 tabular-nums text-meta">{{ $t('reviews.score.ratings', { count: number.format(group.count) }, group.count) }}</p>
        </div>
      </div>

      <!-- A small button centred under the columns, not a full-width bar. -->
      <div class="mt-4 flex justify-center">
        <UiButton variant="primary" size="xs" :icon="PenLine" @click="emit('writeReview')">
          {{ $t(reviewed ? 'reviews.edit' : 'reviews.write') }}
        </UiButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ReviewRating } from '~/types/reviews'
import type { ReviewBand } from '~/utils/reviewRating'
import { Award, Heart, PenLine } from '@lucide/vue'

/** The album's rating: average and per-level counts of the visible reviews. Ratings are given in the review editor. */
const props = defineProps<{
  rating: number | null
  ratingCount: number
  distribution: number[] | null
  /** Place in the 高评分 list (1 = best), recomputed daily; null when unrated or not ranked yet */
  ranking?: number | null
  /** Whether the visitor has reviewed the album, rated or not */
  reviewed?: boolean
}>()
const emit = defineEmits<{ writeReview: [] }>()

const { t, locale } = useI18n()
const number = computed(() => new Intl.NumberFormat(locale.value))

const MIN_RATINGS = 5

// Metacritic's verdicts (out of 100: 90 / 75 / 50 / 20) on the 1–5 scale, where 1 is 0 and 5 is 100.
const VERDICTS = [
  { from: 4.6, verdict: 'acclaim' },
  { from: 4, verdict: 'favorable' },
  { from: 3, verdict: 'mixed' },
  { from: 1.8, verdict: 'unfavorable' },
  { from: 0, verdict: 'dislike' },
]

/** The score once enough people rated, else null (the square shows TBD). Bands go by the rounded value shown. */
const score = computed(() => {
  if (props.rating === null || props.ratingCount < MIN_RATINGS) return null
  const shown = Math.round(props.rating * 10) / 10
  return { value: shown.toFixed(1), verdict: VERDICTS.find(band => shown >= band.from)!.verdict, band: reviewRatingBand(shown) }
})

const countOf = (value: ReviewRating) => props.distribution?.[value - 1] ?? 0
const GROUPS: { band: ReviewBand, levels: ReviewRating[] }[] = [
  { band: 'positive', levels: [5, 4] },
  { band: 'mixed', levels: [3] },
  { band: 'negative', levels: [2, 1] },
]
const groups = computed(() => GROUPS.map((group) => {
  const count = group.levels.reduce((sum, value) => sum + countOf(value), 0)
  const share = props.ratingCount > 0 ? Math.round((count / props.ratingCount) * 100) : 0
  const levels = group.levels.map(value => `${t(reviewRatingKey(value))} ${number.value.format(countOf(value))}`).join(' / ')
  return { ...group, count, share, weight: props.ratingCount === 0 ? 1 : count, tip: `${t(`reviews.score.group.${group.band}`)} ${share}% · ${levels}` }
}))
</script>
