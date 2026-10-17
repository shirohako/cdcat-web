// Works (乐曲): the song a track is a recording of. Backend: docs/api/works.md.

import type { AlbumSimple } from './album'
import type { CatalogAttribute, CatalogCredit, CatalogLink, CatalogTitle } from './catalog'
import type { LyricSummary } from './lyric'

export const WORK_RELATIONS = [
  'arranged_from', 'arrangement', 'covered_from', 'cover', 'remixed_from', 'remix', 'medley', 'medley_source', 'version', 'related',
] as const
export type WorkRelation = typeof WORK_RELATIONS[number]

export const ENTRY_WORK_RELATIONS = ['bgm', 'opening', 'ending', 'insert_song', 'theme_song', 'character_song', 'image_song', 'other'] as const
export type EntryWorkRelation = typeof ENTRY_WORK_RELATIONS[number]

export interface WorkSimple {
  id: number
  title: string
  tracks_count: number
  /** Has original lyrics. */
  has_lyrics: boolean
  lyrics_count: number
  translations_count: number
}

export interface WorkTrack {
  id: number
  title: string
  duration: number | null
  disc_number: number | null
  track_number: number
  number_label: string | null
  album: AlbumSimple
}

/** GET /works/{id} */
export interface Work extends WorkSimple {
  titles: CatalogTitle[]
  description: string | null
  credits: Array<Omit<CatalogCredit, 'category'>>
  /** Composition credits found on its tracks, deduplicated. */
  track_credits: Array<{ role: string, credited_as: string | null, artist: { id: number, name: string } | null }>
  relations: Array<{ work: WorkSimple, relation_type: WorkRelation, note: string | null }>
  entries: Array<{ id: number, name: string, slug: string | null, image_url: string | null, type: string, relation_type: EntryWorkRelation, episode: number | null, note: string | null }>
  tracks: WorkTrack[]
  lyrics: LyricSummary[]
  attributes: CatalogAttribute[]
  links: CatalogLink[]
  version: number
  created_at: string
  updated_at: string
}

/** Relations that point from an arrangement, cover, remix or medley to its 原曲 (original song). */
export const ORIGIN_RELATIONS = ['arranged_from', 'covered_from', 'remixed_from', 'medley_source'] as const

/** A candidate from POST /works/suggest: an existing work that may be the same song as a track. */
export interface WorkSuggestion {
  work_id: number
  title: string
  tracks_count: number
  albums: Array<{ id: number, title: string }>
  score: number
}
