import type { CatalogImage } from './catalog'

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

/** GET /v1/me/profile-images: the avatar and banner with the uploads behind them (null for a default avatar or an address from before uploads). */
export interface ProfileImages {
  avatar_url: string | null
  banner_url: string | null
  avatar_image: CatalogImage | null
  banner_image: CatalogImage | null
}
