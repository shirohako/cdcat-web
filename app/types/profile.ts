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
  workId: number
  workTitle: string
  cover?: string
  artists: string[]
  releaseDate?: string
}

export interface ProfileFavoriteArtist {
  id: number
  artistId: number
  artistName: string
  avatar?: string
}
