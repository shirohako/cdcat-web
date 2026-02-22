export interface PublicProfile {
  id: number
  username: string
  nickname?: string
  avatar?: string | null
  banner?: string | null
  bio?: string | null
  joined_at: string
  favorites: ProfileFavorites
  tracking: ProfileTracking
  favorite_works: ProfileFavoriteWork[]
  favorite_artists: ProfileFavoriteArtist[]
}

export interface ProfileFavorites {
  works: number
  artists: number
  songs: number
}

export interface ProfileTracking {
  plan_to_listen: number
  completed: number
  wishlist: number
  owned: number
  dropped: number
}

export interface ProfileFavoriteWork {
  id: number
  title: string
  slug?: string | null
  type: string
  classification?: string | null
  release_date?: string | null
  catalog_number?: string | null
  image_url?: string | null
  disc_count: number
  track_count: number
  duration: number
  favorites_count: number
  reviews_count: number
  favorited_at: string
}

export interface ProfileFavoriteArtist {
  id: number
  name: string
  slug?: string | null
  type: string
  image_url?: string | null
  favorited_at: string
}

// ==================== 分页响应 ====================

export interface PaginationInfo {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface ProfileFavoriteWorksResponse {
  works: ProfileFavoriteWork[]
  pagination: PaginationInfo
}

export interface ProfileFavoriteArtistsResponse {
  artists: ProfileFavoriteArtist[]
  pagination: PaginationInfo
}

export interface ProfileFavoriteSong {
  id: number
  title: string
  duration?: number
  track_number?: number
  disc_number?: number
  work?: {
    id: number
    title: string
    image_url?: string | null
  }
  favorited_at: string
}

export interface ProfileFavoriteSongsResponse {
  songs: ProfileFavoriteSong[]
  pagination: PaginationInfo
}
