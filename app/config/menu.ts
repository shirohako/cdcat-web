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
    path: '/works',
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
    name: 'series',
    i18nKey: 'menu.series',
    path: '/series',
    icon: 'lucide:library'
  },
  {
    name: 'vinyl',
    i18nKey: 'menu.vinyl',
    path: '/vinyls',
    icon: 'lucide:disc'
  }
]

export const userMenuItems = [
  { name: 'profile', i18nKey: 'user.profile', icon: 'lucide:user', path: '/profile' },
  { name: 'revisions', i18nKey: 'user.revisions', icon: 'lucide:git-pull-request', path: '/revisions' },
  { name: 'account', i18nKey: 'user.account', icon: 'lucide:settings', path: '/account' },
  { name: 'help', i18nKey: 'user.help', icon: 'lucide:help-circle', path: '/help' }
]
