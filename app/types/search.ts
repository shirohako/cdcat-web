import type { AlbumSimple } from '~/types/album'

/** GET /v1/search (docs/api/search.md) */
export const SEARCH_TYPES = ['album', 'track', 'artist', 'entry', 'franchise'] as const
export type SearchType = typeof SEARCH_TYPES[number]

export interface SearchMatched {
  /** name, official, translation, transliteration, alias, abbreviation, catalog_number, barcode, credited_as, prefix, slug, artist */
  field: string
  text: string
  locale: string | null
}

export interface SearchResult {
  type: SearchType
  id: number
  title: string
  image_url: string | null
  is_pending: boolean
  matched: SearchMatched | null
  /** Subtitle data, by type */
  meta: Record<string, unknown>
  /** Albums and tracks: the album card */
  album?: AlbumSimple | null
}

export interface SearchGroup {
  type: SearchType
  total: number
  total_is_capped: boolean
  items: SearchResult[]
}

export interface SearchQueryEcho {
  phrase: string
  terms: string[]
}

export interface SearchGroupsResponse {
  query: SearchQueryEcho
  groups: SearchGroup[]
}

export interface SearchPageResponse {
  query: SearchQueryEcho
  results: SearchResult[]
  pagination: { total: number, per_page: number, current_page: number, last_page: number }
  total_is_capped: boolean
}
