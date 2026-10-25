export interface MenuItem {
  name: string
  i18nKey: string
  path: string
  icon: string
  badge?: string | number
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  {
    name: 'dashboard',
    i18nKey: 'menu.dashboard',
    path: '/',
    icon: 'lucide:layout-dashboard'
  },
  {
    name: 'album',
    i18nKey: 'menu.album',
    path: '/albums',
    icon: 'lucide:disc-3'
  },
  {
    name: 'artist',
    i18nKey: 'menu.artist',
    path: '/artists',
    icon: 'lucide:mic-2'
  },
  {
    name: 'event',
    i18nKey: 'menu.event',
    path: '/events',
    icon: 'lucide:calendar'
  },
  {
    name: 'entry',
    i18nKey: 'menu.entry',
    path: '/entries',
    icon: 'lucide:film'
  },
  {
    name: 'franchises',
    i18nKey: 'menu.series',
    path: '/franchises',
    icon: 'lucide:library'
  },
  {
    name: 'vinyl',
    i18nKey: 'menu.vinyl',
    path: '/vinyls',
    icon: 'lucide:disc'
  },
  {
    name: 'discussion',
    i18nKey: 'menu.discussion',
    path: '/discussions',
    icon: 'lucide:message-circle'
  },
  {
    name: 'article',
    i18nKey: 'menu.article',
    path: '/articles',
    icon: 'lucide:newspaper'
  },
  {
    name: 'about',
    i18nKey: 'menu.about',
    path: '/about',
    icon: 'lucide:info'
  }
]

/**
 * The account menu, in groups under small headings (`site.user_menu_groups.*`). The profile is not a row: the menu's
 * header (avatar and name) links to it. Notifications aren't either: the bell beside it has them.
 */
export const userMenuGroups = [
  {
    key: 'library',
    items: [
      { name: 'favorites', i18nKey: 'user.favorites', icon: 'lucide:heart', path: '/favorites' },
      { name: 'tracking', i18nKey: 'user.tracking', icon: 'lucide:bookmark', path: '/tracking' },
      { name: 'reviews', i18nKey: 'user.reviews', icon: 'lucide:message-square-text', path: '/reviews' },
    ],
  },
  {
    key: 'contribute',
    items: [
      { name: 'articles', i18nKey: 'user.articles', icon: 'lucide:newspaper', path: '/articles/mine' },
      { name: 'revisions', i18nKey: 'user.revisions', icon: 'lucide:git-pull-request', path: '/revisions' },
    ],
  },
  {
    key: 'account',
    items: [
      { name: 'account', i18nKey: 'user.account', icon: 'lucide:settings', path: '/account' },
    ],
  },
] as const
