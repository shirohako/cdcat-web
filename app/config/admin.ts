export const adminMenu = [
  { path: '/admin', permission: 'admin.access', label: 'admin_pages.dashboard.title', icon: 'lucide:layout-dashboard' },
  { path: '/admin/revisions', permission: 'revisions.view', label: 'admin_pages.revisions.title', icon: 'lucide:git-pull-request' },
  { path: '/admin/content', permission: 'content.manage', label: 'admin_pages.content.title', icon: 'lucide:library' },
  { path: '/admin/events', permission: 'events.manage', label: 'admin_pages.events.title', icon: 'lucide:calendar-days' },
  { path: '/admin/link-providers', permission: 'content.manage', label: 'admin_pages.link_providers.title', icon: 'lucide:link' },
  { path: '/admin/reviews', permission: 'reviews.manage', label: 'admin_pages.reviews.title', icon: 'lucide:message-square' },
  { path: '/admin/articles', permission: 'articles.manage', label: 'admin_pages.articles.title', icon: 'lucide:newspaper' },
  { path: '/admin/lyrics', permission: 'lyrics.manage', label: 'admin_pages.lyrics.title', icon: 'lucide:file-music' },
  { path: '/admin/users', permission: 'users.manage', label: 'admin_pages.users.title', icon: 'lucide:users' },
  { path: '/admin/roles', permission: 'roles.manage', label: 'admin_pages.roles.title', icon: 'lucide:shield-check' },
  { path: '/admin/settings', permission: 'system.settings', label: 'admin_pages.settings.title', icon: 'lucide:settings' },
  { path: '/admin/audit', permission: 'audit.view', label: 'admin_pages.audit.title', icon: 'lucide:scroll-text' },
  { path: '/admin/system', permission: 'system.logs', label: 'admin_pages.system.title', icon: 'lucide:activity' },
]

export const adminContentTypes = ['work', 'artist', 'entry', 'franchise', 'song'] as const

/** Paths of the public pages and edit schemas for each revisionable content type. */
export const adminContentRoutes: Record<string, { api: string, front: string }> = {
  work: { api: 'works', front: 'works' },
  artist: { api: 'artists', front: 'artists' },
  entry: { api: 'entries', front: 'entries' },
  franchise: { api: 'franchises', front: 'series' },
}
