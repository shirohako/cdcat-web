import type { CatalogReferences, ChangeOp, ChangeSummary, LocalizedText } from './catalog'
import type { ArticleDetail, ArticleVersion, ArticleVersionContent, ContentLinkSummary, MyArticle, TagSummary, UserSummary } from './article'

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
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  is_active: boolean
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
  album_id?: number | null
  work_id?: number | null
  kind?: string
  items?: Array<{ resource_type: string, resource_id: number | null, action: string }>
  language?: string
  rating?: number | null
  created_at: string
}

export interface AdminDashboard {
  generated_at: string
  metrics: { key: string, total: number, new_7: number, new_30: number, daily: { date: string, count: number }[] }[]
  pending_revisions?: number
  conflicted_revisions?: number
  pending_lyric_revisions?: number
  unchecked_lyrics?: number
  pending_articles?: number
  pending_reports?: number
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
  avatar_url: string | null
}

export interface AdminBatchResult {
  results: { id: number, success: boolean, error?: { name: string, message: string } }[]
  succeeded: number
  failed: number
}

export type AdminContentType = 'album' | 'artist' | 'label' | 'work' | 'entry' | 'franchise' | 'track' | 'lyric'

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

/** GET /admin/content/{type}/{id}/merge-preview */
export interface AdminMergePreview {
  /** Entities that reference the source and get a version each, by type */
  affected: Record<string, number>
  /** Rows outside documents that are moved over: favorites, article links … */
  external: Record<string, number>
  blockers: string[]
  checksum: string
}

/** GET /admin/content/{type}/{id}/restore-preview */
export interface AdminRestorePreview {
  version: number
  current_version: number
  changes: ChangeOp[]
  summary: ChangeSummary
  problems: Array<{ path: string, message: string }>
  impact: DeletionImpact | null
  references: CatalogReferences
}

/** GET /admin/credit-roles */
export interface AdminCreditRole {
  key: string
  category: string
  names: LocalizedText
  aliases: string[] | null
  is_album_role: boolean
  is_track_role: boolean
  is_work_role: boolean
  sort_order: number
  is_active: boolean
  usage: { album: number, track: number, work: number }
}

/** GET /admin/attribute-definitions */
export interface AdminAttributeDefinition {
  key: string
  names: LocalizedText
  description: LocalizedText | null
  group: string | null
  value_type: string
  choices: Array<{ value: string, names: LocalizedText }> | null
  reference_types: string[] | null
  applies_to: string[]
  is_multiple: boolean
  sort_order: number
  is_active: boolean
  values_count: number
}

/** GET /admin/shouts */
export interface AdminShout {
  id: number
  album_id: number | null
  artist_id: number | null
  user_id: number
  content: string
  is_hidden: boolean
  hidden_at: string | null
  album: { id: number, title: string } | null
  artist: { id: number, name: string } | null
  user: AdminUserRef | null
  created_at: string | null
  updated_at: string | null
}

export interface AdminLinkProvider {
  id: number
  name: string
  icon_url: string | null
  url_pattern: string | null
  category: string
  sort_order: number
  links_count: number
}

export interface AdminEventSeries {
  id: number
  name: string
  slug: string
  location: string
  website: string | null
  banner_url: string | null
  visual_orientation: 'portrait' | 'landscape'
  description: Record<string, unknown> | null
  events_count: number
}

export interface AdminEvent {
  id: number
  event_series_id: number | null
  series: { id: number, name: string, slug: string } | null
  name: string
  slug: string
  start_date: string
  end_date: string | null
  venue: string | null
  location: string | null
  main_visual_url: string | null
  main_visual_width: number | null
  main_visual_height: number | null
  released_albums_count: number
}

export interface AdminReview {
  id: number
  album_id: number
  user_id: number
  rating: number | null
  content: string
  language: string | null
  useful_count: number
  dislike_count: number
  fun_count: number
  album: { id: number, title: string } | null
  user: AdminUserRef | null
  created_at: string
  updated_at: string
}

export interface AdminArticleItem extends MyArticle {
  author: UserSummary | null
  pending_reports: number
}

export interface AdminArticle extends AdminArticleItem {
  live: (Pick<ArticleDetail, 'type' | 'title' | 'cover_url' | 'content' | 'word_count' | 'links' | 'tags'> & { summary: string | null }) | null
  open_version: (ArticleVersionContent & { links: ContentLinkSummary[], tags: TagSummary[] }) | null
  last_rejected_version_id: number | null
  versions: ArticleVersion[]
  reports: AdminReportEntry[]
}

