// Albums, discs, tracks, editions and bonuses. Backend: docs/api/albums.md, data model docs/catalog/README.md.

import type { ApiResponse } from './api'
import type { CatalogAttribute, CatalogCredit, CatalogImage, CatalogLink, CatalogTitle, CatalogTitleKind, PendingFields, UserSummary } from './catalog'
import type { DatePrecision, EntryAlbumRelation, EntryType } from './entry'
import type { TrackingStatus } from './tracking'
import type { WorkSimple } from './work'

export const ALBUM_TYPES = ['album', 'ep', 'single', 'compilation', 'drama', 'radio'] as const
export type AlbumType = typeof ALBUM_TYPES[number]

/** VGMdb-style categories; an empty list means a composer's discography album. */
export const ALBUM_CATEGORIES = [
  'game', 'animation', 'publication', 'audio_drama', 'tokusatsu', 'live_action', 'multimedia_franchise', 'game_adjacent', 'event',
] as const
export type AlbumCategory = typeof ALBUM_CATEGORIES[number]

export const DISC_FORMATS = ['cd', 'sacd', 'dvd', 'bd', 'vinyl', 'cassette', 'digital', 'other'] as const
export type DiscFormat = typeof DISC_FORMATS[number]

export const IMAGE_KINDS = [
  'cover', 'front', 'back', 'booklet', 'disc', 'disc_back', 'obi_front', 'obi_back', 'tray', 'box', 'sticker', 'bonus_item', 'illustration', 'other',
] as const
export type ImageKind = typeof IMAGE_KINDS[number]

export const LABEL_ROLES = ['label', 'publisher', 'distributor', 'manufacturer', 'other'] as const
export type LabelRole = typeof LABEL_ROLES[number]

export type EditionType = 'regular' | 'limited'
export type MediumType = 'physical' | 'digital'

/** Album cards and lists (AlbumSimpleResource); the PT site reads the same shape. */
export interface AlbumSimple {
  id: number
  title: string
  slug: string | null
  type: AlbumType
  categories: AlbumCategory[]
  release_date: string | null
  release_date_precision: DatePrecision
  catalog_number: string | null
  image_url: string | null
  disc_count: number
  track_count: number
  duration: number
  disc_formats: DiscFormat[]
  is_adult: boolean
  favorites_count: number
  reviews_count: number
  views_count: number
  is_favorited: boolean
  /** Awaiting review; see PendingFields. */
  is_pending?: boolean
}

/** 用户收听状态统计（各状态的人数） */
export interface TrackingStats {
  plan_to_listen: number
  completed: number
  wishlist: number
  owned: number
  dropped: number
}

export interface AlbumArtistRef {
  id: number
  name: string
  type: string | null
  image_url: string | null
  credited_as: string | null
  /** Joins this artist to the next one, e.g. " feat. " or " × ". */
  join_phrase: string | null
}

export interface AlbumLabelRef {
  id: number
  name: string
  image_url: string | null
  role: LabelRole
  credited_as: string | null
}

export interface AlbumTrack {
  id: number
  disc_number: number
  track_number: number
  /** Printed number such as "A1" on vinyl; show `track_number` when null. */
  number_label: string | null
  title: string
  titles: CatalogTitle[]
  duration: number | null
  is_instrumental: boolean
  isrc: string | null
  favorites_count: number
  is_favorited: boolean
  work: WorkSimple | null
  credits: CatalogCredit[]
  attributes: CatalogAttribute[]
}

export interface AlbumDisc {
  id: number
  position: number
  title: string | null
  titles: CatalogTitle[]
  format: DiscFormat
  /** The bonus this disc comes with; null for the album's own discs. */
  bonus_id: number | null
  tracks: AlbumTrack[]
}

/** A language the tracklist can be shown in, with how many tracks have a name in it. */
export interface TracklistLanguage {
  locale: string
  kind: CatalogTitleKind
  count: number
  total: number
}

