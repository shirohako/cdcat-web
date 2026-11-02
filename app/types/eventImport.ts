/** An event import on the admin page (docs/api/events.md): a floor plan or booths, or both before the split. */
export type EventImportKind = 'map' | 'booths' | 'combined'

export interface EventImportPlacement {
  halls: { name: string, spaces: number }[]
  spaces: number
  /** On-site booths compared with the desks: the event's for a floor plan, the bundle's for booths. */
  booths?: number
  circles_without_space: string[]
  circles_without_space_count: number
  empty_spaces: string[]
  empty_spaces_count: number
  warnings: string[]
}

export interface EventImportSummary {
  kind?: EventImportKind
  /** Booths only. */
  circles?: { total: number, on_site: number, catalog_only: number, new: number, updated: number, removed: number, with_cut: number }
  /** How the desks and booths meet; null for booths when the event has no floor plan yet. */
  map: EventImportPlacement | null
  // How booths came out of the artist matching; imports before 2026-10-28 counted other things. Booths only.
  artists?: Partial<Record<'handle' | 'url' | 'name' | 'previous' | 'manual' | 'confirmed' | 'suggested' | 'none' | 'suspect', number>>
  event: Record<string, [string | null, string | null]>
  notes: string[]
}

export interface EventImportRun {
  id: number
  source: string
  kind: EventImportKind
  // What the bundle says about itself (docs/events/README.md#导入包); auto_apply: sent by a harvester with its
  // token, applied by itself when the preview is clean (#一键上传).
  params: { file?: { name: string, bytes: number }, edition?: { key: string, name: string }, created_at?: string, auto_apply?: boolean }
  status: 'collecting' | 'queued' | 'running' | 'ready' | 'applying' | 'applied' | 'failed'
  summary: EventImportSummary | null
  // A booth bundle in several volumes: the ones still to come (docs/events/README.md#分卷).
  missing_volumes: number[]
  error: string | null
  creator: { username: string, nickname: string | null } | null
  applier: { username: string, nickname: string | null } | null
  applied_at: string | null
  created_at: string
}
