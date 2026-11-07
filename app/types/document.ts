// Editable documents in the external form of GET /{resources}/{id}/document and POST /revisions.
// Rows carry an `id`: an existing row's integer id or a new row's key string. References to
// aggregates are ids or "@ref" of another item in the same revision. See docs/catalog/editing.md.

import type { CatalogTitleKind } from './catalog'
import type { DatePrecision } from './entry'

export type RowId = number | string
export type AggregateRef = number | string

/** One price of an edition (products.prices): kind list 定价 · event 会场价 · shop 通贩价 · other; tax_included null = not stated. */
export type PriceKind = 'list' | 'event' | 'shop' | 'other'
export interface ProductPrice { kind: PriceKind, note: string | null, amount: string, currency: string, tax_included: boolean | null }

export interface TitleRow { id: RowId, title: string, locale: string | null, kind: CatalogTitleKind, sort_order?: number }
export interface LinkRow { id: RowId, link_provider_id: number | null, url: string, label?: string | null, sort_order?: number }
export interface AttributeRow { id: RowId, key: string, value: unknown, sort_order?: number }

export interface AlbumDocument {
  title: string
  slug: string | null
  type: string | null
  categories: string[]
  release_date: string | null
  release_date_precision: DatePrecision
  release_event_id: number | null
  description: string | null
  is_adult: boolean
  titles: TitleRow[]
  products: Array<{
    id: RowId, name: string | null, edition_type: string, medium: string, limited_rule: string | null, limited_name: string | null,
    catalog_number: string | null, barcode: string | null, release_date: string | null, release_date_precision: DatePrecision,
    region: string | null, prices: ProductPrice[], note: string | null, is_hires: boolean, is_available: boolean, sort_order?: number, disc_ids: RowId[]
  }>
  bonuses: Array<{
    id: RowId, name: string, type: string, description: string | null, is_digital: boolean, shop: string | null,
    availability: string | null, note: string | null, event_id: number | null, sort_order?: number, product_ids: RowId[]
  }>
  discs: Array<{ id: RowId, position: number, title: string | null, format: string, bonus_id: RowId | null }>
  disc_titles: Array<TitleRow & { disc_id: RowId }>
  tracks: Array<{
    id: RowId, disc_id: RowId, track_number: number, number_label: string | null, title: string, duration: number | null,
    is_instrumental: boolean, isrc: string | null
  }>
  /** 原曲 of a track: a saved track elsewhere in the catalog, or only a name. Exactly one of the two is set. */
  track_originals: Array<{ id: RowId, track_id: RowId, original_track_id: number | null, original_title: string | null, sort_order?: number }>
  track_titles: Array<TitleRow & { track_id: RowId }>
  /**
   * A CD's table of contents, one per pressing: start sectors of every track (lead-in included, a data track too) and
   * the disc's lead-out; data_track marks an Enhanced CD's last track or a mixed-mode CD's first. The server computes the ids.
   */
  disc_tocs: Array<{ id: RowId, disc_id: RowId, first_track: number, last_track: number, leadout_offset: number, offsets: number[], data_track: number | null, source: string }>
  /** parent_id: the credit of the same track (or album) this one belongs to, a 客串's 艺术家 (utils/artistLine) */
  credits: Array<{ id: RowId, track_id: RowId | null, artist_id: AggregateRef | null, credited_as: string | null, parent_id?: RowId | null, role: string, role_label?: string | null, join_phrase?: string | null, detail: string | null, sort_order?: number }>
  /** is_primary marks the main cover and banner (albums.image_url and banner_url are derived from them). */
  images: Array<{
    id: RowId, image_id: number, kind: string, label: string | null, caption: string | null,
    product_id: RowId | null, bonus_id: RowId | null, disc_id: RowId | null, is_primary?: boolean, sort_order?: number
  }>
  attributes: AttributeRow[]
  track_attributes: Array<AttributeRow & { track_id: RowId }>
  image_attributes: Array<AttributeRow & { album_image_id: RowId }>
  links: LinkRow[]
  entries: Array<{ id: RowId, entry_id: AggregateRef | null, relation_type: string, note: string | null }>
}

/** An artist image: an avatar, a banner, a photo …; is_primary marks the main avatar and banner. */
export interface ArtistImageRow { id: RowId, image_id: number, kind: string, label: string | null, caption: string | null, is_primary?: boolean, sort_order?: number }

export interface ArtistDocument {
  name: string
  slug: string | null
  /** Required; new artists start without one so it is chosen, not assumed. */
  type: string | null
  is_active: boolean
  bio: string | null
  /** Companies and circles that act as labels, e.g. ["LACA", "LACM"]. */
  catalog_prefixes: string[]
  titles: TitleRow[]
  links: LinkRow[]
  attributes: AttributeRow[]
  relations: Array<{ id: RowId, related_artist_id: AggregateRef | null, relation_type: string, ended?: boolean, note: string | null }>
  /** The artist's picture (image_url) is derived from the main avatar. */
  images: ArtistImageRow[]
}

export interface EntryDocument {
  name: string
  slug: string | null
  type: string
  format: string | null
  platforms: string[]
  release_date: string | null
  release_date_precision: DatePrecision
  description: string | null
  image_url: string | null
  banner_url: string | null
  titles: TitleRow[]
  links: LinkRow[]
  albums: Array<{ id: RowId, album_id: AggregateRef | null, relation_type: string, note: string | null }>
  relations: Array<{ id: RowId, related_entry_id: AggregateRef | null, relation_type: string, note: string | null }>
}

export interface FranchiseDocument {
  name: string
  slug: string | null
  parent_id: AggregateRef | null
  description: string | null
  image_url: string | null
  banner_url: string | null
  sort_order: number
  titles: TitleRow[]
  links: LinkRow[]
  entries: Array<{ id: RowId, entry_id: AggregateRef | null, sort_order?: number }>
  albums: Array<{ id: RowId, album_id: AggregateRef | null, sort_order?: number }>
}
