/**
 * Favorites 数据模型和接口定义
 * 用户收藏功能：可收藏专辑(album)、歌曲(track)、艺术家(artist)
 */

// ==================== TypeScript 类型定义 ====================

export interface FavoriteAlbum {
  id: number
  title: string
  catalog_number?: string
  image_url?: string
  release_date?: string
  artists?: Array<{ id: number; name: string; pivot?: { display_name?: string } }>
  favorited_at: string
}

export interface FavoriteTrack {
  id: number
  title: string
  duration?: number
  track_number?: number
  disc_number?: number
  album?: {
    id: number
    title: string
    image_url?: string
  }
  favorited_at: string
}

export interface FavoriteArtist {
  id: number
  name: string
  image_url?: string
  favorited_at: string
}

