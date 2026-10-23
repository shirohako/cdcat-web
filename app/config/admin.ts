import type { AdminContentType } from '~/types/admin'
/** Sidebar groups in display order: by what the pages are for, not by which permission they need. */
export const adminGroups = [
  { key: 'overview', label: 'admin_pages.groups.overview' },
  { key: 'music', label: 'admin_pages.groups.music' },
  { key: 'artists', label: 'admin_pages.groups.artists' },
  { key: 'entries', label: 'admin_pages.groups.entries' },
  { key: 'events', label: 'admin_pages.groups.events' },
  { key: 'catalog_tools', label: 'admin_pages.groups.catalog_tools' },
  { key: 'catalog_settings', label: 'admin_pages.groups.catalog_settings' },
  { key: 'articles', label: 'admin_pages.groups.articles' },
  { key: 'discussions', label: 'admin_pages.groups.discussions' },
  { key: 'moderation', label: 'admin_pages.groups.moderation' },
  { key: 'community_settings', label: 'admin_pages.groups.community_settings' },
  { key: 'users', label: 'admin_pages.groups.users' },
  { key: 'mail', label: 'admin_pages.groups.mail' },
  { key: 'system', label: 'admin_pages.groups.system' },
] as const

export type AdminGroupKey = typeof adminGroups[number]['key']

export interface AdminMenuItem {
  path: string
  /** One permission, or several of which any one is enough. */
  permission: string | string[]
  label: string
  icon: string
  group: AdminGroupKey
}

/** Whether `has` grants a menu entry's permission (any one of a list). */
export const allowedBy = (permission: string | string[], has: (name: string) => boolean) =>
  Array.isArray(permission) ? permission.some(has) : has(permission)

/** Sidebar entries in display order; the route guard reads the permission of the longest matching path. */
export const adminMenu: AdminMenuItem[] = [
  { path: '/admin', permission: 'admin.access', label: 'admin_pages.dashboard.title', icon: 'lucide:layout-dashboard', group: 'overview' },
  { path: '/admin/revisions', permission: 'revisions.view', label: 'admin_pages.revisions.title', icon: 'lucide:git-pull-request', group: 'overview' },
  { path: '/admin/content/albums', permission: 'content.manage', label: 'admin_pages.content.tabs.album', icon: 'lucide:disc-3', group: 'music' },
  { path: '/admin/content/tracks', permission: 'content.manage', label: 'admin_pages.content.tabs.track', icon: 'lucide:music', group: 'music' },
  { path: '/admin/content/lyrics', permission: 'content.manage', label: 'admin_pages.content.tabs.lyric', icon: 'lucide:file-text', group: 'music' },
  { path: '/admin/content/artists', permission: 'content.manage', label: 'admin_pages.content.tabs.artist', icon: 'lucide:mic-vocal', group: 'artists' },
  { path: '/admin/content/labels', permission: 'content.manage', label: 'admin_pages.content.tabs.label', icon: 'lucide:building-2', group: 'artists' },
  { path: '/admin/content/entries', permission: 'content.manage', label: 'admin_pages.content.tabs.entry', icon: 'lucide:clapperboard', group: 'entries' },
  { path: '/admin/content/franchises', permission: 'content.manage', label: 'admin_pages.content.tabs.franchise', icon: 'lucide:layers', group: 'entries' },
  { path: '/admin/events', permission: 'events.manage', label: 'admin_pages.events.title', icon: 'lucide:calendar-days', group: 'events' },
  { path: '/admin/event-series', permission: 'events.manage', label: 'admin_pages.event_series.title', icon: 'lucide:calendar-range', group: 'events' },
  { path: '/admin/event-imports', permission: 'events.manage', label: 'admin_pages.event_imports.title', icon: 'lucide:download-cloud', group: 'events' },
  { path: '/admin/harvest', permission: 'harvest.manage', label: 'admin_pages.harvest.title', icon: 'lucide:radar', group: 'catalog_tools' },
  { path: '/admin/images', permission: 'content.manage', label: 'admin_pages.images.title', icon: 'lucide:images', group: 'catalog_tools' },
  { path: '/admin/credit-roles', permission: 'content.manage', label: 'admin_pages.credit_roles.title', icon: 'lucide:contact', group: 'catalog_settings' },
  { path: '/admin/attribute-definitions', permission: 'content.manage', label: 'admin_pages.attribute_definitions.title', icon: 'lucide:list-checks', group: 'catalog_settings' },
  { path: '/admin/link-providers', permission: 'content.manage', label: 'admin_pages.link_providers.title', icon: 'lucide:link', group: 'catalog_settings' },
  { path: '/admin/articles', permission: 'articles.manage', label: 'admin_pages.articles.title', icon: 'lucide:newspaper', group: 'articles' },
  { path: '/admin/article-types', permission: 'articles.manage', label: 'admin_pages.article_types.title', icon: 'lucide:shapes', group: 'articles' },
  { path: '/admin/discussions/categories', permission: 'discussions.manage', label: 'admin_pages.discussions.categories.title', icon: 'lucide:folder-tree', group: 'discussions' },
  { path: '/admin/discussions/topics', permission: 'discussions.moderate', label: 'admin_pages.discussions.topics.title', icon: 'lucide:messages-square', group: 'discussions' },
  { path: '/admin/discussions/posts', permission: 'discussions.moderate', label: 'admin_pages.discussions.posts.title', icon: 'lucide:message-square-text', group: 'discussions' },
  { path: '/admin/reports', permission: ['articles.manage', 'discussions.moderate', 'shouts.manage', 'reviews.manage'], label: 'admin_pages.reports.title', icon: 'lucide:flag', group: 'moderation' },
  { path: '/admin/reviews', permission: 'reviews.manage', label: 'admin_pages.reviews.title', icon: 'lucide:message-square', group: 'moderation' },
  { path: '/admin/shouts', permission: 'shouts.manage', label: 'admin_pages.shouts.title', icon: 'lucide:message-circle', group: 'moderation' },
  { path: '/admin/lyrics', permission: 'lyrics.manage', label: 'admin_pages.lyrics.title', icon: 'lucide:file-music', group: 'moderation' },
  { path: '/admin/discussions/restrictions', permission: ['discussions.moderate', 'lyrics.manage', 'shouts.manage', 'reviews.manage'], label: 'admin_pages.discussions.restrictions.title', icon: 'lucide:mic-off', group: 'moderation' },
  { path: '/admin/tags', permission: 'tags.manage', label: 'admin_pages.tags.title', icon: 'lucide:tags', group: 'community_settings' },
  { path: '/admin/word-filters', permission: 'filters.manage', label: 'admin_pages.word_filters.title', icon: 'lucide:shield-ban', group: 'community_settings' },
  { path: '/admin/users', permission: 'users.manage', label: 'admin_pages.users.title', icon: 'lucide:users', group: 'users' },
  { path: '/admin/roles', permission: 'roles.manage', label: 'admin_pages.roles.title', icon: 'lucide:shield-check', group: 'users' },
  { path: '/admin/mail/campaigns', permission: 'mail.manage', label: 'admin_pages.mail.campaigns.title', icon: 'lucide:send', group: 'mail' },
  { path: '/admin/mail/templates', permission: 'mail.manage', label: 'admin_pages.mail.templates.title', icon: 'lucide:layout-template', group: 'mail' },
  { path: '/admin/mail/categories', permission: 'mail.manage', label: 'admin_pages.mail.categories.title', icon: 'lucide:inbox', group: 'mail' },
  { path: '/admin/mail/suppressions', permission: 'mail.manage', label: 'admin_pages.mail.suppressions.title', icon: 'lucide:mail-x', group: 'mail' },
  { path: '/admin/mail/logs', permission: 'mail.logs', label: 'admin_pages.mail.logs.title', icon: 'lucide:mail-search', group: 'mail' },
  { path: '/admin/settings', permission: 'system.settings', label: 'admin_pages.settings.title', icon: 'lucide:settings', group: 'system' },
  { path: '/admin/audit', permission: 'audit.view', label: 'admin_pages.audit.title', icon: 'lucide:scroll-text', group: 'system' },
  { path: '/admin/system', permission: 'system.logs', label: 'admin_pages.system.title', icon: 'lucide:activity', group: 'system' },
]

