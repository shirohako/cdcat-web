export interface User {
  id: number
  username: string
  nickname: string
  email: string
  avatar?: string | null
  roles: string
  permissions: string[]
  joined_at: string
  last_seen_at: string
}
