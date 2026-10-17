import type { TrackingStatus } from './tracking'

export interface PublicProfile {
  id: number
  username: string
  nickname?: string
  avatar_url?: string | null
  banner_url?: string | null
  bio?: string | null
  joined_at: string
  favorites: ProfileFavorites
  tracking: ProfileTracking
  reviews_count: number
  discussion_topics_count: number
  discussion_posts_count: number
  contributions_count: number
  favorite_albums: ProfileFavoriteAlbum[]
  favorite_artists: ProfileFavoriteArtist[]
}

export interface ProfileFavorites {
  albums: number
  artists: number
  tracks: number
}

export interface ProfileTracking {
  plan_to_listen: number
  completed: number
  wishlist: number
  owned: number
  dropped: number
}

export interface ProfileFavoriteAlbum {
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

export interface ProfileFavoriteAlbumsResponse {
  albums: ProfileFavoriteAlbum[]
  pagination: PaginationInfo
}

export interface ProfileFavoriteArtistsResponse {
  artists: ProfileFavoriteArtist[]
  pagination: PaginationInfo
}

// ==================== Tracking ====================

export interface ProfileTrackingAlbum {
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
  is_favorited: boolean
  tracking: {
    status: TrackingStatus
    created_at: string
    updated_at: string
  }
}

export interface ProfileTrackingResponse {
  albums: ProfileTrackingAlbum[]
  pagination: PaginationInfo
}

// ==================== Favorite Tracks ====================

export interface ProfileFavoriteTrack {
  id: number
  title: string
  duration?: number
  track_number?: number
  disc_number?: number
  album?: {
    id: number
    title: string
    image_url?: string | null
  }
  favorited_at: string
}

export interface ProfileFavoriteTracksResponse {
  tracks: ProfileFavoriteTrack[]
  pagination: PaginationInfo
}
