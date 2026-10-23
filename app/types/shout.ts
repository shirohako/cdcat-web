// 留言 on artist pages: one per user per artist. Albums have reviews (types/reviews.ts). Backend: docs/api/shouts.md.

import type { UserSummary } from './catalog'

export const SHOUT_MAX_LENGTH = 1000

export interface Shout {
  id: number
  content: string
  user: UserSummary | null
  artist_id: number
  is_hidden: boolean
  created_at: string
  updated_at: string
}

export interface ShoutPage {
  shouts: Shout[]
  pagination: { total: number, per_page: number, current_page: number, last_page: number }
  /** The viewer's own shout on this page. */
  mine: Shout | null
}
