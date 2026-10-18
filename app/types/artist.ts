// Artists. Backend: docs/api/artists.md.

import type { CatalogAttribute, CatalogLink, CatalogTitle, PendingFields } from './catalog'

export const ARTIST_TYPES = ['person', 'group', 'company', 'virtual', 'circle', 'character'] as const
export type ArtistType = typeof ARTIST_TYPES[number]

/** Relations as seen from the artist on the page. */
export const ARTIST_RELATIONS = ['member_of', 'has_member', 'voice_of', 'voiced_by', 'persona_of', 'has_persona', 'subunit_of', 'has_subunit', 'related'] as const
export type ArtistRelation = typeof ARTIST_RELATIONS[number]

export interface ArtistDetail extends PendingFields {
  id: number
  name: string
  slug: string | null
  type: ArtistType | null
  is_active: boolean
  bio: string | null
  image_url: string | null
  followers_count: number
  albums_count: number
  shouts_count: number
  is_favorited: boolean
  titles?: CatalogTitle[]
  links?: CatalogLink[]
  attributes?: CatalogAttribute[]
  relations?: Array<{
    artist: { id: number, name: string, image_url: string | null, type: ArtistType | null }
    relation_type: ArtistRelation
    note: string | null
  }>
  version: number
  created_at: string
  updated_at: string
}
