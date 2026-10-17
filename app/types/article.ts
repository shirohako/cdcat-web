/** Articles and the shared community pieces they use. See docs/api/articles.md in the backend. */

export const ARTICLE_TYPES = ['review', 'feature', 'interview', 'news', 'guide', 'translation', 'essay', 'other'] as const
export type ArticleType = typeof ARTICLE_TYPES[number]

export const ARTICLE_STATUSES = ['draft', 'pending', 'published', 'rejected', 'unpublished'] as const
export type ArticleStatus = typeof ARTICLE_STATUSES[number]

export const CONTENT_LINK_TYPES = ['work', 'artist', 'entry', 'series', 'event'] as const
export type ContentLinkType = typeof CONTENT_LINK_TYPES[number]

export const ARTICLE_REPORT_REASONS = ['spam', 'abuse', 'spoiler', 'infringement', 'illegal', 'other'] as const
export type ArticleReportReason = typeof ARTICLE_REPORT_REASONS[number]

export interface UserSummary {
  id: number
  username: string
  nickname: string | null
  avatar: string | null
}

export interface TagSummary {
  id: number
  name: string
  slug: string
  translations: Record<string, { name?: string | null, description?: string | null }> | null
  staff_only: boolean
}

export interface ContentLink {
  type: ContentLinkType
  id: number
}

/** A linked piece of content as a card; `event_series_id` only for events. */
export interface ContentLinkSummary extends ContentLink {
  title: string
  image_url: string | null
  date: string | null
  kind: string | null
  event_series_id?: number | null
}

export interface ArticleCard {
  id: number
  slug: string | null
  type: ArticleType
  title: string
  cover_url: string | null
  word_count: number
  views_count: number
  summary: string
  featured: boolean
  author: UserSummary | null
  tags: TagSummary[]
  published_at: string | null
}

export interface ArticleDetail extends ArticleCard {
  content: string
  links: ContentLinkSummary[]
  /** Set when the live version changed after the first publication. */
  updated_at: string | null
  /** The discussion topic that serves as the comment section. */
  discussion_topic_id: number | null
  can: { edit: boolean, manage: boolean, report: boolean }
}

export interface ArticleVersion {
  /** Null for an unsaved copy of the live version. */
  id: number | null
  status: 'draft' | 'pending' | 'rejected' | 'published'
  revision: number
  type: ArticleType | null
  title: string | null
  summary: string | null
  cover_url: string | null
  submit_note: string | null
  review_note: string | null
  editor: UserSummary | null
  published_at: string | null
  reviewed_at: string | null
  updated_at: string | null
  is_live?: boolean
}

export interface ArticleVersionContent extends ArticleVersion {
  content: string | null
  links: ContentLink[]
  tag_ids: number[]
}

/** What the writing page loads and every workflow action returns. */
export interface ArticleDraftPayload {
  article: {
    id: number
    status: ArticleStatus
    slug: string | null
    status_reason: string | null
    featured: boolean
    has_live_version: boolean
    published_at: string | null
    submitted_at: string | null
  }
  draft: Omit<ArticleVersionContent, 'links' | 'tag_ids'> & { links: ContentLinkSummary[], tags: TagSummary[] }
  review_note: string | null
  can: { edit: boolean, submit: boolean, publish: boolean, withdraw: boolean, discard: boolean }
}

/** The editable fields sent to POST /articles and PUT /articles/{id}/draft. */
export interface ArticleDraftFields {
  type: ArticleType | null
  title: string
  summary: string
  cover_url: string
  content: string
  slug: string
  links: ContentLink[]
  tag_ids: number[]
}

export interface MyArticle {
  id: number
  status: ArticleStatus
  slug: string | null
  status_reason: string | null
  views_count: number
  title: string | null
  type: ArticleType | null
  has_live_version: boolean
  has_changes: boolean
  featured: boolean
  published_at: string | null
  submitted_at: string | null
  updated_at: string | null
}

export interface Pagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface NotificationItem {
  id: number
  type: string
  data: {
    title?: string | null
    reason?: string | null
    decision?: 'accept' | 'dismiss'
    resolution?: string
    /** Discussion notifications: where the post is and a spoiler-free excerpt of it. */
    topic_id?: number
    post_id?: number
    floor?: number | null
    parent_floor?: number | null
    excerpt?: string
    action?: string
  } & Record<string, unknown>
  actor_count: number
  subject: { type: string | null, id: number | null }
  actor: UserSummary | null
  read: boolean
  created_at: string
  updated_at: string
}
