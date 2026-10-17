export const adminGroups = [
  { key: 'overview', label: 'admin_pages.groups.overview' },
  { key: 'content', label: 'admin_pages.groups.content' },
  { key: 'community', label: 'admin_pages.groups.community' },
  { key: 'users', label: 'admin_pages.groups.users' },
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
  { path: '/admin/content/work', permission: 'content.manage', label: 'admin_pages.content.tabs.work', icon: 'lucide:disc-3', group: 'content' },
  { path: '/admin/content/artist', permission: 'content.manage', label: 'admin_pages.content.tabs.artist', icon: 'lucide:mic-vocal', group: 'content' },
  { path: '/admin/content/entry', permission: 'content.manage', label: 'admin_pages.content.tabs.entry', icon: 'lucide:clapperboard', group: 'content' },
  { path: '/admin/content/franchise', permission: 'content.manage', label: 'admin_pages.content.tabs.franchise', icon: 'lucide:layers', group: 'content' },
  { path: '/admin/content/song', permission: 'content.manage', label: 'admin_pages.content.tabs.song', icon: 'lucide:music', group: 'content' },
  { path: '/admin/events', permission: 'events.manage', label: 'admin_pages.events.title', icon: 'lucide:calendar-days', group: 'content' },
  { path: '/admin/event-series', permission: 'events.manage', label: 'admin_pages.event_series.title', icon: 'lucide:calendar-range', group: 'content' },
  { path: '/admin/reviews', permission: 'reviews.manage', label: 'admin_pages.reviews.title', icon: 'lucide:message-square', group: 'community' },
  { path: '/admin/articles', permission: 'articles.manage', label: 'admin_pages.articles.title', icon: 'lucide:newspaper', group: 'community' },
  { path: '/admin/reports', permission: ['articles.manage', 'discussions.moderate'], label: 'admin_pages.reports.title', icon: 'lucide:flag', group: 'community' },
  { path: '/admin/discussions/categories', permission: 'discussions.manage', label: 'admin_pages.discussions.categories.title', icon: 'lucide:folder-tree', group: 'community' },
  { path: '/admin/discussions/posts', permission: 'discussions.moderate', label: 'admin_pages.discussions.posts.title', icon: 'lucide:messages-square', group: 'community' },
  { path: '/admin/discussions/restrictions', permission: 'discussions.moderate', label: 'admin_pages.discussions.restrictions.title', icon: 'lucide:mic-off', group: 'community' },
  { path: '/admin/tags', permission: 'tags.manage', label: 'admin_pages.tags.title', icon: 'lucide:tags', group: 'community' },
  { path: '/admin/word-filters', permission: 'filters.manage', label: 'admin_pages.word_filters.title', icon: 'lucide:shield-ban', group: 'community' },
  { path: '/admin/lyrics', permission: 'lyrics.manage', label: 'admin_pages.lyrics.title', icon: 'lucide:file-music', group: 'community' },
  { path: '/admin/users', permission: 'users.manage', label: 'admin_pages.users.title', icon: 'lucide:users', group: 'users' },
  { path: '/admin/roles', permission: 'roles.manage', label: 'admin_pages.roles.title', icon: 'lucide:shield-check', group: 'users' },
  { path: '/admin/settings', permission: 'system.settings', label: 'admin_pages.settings.title', icon: 'lucide:settings', group: 'system' },
  { path: '/admin/link-providers', permission: 'content.manage', label: 'admin_pages.link_providers.title', icon: 'lucide:link', group: 'system' },
  { path: '/admin/audit', permission: 'audit.view', label: 'admin_pages.audit.title', icon: 'lucide:scroll-text', group: 'system' },
  { path: '/admin/system', permission: 'system.logs', label: 'admin_pages.system.title', icon: 'lucide:activity', group: 'system' },
]

/** The menu entry a route belongs to: an exact match, else the longest path prefix. */
export const findAdminMenuItem = (path: string, items: AdminMenuItem[] = adminMenu) =>
  items.find(item => item.path === path)
  ?? items.filter(item => item.path !== '/admin' && path.startsWith(`${item.path}/`)).sort((a, b) => b.path.length - a.path.length)[0]

export const adminContentTypes = ['work', 'artist', 'entry', 'franchise', 'song'] as const

/** Paths of the public pages and edit schemas for each revisionable content type. */
export const adminContentRoutes: Record<string, { api: string, front: string }> = {
  work: { api: 'works', front: 'works' },
  artist: { api: 'artists', front: 'artists' },
  entry: { api: 'entries', front: 'entries' },
  franchise: { api: 'franchises', front: 'series' },
}
