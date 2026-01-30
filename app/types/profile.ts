export interface PublicProfile {
  id: number
  username: string
  nickname?: string
  avatar?: string
  bio?: string
  created_at: string
  stats: ProfileStats
  recentReviews: ProfileReview[]
  favoriteWorks: ProfileFavoriteWork[]
  favoriteArtists: ProfileFavoriteArtist[]
  recentActivity: ProfileActivityItem[]
  musicTaste: ProfileTasteTag[]
}

export interface ProfileStats {
  reviewsCount: number
  favoritesCount: number
  trackingCount: number
  discussionsCount: number
  contributionsCount: number
  averageScore: number
}

export interface ProfileReview {
  id: number
  workId: number
  workTitle: string
  workImageUrl: string
  artists: { id: number; name: string }[]
  content: string
  score: number | null
  createdAt: string
  reactions: {
    helpful: number
    unhelpful: number
    funny: number
  }
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

export interface ProfileActivityItem {
  id: number
  type: 'review' | 'favorite' | 'tracking' | 'discussion' | 'contribution'
  title: string
  description: string
  targetId?: number
  targetUrl?: string
  createdAt: string
}

export interface ProfileTasteTag {
  name: string
  count: number
  color: string
}
