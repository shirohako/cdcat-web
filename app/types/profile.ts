export interface PublicProfile {
  id: number
  username: string
  nickname?: string
  avatar?: string
  banner?: string
  bio?: string
  created_at: string
  stats: ProfileStats
  favoriteWorks: ProfileFavoriteWork[]
  favoriteArtists: ProfileFavoriteArtist[]
  musicTaste: ProfileTasteTag[]
}

export interface ProfileStats {
  favoritesCount: number
  wantListenCount: number
  listenedCount: number
  wantPurchaseCount: number
  purchasedCount: number
  droppedCount: number
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

export interface ProfileTasteTag {
  name: string
  count: number
  color: string
}
