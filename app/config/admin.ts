import type { AdminContentType } from '~/types/admin'
/** Sidebar groups in display order: by what the pages are for, not by which permission they need. */
export const adminGroups = [
  { key: 'overview', label: '概览' },
  { key: 'music', label: '专辑与曲目' },
  { key: 'artists', label: '艺术家与厂牌' },
  { key: 'entries', label: '条目与系列' },
  { key: 'events', label: '活动' },
  { key: 'harvest', label: '候选数据' },
  { key: 'catalog_settings', label: '资料设置' },
  { key: 'articles', label: '文章' },
  { key: 'discussions', label: '讨论区' },
  { key: 'moderation', label: '审核与处理' },
  { key: 'community_settings', label: '社区设置' },
  { key: 'users', label: '用户' },
  { key: 'mail', label: '邮件' },
  { key: 'system', label: '系统' },
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
  { path: '/admin', permission: 'admin.access', label: '工作台', icon: 'lucide:layout-dashboard', group: 'overview' },
  { path: '/admin/revisions', permission: 'revisions.view', label: '审核中心', icon: 'lucide:git-pull-request', group: 'overview' },
  { path: '/admin/content/albums', permission: 'content.manage', label: '专辑', icon: 'lucide:disc-3', group: 'music' },
  { path: '/admin/content/tracks', permission: 'content.manage', label: '曲目', icon: 'lucide:music', group: 'music' },
  { path: '/admin/content/lyrics', permission: 'content.manage', label: '歌词', icon: 'lucide:file-text', group: 'music' },
  { path: '/admin/content/artists', permission: 'content.manage', label: '艺术家', icon: 'lucide:mic-vocal', group: 'artists' },
  { path: '/admin/content/labels', permission: 'content.manage', label: '厂牌', icon: 'lucide:building-2', group: 'artists' },
  { path: '/admin/content/entries', permission: 'content.manage', label: '条目', icon: 'lucide:clapperboard', group: 'entries' },
  { path: '/admin/content/franchises', permission: 'content.manage', label: '系列', icon: 'lucide:layers', group: 'entries' },
  { path: '/admin/events', permission: 'events.manage', label: '活动', icon: 'lucide:calendar-days', group: 'events' },
  { path: '/admin/event-series', permission: 'events.manage', label: '活动系列', icon: 'lucide:calendar-range', group: 'events' },
  { path: '/admin/harvest', permission: 'harvest.manage', label: '采集概况', icon: 'lucide:radar', group: 'harvest' },
  { path: '/admin/harvest/tasks', permission: 'harvest.manage', label: '采集任务', icon: 'lucide:clipboard-list', group: 'harvest' },
  { path: '/admin/harvest/candidates', permission: 'harvest.manage', label: '待审核候选', icon: 'lucide:list-todo', group: 'harvest' },
  { path: '/admin/credit-roles', permission: 'content.manage', label: '角色字典', icon: 'lucide:contact', group: 'catalog_settings' },
  { path: '/admin/attribute-definitions', permission: 'content.manage', label: '属性定义', icon: 'lucide:list-checks', group: 'catalog_settings' },
  { path: '/admin/link-providers', permission: 'content.manage', label: '链接提供方', icon: 'lucide:link', group: 'catalog_settings' },
  { path: '/admin/articles', permission: 'articles.manage', label: '文章管理', icon: 'lucide:newspaper', group: 'articles' },
  { path: '/admin/article-types', permission: 'articles.manage', label: '文章类型', icon: 'lucide:shapes', group: 'articles' },
  { path: '/admin/discussions/categories', permission: 'discussions.manage', label: '讨论版块', icon: 'lucide:folder-tree', group: 'discussions' },
  { path: '/admin/discussions/topics', permission: 'discussions.moderate', label: '主题', icon: 'lucide:messages-square', group: 'discussions' },
  { path: '/admin/discussions/posts', permission: 'discussions.moderate', label: '全部帖子', icon: 'lucide:message-square-text', group: 'discussions' },
  { path: '/admin/reports', permission: ['articles.manage', 'discussions.moderate', 'shouts.manage', 'reviews.manage'], label: '举报处理', icon: 'lucide:flag', group: 'moderation' },
  { path: '/admin/reviews', permission: 'reviews.manage', label: '评价管理', icon: 'lucide:message-square', group: 'moderation' },
  { path: '/admin/shouts', permission: 'shouts.manage', label: '留言', icon: 'lucide:message-circle', group: 'moderation' },
  { path: '/admin/lyrics', permission: 'lyrics.manage', label: '歌词巡查', icon: 'lucide:file-music', group: 'moderation' },
  { path: '/admin/discussions/restrictions', permission: ['discussions.moderate', 'lyrics.manage', 'shouts.manage', 'reviews.manage'], label: '用户限制', icon: 'lucide:mic-off', group: 'moderation' },
  { path: '/admin/tags', permission: 'tags.manage', label: '标签库', icon: 'lucide:tags', group: 'community_settings' },
  { path: '/admin/word-filters', permission: 'filters.manage', label: '关键词过滤', icon: 'lucide:shield-ban', group: 'community_settings' },
  { path: '/admin/users', permission: 'users.manage', label: '用户管理', icon: 'lucide:users', group: 'users' },
  { path: '/admin/roles', permission: 'roles.manage', label: '角色与权限', icon: 'lucide:shield-check', group: 'users' },
  { path: '/admin/mail/campaigns', permission: 'mail.manage', label: '群发', icon: 'lucide:send', group: 'mail' },
  { path: '/admin/mail/templates', permission: 'mail.manage', label: '邮件模板', icon: 'lucide:layout-template', group: 'mail' },
  { path: '/admin/mail/categories', permission: 'mail.manage', label: '邮件类型', icon: 'lucide:inbox', group: 'mail' },
  { path: '/admin/mail/suppressions', permission: 'mail.manage', label: '退信名单', icon: 'lucide:mail-x', group: 'mail' },
  { path: '/admin/mail/logs', permission: 'mail.logs', label: '发送记录', icon: 'lucide:mail-search', group: 'mail' },
  { path: '/admin/settings', permission: 'system.settings', label: '站点设置', icon: 'lucide:settings', group: 'system' },
  { path: '/admin/images', permission: 'content.manage', label: '图片', icon: 'lucide:images', group: 'system' },
  { path: '/admin/audit', permission: 'audit.view', label: '操作日志', icon: 'lucide:scroll-text', group: 'system' },
  { path: '/admin/system', permission: 'system.logs', label: '运维', icon: 'lucide:activity', group: 'system' },
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
