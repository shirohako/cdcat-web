/**
 * Harvesting (docs/harvest/README.md): bundles harvesters hand in, and the review queue. The
 * harvester itself (settings, tasks, runs) is a separate program with its own page.
 */

export interface HarvestEventSummary {
  id: number
  name: string
  slug: string | null
  start_date: string | null
  end_date: string | null
}

/** How a record is linked to an event: a task fixed to it, an event name or tag that matched, or a release date that fell on it. */
export type HarvestVia = 'fixed' | 'name' | 'date'

export type HarvestEventMode = 'none' | 'fixed' | 'auto'

export type HarvestCandidateStatus = 'pending' | 'approving' | 'approved' | 'linked' | 'rejected' | 'excluded' | 'merged'

/** GET /admin/harvest/overview */
export interface HarvestOverview {
  candidates: Partial<Record<HarvestCandidateStatus, number>>
  /** Records handed in that are not merged into candidates yet. */
  unprocessed: number
  sources: Array<{ source: string, label: string, records: number, gone: number, non_music: number, updated_at: string | null }>
  tasks: number
  images: { count: number, bytes: number }
}

/** A task: one entry of one site ("bangumi:index:95778"), as harvesters name it. */
export interface HarvestTaskSummary {
  id: number
  key: string
  source: string
  source_label: string
  entry: string
  entry_label: string
  label: string | null
  url: string | null
}

/** GET /admin/harvest/tasks */
export interface HarvestTaskRow extends HarvestTaskSummary {
  event_mode: HarvestEventMode
  event: HarvestEventSummary | null
  records: number
  delisted: number
  /** When the task last saw one of its items listed. */
  listed_at: string | null
  candidates: Partial<Record<HarvestCandidateStatus, number>>
  /** When a bundle last named the task. */
  last_seen_at: string | null
  created_at: string | null
}

/** GET /admin/harvest/events: events candidates are linked to. */
export interface HarvestEventRow {
  event: HarvestEventSummary
  candidates: number
  pending: number
  /** Candidates that have it as the suggested first release. */
  suggested: number
  circles: number
  covered_circles: number
}

export type HarvestSubmissionVia = 'upload' | 'api' | 'command'

export type HarvestSubmissionCount = 'records' | 'new' | 'changed' | 'unchanged' | 'stale' | 'invalid' | 'unknown_event' | 'unknown_task' | 'images_new' | 'images_known' | 'images_invalid'

