/** Discussions. See docs/api/discussions.md in the backend. */
import type { MarkdownReferences } from '~/utils/markdown'
import type { ContentLinkSummary, Pagination, TagSummary, UserSummary } from '~/types/article'

export const DISCUSSION_REACTIONS = [
  'thumbs_up', 'heart', 'joy', 'open_mouth', 'cry', 'tada', 'fire', 'eyes',
  'thinking', 'pray', 'clap', 'hundred', 'notes', 'headphones', 'smitten', 'sweat_smile',
] as const
export type DiscussionReactionKey = typeof DISCUSSION_REACTIONS[number]

export const DISCUSSION_REACTION_EMOJI: Record<DiscussionReactionKey, string> = {
  thumbs_up: '👍', heart: '❤️', joy: '😂', open_mouth: '😮', cry: '😢', tada: '🎉', fire: '🔥', eyes: '👀',
  thinking: '🤔', pray: '🙏', clap: '👏', hundred: '💯', notes: '🎵', headphones: '🎧', smitten: '🥰', sweat_smile: '😅',
}

export const DISCUSSION_REPORT_REASONS = ['spam', 'abuse', 'spoiler', 'off_topic', 'infringement', 'illegal', 'other'] as const
export type DiscussionReportReason = typeof DISCUSSION_REPORT_REASONS[number]

export const NOTIFICATION_LEVELS = ['watching', 'normal', 'muted'] as const
export type NotificationLevel = typeof NOTIFICATION_LEVELS[number]

export type DiscussionCategoryKind = 'discussion' | 'question'

export interface DiscussionCategorySummary {
  id: number
  parent_id: number | null
  name: string
  slug: string
  translations: Record<string, { name?: string | null, description?: string | null }> | null
  color: string | null
  icon: string | null
  kind: DiscussionCategoryKind
}

export interface DiscussionCategoryStats {
  topics_count: number
  posts_count: number
  latest: { topic_id: number, title: string, bumped_at: string | null, user: UserSummary | null } | null
}

export interface DiscussionCategory extends DiscussionCategorySummary {
  description: string | null
  topic_permission: 'everyone' | 'moderators'
  visibility: 'public' | 'staff'
  is_archived: boolean
  show_in_latest: boolean
  sort_order: number
  stats: DiscussionCategoryStats
  notification_level: NotificationLevel | null
  children?: DiscussionCategory[]
}

export interface DiscussionCategoryDetail extends DiscussionCategory {
  topic_template: string | null
  parent: DiscussionCategorySummary | null
  children: DiscussionCategory[]
  can: { post: boolean }
}

export interface DiscussionTopicViewerState {
  unread_count: number
  visited: boolean
  notification_level: NotificationLevel
}

export interface DiscussionTopicCard {
  id: number
  title: string
  category: DiscussionCategorySummary | null
  tags: TagSummary[]
  author: UserSummary | null
  replies_count: number
  views_count: number
  created_at: string | null
  bumped_at: string | null
  last_posted_at: string | null
  last_post_id: number | null
  last_poster: UserSummary | null
  pinned: 'category' | 'global' | null
  featured: boolean
  locked: boolean
  solved: boolean
  status: 'visible' | 'hidden' | 'deleted'
  article_id: number | null
  excerpt?: string | null
  viewer?: DiscussionTopicViewerState
}

export interface DiscussionTopicDetail extends Omit<DiscussionTopicCard, 'category' | 'viewer'> {
  status_reason: string | null
  category: (DiscussionCategorySummary & { parent: DiscussionCategorySummary | null }) | null
  links: ContentLinkSummary[]
  article: { id: number, slug: string | null, title: string | null, status: string } | null
  accepted_post: { id: number, floor: number, user: UserSummary | null, excerpt: string } | null
  pinned_until: string | null
  noindex: boolean
  viewer: {
    notification_level: NotificationLevel | null
    last_read_post_id: number | null
    can: { reply: boolean, edit: boolean, delete: boolean, moderate: boolean, accept: boolean }
  }
}

export interface DiscussionPostUser extends UserSummary {
  is_op: boolean
  is_moderator: boolean
}

export interface DiscussionReactionCount {
  reaction: DiscussionReactionKey
  count: number
  reacted: boolean
}

export interface DiscussionPost {
  id: number
  topic_id: number
  floor: number | null
  parent_id: number | null
  user: DiscussionPostUser
  reply_to: { post_id: number, user: UserSummary | null } | null
  /** Withheld from hidden posts (except for their author and moderators) and deleted ones. */
  raw: string | null
  status: 'visible' | 'hidden' | 'deleted'
  status_reason: string | null
  removed_by: 'author' | 'moderator' | 'system' | null
  created_at: string | null
  edited_at: string | null
  reactions: DiscussionReactionCount[]
  replies_count: number
  replies?: DiscussionPost[]
  bookmarked: boolean
  blocked: boolean
  can: { reply: boolean, edit: boolean, delete: boolean, report: boolean, react: boolean, moderate: boolean }
}

export type DiscussionReferences = Partial<MarkdownReferences>

export interface DiscussionTopicPage {
  topic: DiscussionTopicDetail
  floors: DiscussionPost[]
  references: DiscussionReferences
  pagination: Pagination
  focus: { post_id: number | null, floor: number | null, parent_id: number | null, reply_page: number | null } | null
  mode: { author: 'op' | null, order: 'asc' | 'desc' }
}

export interface DiscussionTopicList {
  topics: DiscussionTopicCard[]
  pinned: DiscussionTopicCard[]
  pagination: Pagination
}

export interface DiscussionPostSummary {
  id: number
  floor: number | null
  parent_id: number | null
  parent_floor: number | null
  status: 'visible' | 'hidden' | 'deleted'
  user: UserSummary | null
  reactions_count: number
  created_at: string | null
  excerpt: string | null
  topic: { id: number, title: string, status: string, category: DiscussionCategorySummary | null } | null
}

export interface DiscussionSuggestion {
  id: number
  title: string
  subtitle: string | null
  image_url: string | null
  username?: string
}

export interface DiscussionTagWithCount extends TagSummary {
  description: string | null
  topics_count: number
}

export interface DiscussionComposerValues {
  category_id: number | null
  title: string
  raw: string
  tag_ids: number[]
  links: { type: string, id: number }[]
}
