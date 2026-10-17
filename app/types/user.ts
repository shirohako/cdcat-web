export interface User {
  id: number
  username: string
  nickname: string
  email: string
  avatar_url?: string | null
  role_level?: number
  roles: string
  permissions: string[]
  joined_at: string
  last_seen_at: string
}