/** The menu entry a route belongs to: an exact match, else the longest path prefix. */
export const findAdminMenuItem = (path: string, items: AdminMenuItem[] = adminMenu) =>
  items.find(item => item.path === path)
  ?? items.filter(item => item.path !== '/admin' && path.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0]

export const adminContentTypes = ['album', 'artist', 'label', 'entry', 'franchise', 'track', 'lyric'] as const

/**
 * Per content type (the singular morph alias, as in `resource_type`): the plural URL segment the
 * admin pages share with the API (`/admin/content/albums`, `/v1/albums/{id}/versions`) and the public page.
 */
export const adminContentRoutes: Record<AdminContentType, { api: string, front: string }> = {
  album: { api: 'albums', front: 'albums' },
  artist: { api: 'artists', front: 'artists' },
  label: { api: 'labels', front: 'labels' },
  entry: { api: 'entries', front: 'entries' },
  franchise: { api: 'franchises', front: 'franchises' },
  track: { api: 'tracks', front: 'tracks' },
  lyric: { api: 'lyrics', front: 'lyrics' },
}

/** Types whose duplicates can be merged into another entity. */
export const mergeableContentTypes: AdminContentType[] = ['album', 'artist', 'label']

/** The editor of an entity; tracks are edited with their album and lyrics on their track's page. */
export const adminEditorPath = (type: AdminContentType, id?: number | string | null) => {
  if (type === 'track' || type === 'lyric') return null
  if (!id) return type === 'entry' ? '/contribute/entry' : `/contribute/${type}`
  return `/contribute/${type}/${id}`
}

/** The content type of an admin URL segment such as `albums`. */
export const adminContentTypeOf = (segment: unknown): AdminContentType | undefined =>
  adminContentTypes.find(type => adminContentRoutes[type].api === segment)

/** Types with their own versions; tracks are edited with their album. */
export const isRevisionable = (type: AdminContentType | undefined): type is Exclude<AdminContentType, 'track'> => Boolean(type) && type !== 'track'
