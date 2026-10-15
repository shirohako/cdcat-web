export interface DeletionImpact {
  checksum?: string
  counts: { label: string, count: number }[]
  blockers: string[]
}

export interface AdminAuditEntry {
  id: number
  actor_name: string | null
  action: string
  reason: string | null
  result: string
  created_at: string
}

export interface AdminPagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface AdminRole {
  id: number
  name: string
  level: number
  permissions: string[]
  users_count: number
  can_manage: boolean
  can_delete: boolean
}

export interface AdminPermission {
  name: string
  group: string
  description: string
  assignable: boolean
}

export interface AdminUserDetail {
  id: number
  username: string
  nickname: string
  email: string
  birthday: string
  avatar: string | null
  banner: string | null
  bio: string | null
  status: boolean
  roles: string | null
  role_names: string[]
  role_level: number
  can_manage: boolean
  permissions: string[]
  contributions_count: number
  reviews_count: number
  joined_at: string
  last_seen_at: string | null
  login_sessions: { created_at: string, last_used_at: string | null }[]
  login_sessions_total: number
}

export interface AdminUserActivity {
  id: number
  title: string | null
  status?: string
  work_id?: number | null
  song_id?: number
  resource_id?: number | null
  resource_type?: string
  language?: string
  rating?: number | null
  created_at: string
}

export interface AdminDashboard {
  generated_at: string
  metrics: { key: string, total: number, new_7: number, new_30: number, daily: { date: string, count: number }[] }[]
  pending_revisions?: number
  recent_actions?: AdminAuditEntry[]
  operations?: {
    failed_jobs: number
    scheduler: { status: string, last_seen_at: string | null }
    worker: { status: string, last_seen_at: string | null }
  }
}

export interface AdminUserRef {
  id: number
  username: string
  nickname: string | null
  avatar: string | null
}

export interface AdminRevision {
  id: number
  resource_type: 'work' | 'artist' | 'entry' | 'franchise' | string
  resource_id: number | null
  revision_number: number
  action: 'create' | 'update' | 'delete'
  title: string
  data?: Record<string, unknown>
  after_snapshot?: Record<string, unknown> | null
  checksum?: string | null
  baseline_checksum: string | null
  impact_checksum?: string | null
  requires_content_manage: boolean
  requires_reconfirmation: boolean
  is_auto_approved: boolean
  rollback_of_id: number | null
  status: 'pending' | 'approved' | 'rejected'
  comment: string | null
  review_comment: string | null
  submitter?: AdminUserRef
  reviewer?: AdminUserRef
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminBatchResult {
  results: { id: number, success: boolean, error?: { name: string, message: string } }[]
  succeeded: number
  failed: number
}

export interface AdminRollbackPreview {
  current: Record<string, unknown>
  target: Record<string, unknown>
  baseline_checksum: string
  removed_song_ids: number[]
  impact: DeletionImpact | null
}

export type AdminContentType = 'work' | 'artist' | 'entry' | 'franchise' | 'song'

export interface AdminContentItem {
  id: number
  title?: string
  name?: string
  type?: string | null
  image_url?: string | null
  pending_revisions_count?: number
  created_at: string | null
  updated_at: string | null
  [key: string]: unknown
}

export interface AdminMergePreview {
  source: { id: number, name: string }
  target: { id: number, name: string }
  counts: { key: string, label: string, count: number }[]
  pending_revisions: { id: number, title: string }[]
  checksum: string
}

export interface AdminLinkProvider {
  id: number
  name: string
  icon_url: string | null
  url_pattern: string | null
  category: string
  display_order: number
  links_count: number
}

export interface AdminEventSeries {
  id: number
  name: string
  slug: string
  location: string
  website: string | null
  description: Record<string, unknown> | null
  events_count: number
}

export interface AdminEvent {
  id: number
  event_series_id: number
  series: { id: number, name: string, slug: string } | null
  name: string
  slug: string
  start_date: string
  end_date: string | null
  venue: string | null
  location: string | null
  main_visual_url: string | null
  released_works_count: number
}
