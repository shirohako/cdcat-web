// Lyrics belong to tracks and are post-moderated. Backend: docs/api/lyrics.md.

import type { AlbumSimple } from './album'
import type { UserSummary } from './catalog'

export const LYRIC_KINDS = ['original', 'translation', 'transliteration'] as const
export type LyricKind = typeof LYRIC_KINDS[number]

export const LYRIC_FORMATS = ['plain', 'lrc', 'srt'] as const
export type LyricFormat = typeof LYRIC_FORMATS[number]

/** A lyric without its text, as lists return it. */
export interface LyricSummary {
  id: number
  track_id: number
  kind: LyricKind
  language: string
  translation_of_id: number | null
  format: LyricFormat
  translator: string | null
  is_ai_generated: boolean
  creator: UserSummary | null
  version: number
  updated_at: string
}

export interface Lyric extends LyricSummary {
  content: string
  source: string | null
  track?: { id: number, title: string, disc_number: number | null, track_number: number, album: AlbumSimple }
  created_at: string
}

/** Fields sent to POST /tracks/{id}/lyrics and PUT /lyrics/{id}. */
export interface LyricInput {
  kind: LyricKind
  language: string
  format: LyricFormat
  content: string
  translation_of_id?: number | null
  source?: string | null
  translator?: string | null
  is_ai_generated?: boolean
  summary?: string | null
}
