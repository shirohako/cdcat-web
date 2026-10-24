// Shared shapes of the catalog API (albums, artists, labels, lyrics, entries, franchises).
// Backend docs: docs/api/catalog.md, versions.md, revisions.md; data model docs/catalog/README.md.

import type { DatePrecision } from './entry'

/** Aggregate types edited through revisions, as the API names them. */
export const CATALOG_TYPES = ['album', 'artist', 'label', 'lyric', 'entry', 'franchise'] as const
export type CatalogType = typeof CATALOG_TYPES[number]

/** URL segment of each type: /v1/albums/{id}/versions … */
export const CATALOG_RESOURCES: Record<CatalogType, string> = {
  album: 'albums', artist: 'artists', label: 'labels', lyric: 'lyrics', entry: 'entries', franchise: 'franchises',
}

/**
 * Content that went live at submission and awaits review (docs/catalog/editing.md#待审内容).
 * `pending_revision` is only shown to its submitter and to revisions.view.
 */
export interface PendingFields {
  is_pending?: boolean
  pending_revision?: { id: number, status: string } | null
}

export const TITLE_KINDS = ['official', 'translation', 'transliteration', 'alias', 'abbreviation'] as const
export type CatalogTitleKind = typeof TITLE_KINDS[number]

/** A name other than the primary one (which lives in `title` / `name`). */
export interface CatalogTitle {
  title: string
  locale: string | null
  kind: CatalogTitleKind
}

export interface CatalogLinkProvider {
  id: number
  name: string
  icon_url: string | null
  category: string
}

export interface CatalogLink {
  id: number
  url: string
  external_id: string | null
  is_verified: boolean
  provider: CatalogLinkProvider | null
}

export interface CatalogImage {
  id: number
  url: string
  thumbnail_url: string
  medium_url: string
  width: number
  height: number
  mime: string
}

/**
 * An attribute value. `value` follows the definition's type: text, url and choice are strings,
 * integer a number, decimal a decimal string, boolean a bool, date `{ date, precision }`,
 * reference `{ type, id }` (and `label` is the referenced item's name).
 */
export interface CatalogAttribute {
  id: number
  key: string
  value: unknown
  label: string | null
  sort_order: number
}

export type LocalizedText = Partial<Record<'en' | 'ja' | 'zh-Hans' | 'zh-Hant', string>>

export interface CreditRoleDefinition {
  key: string
  category: string
  names: LocalizedText
  is_album_role: boolean
  is_track_role: boolean
}

export interface AttributeDefinition {
  key: string
  names: LocalizedText
  description: LocalizedText | null
  group: string | null
  value_type: 'text' | 'integer' | 'decimal' | 'date' | 'url' | 'boolean' | 'choice' | 'reference'
  choices: Array<{ value: string, names: LocalizedText }> | null
  reference_types: string[] | null
  applies_to: string[]
  is_multiple: boolean
}

/** GET /catalog/schema */
export interface CatalogSchema {
  aggregates: Record<string, unknown>
  enums: Record<string, string[]>
  credit_roles: CreditRoleDefinition[]
  attribute_definitions: AttributeDefinition[]
  link_providers: Array<CatalogLinkProvider & { url_pattern: string | null }>
  limits: { cover_min_size: number, cover_square_tolerance: number, image_max_bytes: number }
}

/** A credit on an album or a track. `artist` is null when only a printed name is known. */
export interface CatalogCredit {
  id: number
  role: string
  category?: string | null
  artist: { id: number, name: string, image_url?: string | null } | null
  credited_as: string | null
  detail: string | null
}

/** A user as other content shows them (author, submitter, reviewer …): the API's id, username, nickname and avatar_url. */
export interface UserSummary {
  id: number
  username: string
  nickname: string
  avatar_url: string | null
}

// ── Versions ────────────────────────────────────────────────────────────────

export type VersionCause = 'bootstrap' | 'create' | 'edit' | 'delete' | 'restore' | 'merge' | 'relation' | 'auto' | 'purge'

export interface ChangeSummary {
  fields: number
  collections: Record<string, { added: number, removed: number, changed: number }>
}

export interface ContentVersion {
  version: number
  cause: VersionCause
  is_deleted: boolean
  summary: ChangeSummary | null
  reason: string | null
  revision_id: number | null
  actor: UserSummary | null
  snapshot?: Record<string, unknown> | null
  created_at: string
}

/** One change: a root field (`["title"]`), a row field (`["tracks", 301, "title"]`), a row, or a reference set element. */
export interface ChangeOp {
  op: 'set' | 'add' | 'remove'
  path: Array<string | number>
  from?: unknown
  to?: unknown
  value?: unknown
}

/** What the ids of a document point at, by type and id. */
export type CatalogReferences = Partial<Record<string, Record<string, Record<string, unknown>>>>

export interface VersionDiff {
  from: number | null
  to: number
  changes: ChangeOp[]
  summary: ChangeSummary
  references: CatalogReferences
}

export interface DatedValue {
  date: string | null
  precision: DatePrecision | null
}
