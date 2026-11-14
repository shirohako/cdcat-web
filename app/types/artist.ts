// Artists. Backend: docs/api/artists.md.

import type { AlbumSimple } from './album'
import type { CatalogAttribute, CatalogImage, CatalogLink, CatalogTitle, PendingFields } from './catalog'

export const ARTIST_TYPES = ['person', 'group', 'company', 'virtual', 'circle', 'character'] as const
export type ArtistType = typeof ARTIST_TYPES[number]

/** Relations as seen from the artist on the page. A sub-unit is a member of its group. */
export const ARTIST_RELATIONS = ['member_of', 'has_member', 'voice_of', 'voiced_by', 'alias', 'related'] as const
export type ArtistRelation = typeof ARTIST_RELATIONS[number]

/** Relations that can be over ("ended"): memberships and voices; an alias or "related" cannot (App\Enums\ArtistRelation::canEnd). */
export const ENDING_RELATIONS: readonly string[] = ['member_of', 'has_member', 'voice_of', 'voiced_by']

/**
 * What the editor offers an artist of each type, the usual one first. Each type gets the side of a pair that fits it, so
 * nobody has to think about direction; the other side of any relation can still be entered from the other artist.
 */
export const RELATIONS_BY_TYPE: Record<ArtistType, readonly ArtistRelation[]> = {
  person: ['member_of', 'voice_of', 'alias', 'related'],
  group: ['has_member', 'member_of', 'alias', 'related'],
  circle: ['has_member', 'member_of', 'alias', 'related'],
  company: ['has_member', 'member_of', 'alias', 'related'],
  virtual: ['voiced_by', 'member_of', 'alias', 'related'],
  character: ['voiced_by', 'member_of', 'alias', 'related'],
}

/** The relations offered to an artist: all of them until it has a type. */
export const relationsFor = (type?: string | null): readonly ArtistRelation[] => RELATIONS_BY_TYPE[type as ArtistType] ?? ARTIST_RELATIONS

/** An artist image (GET /artists/{id}): an avatar, a banner, a photo …; `image` is null once the upload is gone. */
export interface ArtistImage {
  id: number
  kind: string
  label: string | null
  caption: string | null
  /** The main avatar or the main banner */
  is_primary: boolean
  sort_order: number
  image: CatalogImage | null
}

export interface ArtistDetail extends PendingFields {
  /** Whether search engines are offered this page: it has enough of its own to show (docs/seo in the API repo). Detail responses only. */
  indexable?: boolean
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
  /** The avatar, the banner and the other images, in order. */
  images?: ArtistImage[]
  relations?: Array<{
    artist: { id: number, name: string, image_url: string | null, type: ArtistType | null }
    relation_type: ArtistRelation
    /** A former member, a disbanded sub-unit, an earlier voice. */
    ended: boolean
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
  roles: Array<{ role: string, role_label?: string | null, credited_as: string | null, detail: string | null }>
}

/** GET /artists/{id}/tracks (参与的专辑): the artist's album-wide roles and credited tracks, grouped by album. */
export interface ArtistCreditedAlbum {
  album: AlbumSimple
  roles: Array<{ role: string, role_label?: string | null, credited_as: string | null, detail: string | null }>
  tracks: ArtistCreditedTrack[]
}

/** GET /artists/{id}/card: what a hover card shows. The same for every visitor. */
export interface ArtistCard {
  id: number
  name: string
  type: ArtistType | null
  image_url: string | null
  is_active: boolean
  is_pending: boolean
  /** Up to four other names. */
  titles: CatalogTitle[]
  /** The bio's first 160 characters on one line, or null. */
  bio: string | null
  albums_count: number
  followers_count: number
  /** The artist page's two album tabs: 发行的专辑 and 参与的专辑 */
  releases_count: number
  credited_albums_count: number
}
