// Catalog revisions: review and conflicts; drafts are kept in the browser (utils/localDrafts). Backend: docs/api/revisions.md, docs/catalog/editing.md.

import type { CatalogReferences, CatalogType, ChangeOp, UserSummary } from './catalog'

export const REVISION_STATUSES = ['pending', 'changes_requested', 'approved', 'rejected', 'withdrawn'] as const
export type RevisionStatus = typeof REVISION_STATUSES[number]
export type RevisionKind = 'catalog' | 'lyric'
export type RevisionOrigin = 'manual' | 'import' | 'client' | 'system'
export type RevisionAction = 'create' | 'update' | 'delete'

export type ConflictKind = 'field' | 'duplicate' | 'remove_modified' | 'modify_removed' | 'invalid' | 'entity_gone'

export interface RevisionConflict {
  id: string
  kind: ConflictKind
  path: Array<string | number>
  base: unknown
  mine: unknown
  current: unknown
  ref?: string
}

export interface RevisionItem {
  ref: string
  resource_type: CatalogType
  resource_id: number | null
  action: RevisionAction
  base_version: number | null
  restore_of_version: number | null
  result_version: number | null
  impact_checksum: string | null
  /** Written at submission (new content goes live marked pending); null when it waits for approval. */
  applied_at: string | null
  /** For new albums: the possible duplicates the submitter confirmed are different albums. */
  acknowledged_duplicate_ids: number[]
  changes: ChangeOp[]
  conflicts: RevisionConflict[]
  document: Record<string, unknown> | null
}

export interface RevisionEvent {
  action: string
  comment: string | null
  actor: UserSummary | null
  created_at: string
}

export interface DeletionImpact {
  counts: Array<{ label: string, count: number }>
  blockers: string[]
  checksum: string
}

/** An album that a new album may duplicate (POST /albums/duplicate-candidates). */
export interface DuplicateCandidate {
  album_id: number
  strength: 'strong' | 'weak'
  reasons: Array<{ kind: 'catalog_number' | 'barcode' | 'link' | 'title', value: string }>
  album: {
    id: number
    title: string
    catalog_number: string | null
    image_url: string | null
    release_date: string | null
    release_date_precision: string | null
    is_pending: boolean
  }
}

/** Content a revision put live, by type. */
export type PendingContent = Partial<Record<CatalogType, Array<{ id: number, label: string }>>>

/** What rejecting or withdrawing a revision with live content removes (GET /revisions/{id}/pending-content). */
export interface RemovalPlan {
  delete: Array<{ type: CatalogType, id: number, label: string, counts: Array<{ label: string, count: number }> }>
  keep: Array<{
    type: CatalogType
    id: number
    label: string
    action: 'release' | 'move'
    move_to: number | null
    reasons: Array<{ type: string, id: number, label: string }>
  }>
  blockers: string[]
  checksum: string
}

/** How an open revision merges with the current content right now. */
export interface RevisionPreviewItem {
  ref: string
  current_version: number
  conflicts: RevisionConflict[]
  errors: Record<string, string>
  requires_content_manage: boolean
  impact: DeletionImpact | null
}

export interface Revision {
  id: number
  kind: RevisionKind
  origin: RevisionOrigin
  status: RevisionStatus
  title: string | null
  summary: string | null
  sources: string[]
  is_auto_approved: boolean
  has_conflicts: boolean
  requires_content_manage: boolean
  /** Some items went live at submission. */
  has_applied_items: boolean
  lock_version: number
  review_comment: string | null
  submitter?: UserSummary | null
  reviewer?: UserSummary | null
  checked_at: string | null
  reviewed_at: string | null
  submitted_at: string | null
  items?: RevisionItem[]
  events?: RevisionEvent[]
  references?: CatalogReferences
  preview?: RevisionPreviewItem[]
  pending_content?: PendingContent
  /** Possible duplicates of each new album, by item ref. */
  duplicates?: Record<string, DuplicateCandidate[]>
  created_at: string
  updated_at: string
}

/** An item as POST /revisions and PUT /revisions/{id} take it. */
export interface RevisionItemInput {
  ref: string
  resource_type: CatalogType
  action: RevisionAction
  resource_id?: number
  base_version?: number
  document?: Record<string, unknown>
  impact_checksum?: string
  acknowledged_duplicate_ids?: number[]
}

export interface RevisionPayload {
  title?: string | null
  summary?: string | null
  sources?: string[] | null
  submit?: boolean
  items: RevisionItemInput[]
}