export interface AlbumProduct {
  id: number
  name: string | null
  edition_type: EditionType
  limited_rule: string | null
  limited_name: string | null
  medium: MediumType
  catalog_number: string | null
  barcode: string | null
  release_date: string | null
  release_date_precision: DatePrecision | null
  region: string | null
  price: string | null
  currency: string | null
  is_hires: boolean
  is_available: boolean
  sort_order: number
  disc_ids: number[]
  /** e.g. "2CD+BD"; "DL" for download editions. */
  format_label: string | null
}

export interface AlbumBonus {
  id: number
  name: string
  type: string
  description: string | null
  is_digital: boolean
  shop: string | null
  availability: string | null
  note: string | null
  sort_order: number
  event: { id: number, name: string, slug: string | null } | null
  /** Editions it comes with; empty means every edition. */
  product_ids: number[]
  disc_ids: number[]
}

export interface AlbumImage {
  id: number
  kind: ImageKind
  /** e.g. "p. 01-02" for booklet pages */
  label: string | null
  caption: string | null
  product_id: number | null
  bonus_id: number | null
  disc_id: number | null
  sort_order: number
  image: CatalogImage | null
  attributes: CatalogAttribute[]
}

/** 专辑关联的条目，含条目所属系列 */
export interface AlbumEntry {
  id: number
  name: string
  slug: string | null
  type: EntryType
  format: string | null
  image_url: string | null
  release_date: string | null
  relation_type: EntryAlbumRelation
  note: string | null
  franchises: Array<{ id: number, name: string, slug: string | null, parent_id: number | null }>
}

export interface AlbumArticle {
  id: number
  title: string
  cover_url: string | null
  published_at: string | null
}

/** GET /albums/{id} */
export interface Album extends PendingFields {
  id: number
  title: string
  titles: CatalogTitle[]
  slug: string | null
  type: AlbumType
  categories: AlbumCategory[]
  release_date: string | null
  release_date_precision: DatePrecision
  release_event: { id: number, name: string, slug: string | null, main_visual_url: string | null, start_date: string | null } | null
  description: string | null
  is_adult: boolean
  banner_url: string | null
  catalog_number: string | null
  image_url: string | null
  cover: CatalogImage | null
  disc_count: number
  track_count: number
  duration: number
  disc_formats: DiscFormat[]
  artists: AlbumArtistRef[]
  labels: AlbumLabelRef[]
  discs: AlbumDisc[]
  tracklist_languages: TracklistLanguage[]
  credits: CatalogCredit[]
  products: AlbumProduct[]
  bonuses: AlbumBonus[]
  images: AlbumImage[]
  attributes: CatalogAttribute[]
  links: CatalogLink[]
  streaming: CatalogLink[]
  entries: AlbumEntry[]
  franchises: Array<{ id: number, name: string, slug: string | null, image_url: string | null }>
  tracking_stats: TrackingStats
  favorites_count: number
  reviews_count: number
  views_count: number
  /** Average of the visible review ratings (1–5, two decimals); null when nobody rated. */
  rating: number | null
  rating_count: number
  /** How many picked each rating: [count of 1, …, count of 5]; null when nobody rated. */
  rating_distribution: number[] | null
  ranking: number | null
  articles?: AlbumArticle[]
  contributors: Array<Omit<UserSummary, 'id'>>
  is_favorited: boolean
  user_tracking: { status: TrackingStatus, created_at: string, updated_at: string } | null
  version: number
  created_at: string
  updated_at: string
}

export type AlbumResponse = ApiResponse<Album>

/** A track on its own page (GET /tracks/{id}) and in favorites lists. */
export interface TrackDetail {
  id: number
  album_id: number
  disc_id: number
  disc_number: number | null
  track_number: number
  number_label: string | null
  title: string
  titles?: CatalogTitle[]
  duration: number | null
  is_instrumental: boolean
  isrc: string | null
  work_id: number
  has_lyrics: boolean
  translations_count: number
  favorites_count: number
  is_favorited: boolean
  /** Its album awaits review. */
  is_pending?: boolean
  work?: WorkSimple | null
  album?: AlbumSimple
  credits?: Array<Omit<CatalogCredit, 'category'>>
  attributes?: CatalogAttribute[]
  created_at: string
  updated_at: string
}
