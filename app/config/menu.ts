export interface MenuItem {
  name: string
  path: string
  icon: string
  badge?: string | number
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  {
    name: '仪表盘',
    path: '/',
    icon: 'lucide:layout-dashboard'
  },
  {
    name: '项目',
    path: '/projects',
    icon: 'lucide:folder'
  },
  {
    name: '任务',
    path: '/tasks',
    icon: 'lucide:check-square'
  },
  {
    name: '团队',
    path: '/team',
    icon: 'lucide:users'
  },
  {
    name: '设置',
    path: '/settings',
    icon: 'lucide:settings'
  }
]

export const userMenuItems = [
  { name: '个人资料', icon: 'lucide:user', path: '/profile' },
  { name: '账户设置', icon: 'lucide:settings', path: '/account' },
  { name: '帮助中心', icon: 'lucide:help-circle', path: '/help' }
]
