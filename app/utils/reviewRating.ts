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

/** Bar fill for a rating in the distribution. */
export const reviewRatingBar = (rating: ReviewRating) => ({
  5: 'bg-rose-400',
  4: 'bg-amber-400',
  3: 'bg-sky-400',
  2: 'bg-meta',
  1: 'bg-faint',
})[rating]
