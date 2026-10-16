// Entries (anime, games, films …) and series (franchises). Design: backend docs/entries/README.md.

export const ENTRY_TYPES = ['anime', 'game', 'movie', 'tv', 'book', 'manga', 'stage', 'other'] as const
export type EntryType = typeof ENTRY_TYPES[number]

/** Formats allowed per type; an empty list means the type has no format. Mirrors App\Enums\EntryType. */
export const ENTRY_FORMATS: Record<EntryType, string[]> = {
  anime: ['tv', 'movie', 'ova', 'web', 'special'],
  game: ['full', 'dlc', 'expansion'],
  movie: [],
  tv: ['series', 'special'],
  book: ['novel', 'light_novel', 'other'],
  manga: ['serial', 'oneshot'],
  stage: ['musical', 'play'],
  other: [],
}

export const ENTRY_TYPE_ICONS: Record<EntryType, string> = {
  anime: 'lucide:sparkles',
  game: 'lucide:gamepad-2',
  movie: 'lucide:film',
  tv: 'lucide:tv',
  book: 'lucide:book-open',
  manga: 'lucide:book-image',
  stage: 'lucide:drama',
  other: 'lucide:shapes',
}

/** Relations as seen from the current entry; the backend stores one row and derives the inverse. */
export const ENTRY_RELATIONS = [
  'sequel', 'prequel', 'side_story', 'main_story', 'spin_off', 'spin_off_of',
  'adaptation', 'source', 'remake', 'remake_of', 'alternative', 'shared_world', 'related',
] as const
export type EntryRelation = typeof ENTRY_RELATIONS[number]

export const ENTRY_WORK_RELATIONS = [
  'opening', 'ending', 'insert_song', 'theme_song', 'character_song', 'image_song', 'ost', 'drama', 'other',
] as const
export type EntryWorkRelation = typeof ENTRY_WORK_RELATIONS[number]

export const TITLE_KINDS = ['official', 'alias', 'abbreviation'] as const
export type TitleKind = typeof TITLE_KINDS[number]

/** Locales offered in the title editor; any BCP 47 tag is accepted by the API. */
export const TITLE_LOCALES = ['ja', 'ja-Latn', 'zh-Hans', 'zh-Hant', 'en', 'ko'] as const

export const DATE_PRECISIONS = ['day', 'month', 'year'] as const
export type DatePrecision = typeof DATE_PRECISIONS[number]

export interface Title {
  title: string
  locale: string | null
  kind: TitleKind
  is_primary: boolean
}

export interface NamedItem {
  name: string
  titles?: Title[]
}

export interface LinkItem {
  id: number
  url: string
  provider?: { id: number, name: string, category: string } | null
  [key: string]: unknown
}

export interface EntrySummary extends NamedItem {
  id: number
  slug: string | null
  type: EntryType
  format: string | null
  platforms?: string[] | null
  release_date: string | null
  release_date_precision: DatePrecision
  episodes?: number | null
  description?: string | null
  image_url: string | null
  banner_url?: string | null
  works_count?: number
  sort_order?: number
}

export interface EntryWork {
  id: number
  title: string
  image_url: string | null
  release_date: string | null
  catalog_number: string | null
  relation_type: EntryWorkRelation
  character_name: string | null
  episode: number | null
  note: string | null
}

export interface RelatedEntry {
  id: number
  name: string
  slug: string | null
  type: EntryType
  format: string | null
  image_url: string | null
  release_date: string | null
  release_date_precision: DatePrecision
  relation_type: EntryRelation
  note: string | null
}

export interface EntryDetail extends EntrySummary {
  meta: Record<string, unknown> | null
  links: LinkItem[]
  works: EntryWork[]
  franchises: Array<{ id: number, name: string, slug: string | null, image_url: string | null, parent: { id: number, name: string, slug: string | null } | null }>
  related_entries: RelatedEntry[]
}

export interface FranchiseSummary extends NamedItem {
  id: number
  slug: string | null
  parent_id: number | null
  description: string | null
  image_url: string | null
  banner_url: string | null
  entries_count?: number
  works_count?: number
  children_count?: number
  parent?: { id: number, name: string, slug: string | null } | null
}

export interface FranchiseWork {
  id: number
  title: string
  image_url: string | null
  release_date: string | null
  catalog_number: string | null
  sort_order?: number
  entries?: Array<{ id: number, name: string, type: EntryType, relation_type: EntryWorkRelation }>
}

export interface FranchiseDetail extends FranchiseSummary {
  links: LinkItem[]
  children: Array<FranchiseSummary & { entries: EntrySummary[] }>
  entries: EntrySummary[]
  works: FranchiseWork[]
}

export interface Pagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

// Revision schemas (GET /entries/{id}/schema, /franchises/{id}/schema) and Bangumi previews, as the forms read them.
export interface SchemaTitle {
  title?: string
  locale?: string | null
  kind?: TitleKind
  is_primary?: boolean
}

export interface SchemaLink {
  id?: number
  link_provider_id?: number
  url?: string
  meta?: Record<string, unknown> | null
}

interface SchemaCommon {
  name?: string
  titles?: SchemaTitle[]
  slug?: string | null
  description?: string | null
  image_url?: string | null
  banner_url?: string | null
  meta?: Record<string, unknown> | null
  links?: SchemaLink[]
  baseline_checksum?: string
}

export interface EntrySchema extends SchemaCommon {
  type?: string
  format?: string | null
  platforms?: string[] | null
  release_date?: string | null
  release_date_precision?: DatePrecision
  episodes?: number | null
  related_works?: Array<{ id: number | string, relation_type?: EntryWorkRelation, character_name?: string | null, episode?: number | null, note?: string | null }>
  related_entries?: Array<{ id: number | string, relation_type?: EntryRelation, note?: string | null }>
}

export interface FranchiseSchema extends SchemaCommon {
  parent_id?: number | null
  sort_order?: number
  related_entries?: Array<{ id: number | string, sort_order?: number }>
  related_works?: Array<{ id: number | string, sort_order?: number }>
}
