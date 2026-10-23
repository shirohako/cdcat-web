/**
 * Harvesting (docs/harvest/README.md): bundles harvesters hand in, and the review queue. The
 * harvester itself (settings, runs) is a separate program with its own page.
 */

export interface HarvestEventSummary {
  id: number
  name: string
  slug: string | null
  start_date: string | null
}

export interface HarvestOverviewRow {
  event: HarvestEventSummary
  candidates: Partial<Record<HarvestCandidateStatus, number>>
  circles: number
  covered_circles: number
  /** When a harvester last saw one of the event's items listed. */
  last_seen_at: string | null
}

/** What one source handed in for an event. */
export interface HarvestEventSource {
  source: string
  label: string
  records: number
  delisted: number
  gone: number
  non_music: number
  last_seen_at: string | null
  updated_at: string | null
}

export interface HarvestEventDetail {
  event: HarvestEventSummary & { circles: number }
  sources: HarvestEventSource[]
  candidates: Partial<Record<HarvestCandidateStatus, number>>
  unprocessed: number
}

export type HarvestSubmissionVia = 'upload' | 'api' | 'command'

export interface HarvestSubmission {
  id: number
  via: HarvestSubmissionVia
  file_name: string | null
  records: number
  counts: Partial<Record<'records' | 'new' | 'changed' | 'unchanged' | 'stale' | 'invalid' | 'unknown_event', number>>
  errors: string[]
  harvester_instance: string | null
  harvester_version: string | null
  site: string | null
  user: { id: number, username: string, nickname: string | null } | null
  created_at: string | null
}

export interface HarvestToken {
  id: number
  name: string
  created_at: string | null
  last_used_at: string | null
  /** Only in the answer to creating it. */
  token?: string
}

export type HarvestCandidateStatus = 'pending' | 'approving' | 'approved' | 'linked' | 'rejected' | 'excluded' | 'merged'

export interface HarvestCandidateRow {
  id: number
  title: string
  circle_name: string | null
  artist_id: number | null
  event_circle_id: number | null
  circle_by: string | null
  status: HarvestCandidateStatus
  release_kind: 'first' | 'resale' | 'unknown'
  is_adult: boolean
  has_cover: boolean
  has_tracks: boolean
  tracks: number
  catalog_numbers: string[]
  sources: string[]
  cover_url: string | null
  duplicates: number
  strong_duplicate: boolean
  album_id: number | null
  reject_reason: string | null
  error: string | null
  reviewer: { id: number, username: string, nickname: string | null } | null
  reviewed_at: string | null
  sources_changed_at: string | null
  updated_at: string | null
}

export interface HarvestCoverageCircle {
  id: number
  name: string
  space_code: string | null
  genre: string | null
  artist_id: number | null
  description: string | null
  links: Array<{ type: string, url: string }>
  embeds: Array<{ type: string, id: string }>
  candidates: number
}

export type HarvestIdentityKind = 'circle_name' | 'credit_name' | 'shop_account' | 'db_artist' | 'role'

export interface HarvestIdentity {
  id: number
  kind: HarvestIdentityKind
  key: string
  label: string
  status: 'auto' | 'linked' | 'created' | 'ignored' | 'unresolved'
  type_hint: string | null
  credit_role: string | null
  occurrences: number
  artist: { id: number, name: string, type: string } | null
  candidates: Array<{ id: number, title: string, event_id: number }>
}

export interface HarvestPagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface HarvestPicked<T> {
  value: T | null
  source: string | null
  alternatives: Array<{ value: T, source: string, record_id: number }>
}

export interface HarvestMergedTrack {
  disc: number
  number: number
  numberLabel: string | null
  title: string
  titles?: Array<{ title: string, locale: string, kind: string }>
  duration: number | null
}

export interface HarvestMergedCredit {
  name: string
  raw_role: string
  role: string | null
  detail: string | null
  artist_id: number | null
  name_status: string
  track: { disc: number, number: number } | null
  source: string
}

export interface HarvestMerged {
  title: HarvestPicked<string>
  titles: Array<{ title: string, locale: string, kind: string, source: string }>
  circle: { name: string | null, artist_id: number | null, event_circle_id: number | null, by: string | null, source: string | null }
  release: { kind: 'first' | 'resale' | 'unknown', date: string | null, precision: 'day' | 'month' | 'year' | null, source: string | null, notes: string[] }
  catalog_numbers: HarvestPicked<string[]>
  barcode: HarvestPicked<string>
  price: HarvestPicked<{ amount: number, currency: string, note: string | null }>
  media: string[]
  kind_hint: string | null
  tracklist: {
    source: string | null
    record_id: number | null
    part: number | null
    discs: Array<{ position: number, title: string | null }>
    tracks: HarvestMergedTrack[]
    alternatives: Array<{ source: string, record_id: number, part: number, tracks: number }>
  }
  credits: HarvestMergedCredit[]
  images: Array<{ url: string, kind: string, width: number | null, height: number | null, source: string, referer: string }>
  links: Array<{ url: string, kind: string, source: string, provider_id: number | null, provider: string | null }>
  descriptions: Array<{ source: string, record_id: number, text: string }>
  notes: string[]
  sources: Array<{ source: string, record_id: number, part: number, url: string, kind: string, gone: boolean, delisted: boolean, title: string }>
}

export interface HarvestCandidateDetail {
  candidate: {
    id: number
    title: string
    circle_name: string | null
    artist_id: number | null
    event_circle_id: number | null
    circle_by: string | null
    status: HarvestCandidateStatus
    release_kind: 'first' | 'resale' | 'unknown'
    is_adult: boolean
    has_cover: boolean
    has_tracks: boolean
    lock_version: number
    reject_reason: string | null
    error: string | null
    flags: Record<string, unknown> | null
    album_id: number | null
    revision_id: number | null
    merged: HarvestMerged
    reviewer: { id: number, username: string, nickname: string | null } | null
    reviewed_at: string | null
    sources_changed_at: string | null
    album: { id: number, title: string } | null
  }
  event: HarvestEventSummary
  event_circle: { id: number, name: string, space_code: string | null, image_url: string | null, description: string | null, links: Array<{ type: string, url: string }> | null } | null
  records: Array<HarvestMerged['sources'][number] & { label: string, fetched_at: string | null, kind_reason: string | null }>
  duplicates: import('~/types/revision').DuplicateCandidate[]
  references: import('~/types/catalog').CatalogReferences
  neighbors: { previous: number | null, next: number | null, position: number | null, total: number }
}