export interface AdminReportEntry {
  id: number
  reason: string
  note: string | null
  reporter: UserSummary | null
  created_at: string
  updated_at: string
}

export interface AdminReportGroup {
  target:
    | { type: 'article', id: number, title: string | null, status: string | null, author: UserSummary | null }
    | { type: 'post', id: number, title: string | null, status: string | null, author: UserSummary | null, topic_id: number | null, floor: number | null, parent_floor: number | null, excerpt: string | null }
    | { type: 'shout', id: number, title: string | null, status: 'hidden' | 'visible' | null, author: UserSummary | null, album_id: number | null, artist_id: number | null, excerpt: string | null }
  reports_count: number
  reasons: Record<string, number>
  reports: AdminReportEntry[]
}

export interface AdminHandledReport extends Omit<AdminReportEntry, 'updated_at'> {
  article_id: number | null
  post_id: number | null
  post: { id: number, floor: number | null, topic: { id: number, title: string } | null } | null
  shout_id?: number | null
  shout?: { id: number, album_id: number | null, artist_id: number | null, content: string } | null
  status: 'accepted' | 'dismissed'
  resolution: string | null
  resolution_note: string | null
  article: { id: number, title: string | null } | null
  handler: { id: number, username: string, nickname: string | null } | null
  handled_at: string | null
  updated_at: string
}

export interface AdminTag extends TagSummary {
  description: string | null
  articles_count: number
  discussion_topics_count: number
  created_at: string
  updated_at: string
}

export interface AdminWordFilter {
  id: number
  word: string
  action: 'block' | 'flag'
  note: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface AdminSiteSettings {
  settings: {
    registration_open: boolean
    announcement: { content: string, level: 'info' | 'warning', enabled: boolean, ends_at: string | null, version: number }
  }
  updated: Record<string, { updated_at: string | null, updated_by: { id: number, username: string, nickname: string | null } | null }>
  public: { registration_open: boolean, announcement: unknown }
}

export interface AdminAuditLog {
  id: number
  actor_id: number | null
  actor_name: string | null
  action: string
  target_type: string
  target_id: number | null
  reason: string | null
  result: 'submitted' | 'success' | 'failed' | string
  ip: string | null
  created_at: string
  updated_at: string
  before?: Record<string, unknown> | unknown[]
  after?: Record<string, unknown> | unknown[]
  summary?: Record<string, unknown> | unknown[]
}

export interface AdminHeartbeat {
  status: 'healthy' | 'stale' | 'unknown'
  last_seen_at: string | null
}

export interface AdminSystemStatus {
  checks: Record<string, { status: string, latency_ms?: number, error?: string }>
  heartbeats: { scheduler: AdminHeartbeat, worker: AdminHeartbeat }
  queues: { name: string, connection: string, size: number | null, error: string | null }[]
  failed_jobs: number
  schedule: {
    name: string
    job: string | null
    expression: string
    next_run_at: string
    last_run: { status: string, finished_at: string | null, last_success_at: string | null, error: string | null } | null
  }[]
}

export interface AdminFailedJob {
  id: number
  uuid: string
  queue: string
  connection: string
  job: string | null
  template: string | null
  retryable: boolean
  error: string
  failed_at: string | null
  exception?: string
}

export interface AdminLogEntry {
  time: string
  channel: string
  level: string
  message: string
  context: string
}

export interface AdminDiscussionCategory {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description: string | null
  translations: Record<string, { name?: string | null, description?: string | null }> | null
  color: string | null
  icon: string | null
  sort_order: number
  kind: 'discussion' | 'question'
  topic_permission: 'everyone' | 'moderators'
  visibility: 'public' | 'staff'
  is_archived: boolean
  topic_template: string | null
  show_in_latest: boolean
  topics_count: number
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface AdminDiscussionPost {
  id: number
  floor: number | null
  parent_id: number | null
  parent_floor: number | null
  status: 'visible' | 'hidden' | 'deleted'
  status_reason: string | null
  user: UserSummary | null
  excerpt: string
  raw: string
  edit_count: number
  topic: { id: number, title: string, status: string, category: { id: number, name: string, slug: string, color: string | null } | null } | null
  ip_address?: string | null
  created_at: string
  updated_at: string
}

export interface AdminDiscussionRestriction {
  id: number
  user: UserSummary | null
  reason: string
  ends_at: string | null
  active: boolean
  created_by: { id: number, username: string, nickname: string | null } | null
  revoked_by: { id: number, username: string, nickname: string | null } | null
  revoked_at: string | null
  created_at: string
  updated_at: string
}
