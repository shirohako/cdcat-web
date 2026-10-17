// 留言 on album and artist pages: one per user per page. Backend: docs/api/shouts.md.

import type { UserSummary } from './catalog'
import type { TrackingStatus } from './tracking'

export const SHOUT_MAX_LENGTH = 300

export interface Shout {
  id: number
  content: string
  user: UserSummary | null
  /** The writer's listening status of the album, on album pages. */
  tracking_status: TrackingStatus | null
  album_id: number | null
  artist_id: number | null
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
