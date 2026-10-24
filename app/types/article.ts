/** Articles and the shared community pieces they use. See docs/api/articles.md in the backend. */

import type { UserSummary } from './catalog'

/** A key of an article type; the list is maintained in the admin panel (GET /article-types). */
export type ArticleType = string

export interface ArticleTypeDefinition {
  key: ArticleType
  names: Record<string, string>
  sort_order: number
  is_active: boolean
}

/** draft: saved, not on the site; hidden: taken off by the author or a moderator; locked: frozen by a moderator. */
export const ARTICLE_STATUSES = ['draft', 'published', 'hidden', 'locked'] as const
export type ArticleStatus = typeof ARTICLE_STATUSES[number]

export const CONTENT_LINK_TYPES = ['album', 'artist', 'entry', 'franchise', 'event'] as const
export type ContentLinkType = typeof CONTENT_LINK_TYPES[number]

export const ARTICLE_REPORT_REASONS = ['spam', 'abuse', 'spoiler', 'infringement', 'illegal', 'other'] as const
export type ArticleReportReason = typeof ARTICLE_REPORT_REASONS[number]

export interface TagSummary {
  id: number
  name: string
  slug: string
  translations: Record<string, { name?: string | null, description?: string | null }> | null
  is_staff_only: boolean
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

/** What readers may do with an original article (docs/articles/README.md#协议与转载); utils/articleLicenses describes each. */
export type ArticleLicense = 'all_rights_reserved' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'cc_by_nc_sa' | 'cc_by_nd' | 'cc_by_nc_nd' | 'cc0'

export interface ArticleCard {
  id: number
  slug: string | null
  type: ArticleType
  title: string
  cover_url: string | null
  word_count: number
  views_count: number
  likes_count: number
  summary: string
  featured: boolean
  author: UserSummary | null
  tags: TagSummary[]
  published_at: string | null
}

export interface ArticleDetail extends ArticleCard {
  /** The wide page header; the cover stands in when it is null. */
  banner_url: string | null
  content: string
  /** The license of an original; null for a repost. */
  license: ArticleLicense | null
  is_repost: boolean
  /** Where a repost comes from; null for an original. */
  source: { url: string, author: string | null } | null
  links: ContentLinkSummary[]
  /** Set when the article was edited well after its first publication. */
  updated_at: string | null
  /** The discussion topic that serves as the comment section. */
  discussion_topic_id: number | null
  /** Whether the viewer likes it. */
  liked: boolean
  can: { edit: boolean, manage: boolean, report: boolean, like: boolean }
}

/** What the writing page loads (GET /articles/{id}/edit) and every save or action returns. */
export interface ArticleEditPayload {
  article: {
    id: number
    status: ArticleStatus
    slug: string | null
    /** Why a moderator hid or locked it. */
    status_reason: string | null
    /** Bumped on every save; a save based on an older one is refused with ARTICLE_DRAFT_CONFLICT. */
    revision: number
    type: ArticleType | null
    title: string | null
    summary: string | null
    cover_url: string | null
    banner_url: string | null
    content: string | null
    license: ArticleLicense
    is_repost: boolean
    source_url: string | null
    source_author: string | null
    links: ContentLinkSummary[]
    tags: TagSummary[]
    featured: boolean
    published_at: string | null
    edited_at: string | null
    updated_at: string | null
  }
  can: { edit: boolean, save_draft: boolean, publish: boolean, update: boolean, hide: boolean }
}

/** The editable fields sent to POST /articles, PUT /articles/{id} and POST …/publish. */
export interface ArticleDraftFields {
  type: ArticleType | null
  title: string
  summary: string
  cover_url: string
  banner_url: string
  content: string
  license: ArticleLicense
  is_repost: boolean
  source_url: string
  source_author: string
  slug: string
  links: ContentLink[]
  tag_ids: number[]
  /** Names of tags the library lacks, created when saved (utils/tags tagPayload). */
  new_tags: string[]
}

export interface MyArticle {
  id: number
  status: ArticleStatus
  slug: string | null
  status_reason: string | null
  views_count: number
  likes_count: number
  title: string | null
  type: ArticleType | null
  featured: boolean
  published_at: string | null
  edited_at: string | null
  updated_at: string | null
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