export interface HarvestSubmission {
  id: number
  via: HarvestSubmissionVia
  file_name: string | null
  records: number
  counts: Partial<Record<HarvestSubmissionCount, number>>
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

export interface HarvestCandidateRow {
  id: number
  title: string
  circle_name: string | null
  artist_id: number | null
  event_circle_id: number | null
  circle_by: string | null
  status: HarvestCandidateStatus
  /** The suggested first-release event; null when no record is linked to one. */
  event: HarvestEventSummary | null
  is_adult: boolean
  has_cover: boolean
  has_tracks: boolean
  tracks: number
  catalog_numbers: string[]
  sources: string[]
  release_date: string | null
  cover_url: string | null
  /** Every task that listed its records no longer lists them (or the pages are gone). */
  delisted: boolean
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
  candidates: Array<{ id: number, title: string, event_id: number | null }>
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

export interface HarvestMergedImage {
  url: string
  kind: string
  width: number | null
  height: number | null
  sha256: string | null
  /** A harvester handed the file in: previews and the cover come from this site's copy. */
  local: boolean
  source: string
  referer: string
}

export interface HarvestMerged {
  title: HarvestPicked<string>
  titles: Array<{ title: string, locale: string, kind: string, source: string }>
  circle: {
    name: string | null, artist_id: number | null, event_circle_id: number | null, event_id: number | null, by: string | null, source: string | null
    /** False when the name is only a producer's: no circle is created from it. */
    named?: boolean
    links?: string[]
  }
  /** The suggested event, and the earliest full date the sources give (else the event's first day, else a partial date). */
  release: {
    event_id: number | null
    date: string | null
    precision: 'day' | 'month' | 'year' | null
  }
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
  images: HarvestMergedImage[]
  links: Array<{ url: string, kind: string, source: string, provider_id: number | null, provider: string | null }>
  /** What the sources call the event: the item's own event, event names and tags, and what the lists said. */
  event_hints: Array<{ text: string, sources: string[] }>
  descriptions: Array<{ source: string, record_id: number, text: string }>
  notes: string[]
  delisted: boolean
  sources: Array<{ source: string, record_id: number, part: number, url: string, kind: string, gone: boolean, delisted: boolean, title: string }>
}

/** A task that listed a record, and what its list said (title, price, event, resale …). */
export interface HarvestListing {
  task: HarvestTaskSummary
  listing: Record<string, unknown> | null
  first_seen_at: string | null
  last_seen_at: string | null
  delisted_at: string | null
}

export interface HarvestCandidateEvent extends HarvestEventSummary {
  via: HarvestVia
  suggested: boolean
  event_circle: { id: number, name: string, space_code: string | null } | null
}

/** What the review page makes of a credited name (CreditMatcher, docs/harvest/README.md#人员). */
export type HarvestPersonState = 'linked' | 'ignored' | 'link' | 'circle' | 'name' | 'new' | 'namesake' | 'conflict' | 'pending' | 'circle_only' | 'short' | 'suspect'

/** The album's circle: linked, a circle by its name, a new one, or a warning; unknown and unnamed when the sources name none. */
export type HarvestCircleState = 'linked' | 'name' | 'new' | 'unknown' | 'unnamed' | 'namesake' | 'pending' | 'person_only' | 'shop' | 'short' | 'suspect'

/** The document of an artist the draft may create: the name, type and the source's pages. */
export interface HarvestNewArtist {
  name: string
  type: string
  links: Array<{ id: string, link_provider_id: number, url: string }>
  titles?: Array<{ id: string, title: string, locale: string, kind: string }>
}

export interface HarvestPerson {
  key: string
  /** The spellings the sources use; a new artist takes the first. */
  names: string[]
  state: HarvestPersonState
  artist_id: number | null
  /** The album's circle is created with the album, and this name is the circle. */
  follows_circle: boolean
  /** The artists the reviewer chooses between. */
  candidates: number[]
  db_keys: string[]
  create: HarvestNewArtist | null
}

export interface HarvestCircleMatch {
  state: HarvestCircleState
  name: string | null
  artist_id: number | null
  candidates: number[]
  /** A shop's name without its shop words. */
  suggestion: string | null
  create: HarvestNewArtist | null
}

/** An artist the review page mentions, with how many albums it is on and its pages on other sites. */
export interface HarvestArtistReference {
  id: number
  name: string
  type: string | null
  image_url: string | null
  is_pending: boolean
  albums?: number
  pages?: Array<{ provider: string, url: string }>
}

export interface HarvestCandidateDetail {
  candidate: {
    id: number
    title: string
    event_id: number | null
    circle_name: string | null
    artist_id: number | null
    event_circle_id: number | null
    circle_by: string | null
    status: HarvestCandidateStatus
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
  /** The suggested first release (after approval, the album's release event); null when no record is linked to an event. */
  event: HarvestEventSummary | null
  /** Every event the records are linked to, the suggested one first. */
  events: HarvestCandidateEvent[]
  event_circle: { id: number, name: string, space_code: string | null, image_url: string | null, description: string | null, links: Array<{ type: string, url: string }> | null } | null
  records: Array<HarvestMerged['sources'][number] & {
    label: string
    fetched_at: string | null
    kind_reason: string | null
    events: Array<{ event_id: number, via: HarvestVia }>
    listings: HarvestListing[]
  }>
  duplicates: import('~/types/revision').DuplicateCandidate[]
  /** Who each credited name is here: linked, created with the album, or left to the reviewer. */
  people: HarvestPerson[]
  circle_match: HarvestCircleMatch
  references: import('~/types/catalog').CatalogReferences
  /** Within the list's filters, which the review page passes on. */
  neighbors: { previous: number | null, next: number | null, position: number | null, total: number }
}
