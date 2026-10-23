import type { ReviewRating } from '~/types/reviews'

/** Rating levels from the most liked down, as the editor shows them. */
export const REVIEW_RATINGS: ReviewRating[] = [5, 4, 3, 2, 1]

const KEYS: Record<ReviewRating, string> = { 5: 'love', 4: 'like', 3: 'okay', 2: 'meh', 1: 'dislike' }

/** i18n key of a rating label: reviews.ratings.love … reviews.ratings.dislike. */
export const reviewRatingKey = (rating: ReviewRating) => `reviews.ratings.${KEYS[rating]}`

/** Chip classes (text and background) for a rating. */
export const reviewRatingTone = (rating: ReviewRating) => ({
  5: 'bg-rose-50 text-rose-600 ring-rose-200',
  4: 'bg-amber-50 text-amber-700 ring-amber-200',
  3: 'bg-sky-50 text-sky-700 ring-sky-200',
  2: 'bg-slate-100 text-slate-600 ring-slate-200',
  1: 'bg-gray-100 text-gray-500 ring-gray-200',
})[rating]

/** Bar fill for a rating in the distribution. */
export const reviewRatingBar = (rating: ReviewRating) => ({
  5: 'bg-rose-400',
  4: 'bg-amber-400',
  3: 'bg-sky-400',
  2: 'bg-slate-400',
  1: 'bg-gray-300',
})[rating]
