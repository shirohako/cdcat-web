// Editable documents in the external form of GET /{resources}/{id}/document and POST /revisions.
// Rows carry an `id`: an existing row's integer id or a new row's key string. References to
// aggregates are ids or "@ref" of another item in the same revision. See docs/catalog/editing.md.

import type { CatalogTitleKind } from './catalog'
import type { DatePrecision } from './entry'

export type RowId = number | string
export type AggregateRef = number | string

export interface TitleRow { id: RowId, title: string, locale: string | null, kind: CatalogTitleKind, sort_order?: number }
export interface LinkRow { id: RowId, link_provider_id: number | null, url: string, sort_order?: number }
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
  banner_url: string | null
  titles: TitleRow[]
  artists: Array<{ id: RowId, artist_id: AggregateRef | null, credited_as: string | null, join_phrase: string | null, sort_order?: number }>
  labels: Array<{ id: RowId, label_id: AggregateRef | null, role: string, credited_as: string | null, sort_order?: number }>
  products: Array<{
    id: RowId, name: string | null, edition_type: string, medium: string, limited_rule: string | null, limited_name: string | null,
    catalog_number: string | null, barcode: string | null, release_date: string | null, release_date_precision: DatePrecision,
    region: string | null, price: string | null, currency: string | null, is_hires: boolean, is_available: boolean, sort_order?: number, disc_ids: RowId[]
  }>
  bonuses: Array<{
    id: RowId, name: string, type: string, description: string | null, is_digital: boolean, shop: string | null,
    availability: string | null, note: string | null, event_id: number | null, sort_order?: number, product_ids: RowId[]
  }>
  discs: Array<{ id: RowId, position: number, title: string | null, format: string, bonus_id: RowId | null }>
  disc_titles: Array<TitleRow & { disc_id: RowId }>
  tracks: Array<{
    id: RowId, disc_id: RowId, track_number: number, number_label: string | null, title: string, duration: number | null,
    is_instrumental: boolean, isrc: string | null, work_id: AggregateRef | null
  }>
  track_titles: Array<TitleRow & { track_id: RowId }>
  disc_tocs: Array<{ id: RowId, disc_id: RowId, first_track: number, last_track: number, leadout_offset: number, offsets: number[], source: string }>
  credits: Array<{ id: RowId, track_id: RowId | null, artist_id: AggregateRef | null, credited_as: string | null, role: string, detail: string | null, sort_order?: number }>
  images: Array<{
    id: RowId, image_id: number, kind: string, label: string | null, caption: string | null,
    product_id: RowId | null, bonus_id: RowId | null, disc_id: RowId | null, sort_order?: number
  }>
  attributes: AttributeRow[]
  track_attributes: Array<AttributeRow & { track_id: RowId }>
  image_attributes: Array<AttributeRow & { album_image_id: RowId }>
  links: LinkRow[]
  entries: Array<{ id: RowId, entry_id: AggregateRef | null, relation_type: string, note: string | null }>
}

export interface ArtistDocument {
  name: string
  slug: string | null
  type: string
  is_active: boolean
  bio: string | null
  image_url: string | null
  titles: TitleRow[]
  links: LinkRow[]
  attributes: AttributeRow[]
  relations: Array<{ id: RowId, related_artist_id: AggregateRef | null, relation_type: string, note: string | null }>
}

export interface LabelDocument {
  name: string
  slug: string | null
  parent_id: AggregateRef | null
  country: string | null
  description: string | null
  image_url: string | null
  begin_date: string | null
  begin_date_precision: DatePrecision
  end_date: string | null
  end_date_precision: DatePrecision
  catalog_prefixes: string[]
  titles: TitleRow[]
  links: LinkRow[]
  attributes: AttributeRow[]
}

export interface WorkDocument {
  title: string
  description: string | null
  titles: TitleRow[]
  credits: Array<{ id: RowId, artist_id: AggregateRef | null, credited_as: string | null, role: string, detail: string | null, sort_order?: number }>
  relations: Array<{ id: RowId, related_work_id: AggregateRef | null, relation_type: string, note: string | null }>
  entries: Array<{ id: RowId, entry_id: AggregateRef | null, relation_type: string, episode: number | null, note: string | null, sort_order?: number }>
  links: LinkRow[]
  attributes: AttributeRow[]
}

export interface EntryDocument {
  name: string
  slug: string | null
  type: string
  format: string | null
  platforms: string[]
  release_date: string | null
  release_date_precision: DatePrecision
  episodes: number | null
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
