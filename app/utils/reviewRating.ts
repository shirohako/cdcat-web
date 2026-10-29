import type { ReviewRating } from '~/types/reviews'

/** Rating levels from the most liked down, as the editor shows them. */
export const REVIEW_RATINGS: ReviewRating[] = [5, 4, 3, 2, 1]

const KEYS: Record<ReviewRating, string> = { 5: 'love', 4: 'like', 3: 'okay', 2: 'meh', 1: 'dislike' }

/** i18n key of a rating label: reviews.ratings.love … reviews.ratings.dislike. */
export const reviewRatingKey = (rating: ReviewRating) => `reviews.ratings.${KEYS[rating]}`

/** Chip classes (text and background) for a rating. */
export const reviewRatingTone = (rating: ReviewRating) => ({
  5: 'bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-400/15 dark:text-rose-300 dark:ring-rose-400/25',
  4: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/25',
  3: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/25',
  2: 'bg-btn text-btn-content ring-line',
  1: 'bg-faint/20 text-meta ring-faint/40',
})[rating]

export type ReviewBand = 'positive' | 'mixed' | 'negative'

/** A rating's band, grouped as Metacritic groups scores: 4–5 positive, 3 mixed, 1–2 negative. An average goes by its value. */
export const reviewRatingBand = (value: number): ReviewBand => value >= 4 ? 'positive' : value >= 3 ? 'mixed' : 'negative'

/**
 * Each level's colours, a soft green-to-red scale after Metacritic's (less chroma than Tailwind's): sage, pistachio,
 * honey, apricot, coral. `solid` carries dark text in its own hue, `pale` is for the unpicked parts of the rating picker.
 */
export const REVIEW_LEVEL_COLORS: Record<ReviewRating, { solid: string, pale: string }> = {
  5: { solid: 'bg-[oklch(0.8_0.09_165)] text-[oklch(0.32_0.06_165)]', pale: 'bg-[oklch(0.8_0.09_165)]/35' },
  4: { solid: 'bg-[oklch(0.84_0.09_130)] text-[oklch(0.34_0.06_130)]', pale: 'bg-[oklch(0.84_0.09_130)]/35' },
  3: { solid: 'bg-[oklch(0.86_0.1_85)] text-[oklch(0.36_0.07_70)]', pale: 'bg-[oklch(0.86_0.1_85)]/40' },
  2: { solid: 'bg-[oklch(0.82_0.1_50)] text-[oklch(0.36_0.08_45)]', pale: 'bg-[oklch(0.82_0.1_50)]/35' },
  1: { solid: 'bg-[oklch(0.78_0.1_20)] text-[oklch(0.34_0.08_20)]', pale: 'bg-[oklch(0.78_0.1_20)]/35' },
}

/** A band's colours: those of its strongest level (5, 3 and 1). */
export const REVIEW_BAND_COLORS: Record<ReviewBand, { solid: string, pale: string }> = {
  positive: REVIEW_LEVEL_COLORS[5],
  mixed: REVIEW_LEVEL_COLORS[3],
  negative: REVIEW_LEVEL_COLORS[1],
}
