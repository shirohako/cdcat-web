// Artists. Backend: docs/api/artists.md.

import type { AlbumSimple, ReleaseRole } from './album'
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
  /** Companies and circles that act as labels. */
  catalog_prefixes: string[]
  /** The 发行的专辑 and 参与的专辑 tabs (GET /artists/{id} only). */
  releases_count?: number
  credited_albums_count?: number
  shouts_count: number
  /** The page's share card (og:image, 1200×630 JPEG); null until the backend has drawn it. */
  share_card_url?: string | null
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

/** A track the artist is credited on, with every role they had on it. */
export interface ArtistCreditedTrack {
  id: number
  title: string
  disc_position: number
  track_number: number
  number_label: string | null
  roles: Array<{ role: string, credited_as: string | null, detail: string | null }>
}

/** GET /artists/{id}/tracks (参与的专辑): the artist's album-wide roles and credited tracks, grouped by album. */
export interface ArtistCreditedAlbum {
  album: AlbumSimple
  roles: Array<{ role: string, credited_as: string | null, detail: string | null }>
  tracks: ArtistCreditedTrack[]
}

/** GET /artists/{id}/albums (发行的专辑): an album card with the artist's roles on it. */
export interface ArtistReleasedAlbum extends AlbumSimple {
  artist_roles: ReleaseRole[]
}
