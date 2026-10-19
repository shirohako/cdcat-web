/** An event edition with its venue (GET /v1/events/{id}). See docs/api/events.md. */
export interface EventDetail {
  id: number
  event_series_id: number | null
  series: { id: number, name: string, slug: string, website: string | null, visual_orientation: 'portrait' | 'landscape' } | null
  name: string
  slug: string
  start_date: string | null
  end_date: string | null
  start_time: string | null
  end_time: string | null
  venue: string | null
  location: string | null
  website_url: string | null
  description: Record<string, string> | null
  main_visual_url: string | null
  main_visual_width: number | null
  main_visual_height: number | null
  circles_count?: number
  released_albums_count?: number
  has_map?: boolean
}

export interface VenueHall {
  id: number
  building: string
  floor: string | null
  name: string
  /** [x, y, width, height] in map units */
  bbox: [number, number, number, number]
}

/** [id, hall id, area, number, x, y, w, h] */
export type VenueSpaceRow = [number, number, string, string, number, number, number, number]

export interface VenueLabel {
  text: string
  x: number
  y: number
  size: number
  rotate?: number
  vertical?: boolean
  kind?: 'area'
}

export interface VenueMapData {
  width: number
  height: number
  /** Shapes in paint order; s is their lightness 0 (wall) … 1 (floor), e marks the even-odd rule. */
  background: { d: string, s: number, e?: 1 }[]
  labels: VenueLabel[]
  halls: VenueHall[]
  spaces: VenueSpaceRow[]
  genres: Record<string, { label: string, group: string }>
}

export interface EventCircle {
  id: number
  space_id: number | null
  space_code: string | null
  area: string | null
  /** a, b, ab (whole desk), x, y, z (mini spaces) */
  sub: string | null
  name: string
  name_kana: string | null
  description: string | null
  genre: string | null
  keywords: string[]
  links: { type: string, url: string }[]
  twitter_handle: string | null
  image_url: string | null
  embeds: { type: 'youtube', id: string }[]
  is_adult: boolean
  artist: { id: number, name: string, image_url: string | null } | null
  /** Albums of the circle's artist released at this event */
  album_ids: number[]
}
