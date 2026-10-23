// 评价 on album pages: Markdown text with an optional 1–5 rating, one per user per album.
// Backend: docs/api/reviews.md.

import type { AlbumSimple } from './album'
import type { UserSummary } from './catalog'
import type { TrackingStatus } from './tracking'

export const REVIEW_MAX_LENGTH = 5000

/** 1 不喜欢 … 5 非常喜欢: how much the listener liked it, not a quality score. */
export type ReviewRating = 1 | 2 | 3 | 4 | 5

export type ReactionType = 'useful' | 'dislike' | 'fun'

export type ReviewSort = 'latest' | 'useful'

export interface AlbumReview {
  id: number
  user_id: number
  album_id: number
  content: string
  language: string | null
  rating: ReviewRating | null
  useful_count: number
  dislike_count: number
  fun_count: number
  /** Hidden by a moderator; only the writer still sees it. */
  is_hidden: boolean
  user?: UserSummary | null
  /** The writer's listening status of the album, in album lists. */
  tracking_status: TrackingStatus | null
  /** The viewer's reactions to this review. */
  my_reactions: ReactionType[]
  /** In the viewer's own list (/me/reviews). */
  album?: AlbumSimple
  created_at: string
  updated_at: string
}

export interface ReviewPagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface ReviewPage {
  reviews: AlbumReview[]
  pagination: ReviewPagination
  /** The viewer's own review of the album, hidden or not. */
  mine: AlbumReview | null
}

/** What the editor needs to edit an existing review. */
export type ReviewDraft = Pick<AlbumReview, 'album_id' | 'content' | 'rating' | 'language'> & {
  album?: { id: number, title: string, image_url: string | null }
}
