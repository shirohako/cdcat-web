/**
 * Favorites 数据模型和接口定义
 * 用户收藏功能：可收藏专辑(work)、歌曲(song)、艺术家(artist)
 */

// ==================== 数据库表设计 ====================
/*
用户收藏表设计方案：

1. user_favorites_works - 用户收藏的专辑
   - id: BIGINT PRIMARY KEY
   - user_id: BIGINT (外键, users.id)
   - work_id: BIGINT (外键, works.id)
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP
   - 唯一索引: (user_id, work_id)

2. user_favorites_songs - 用户收藏的歌曲
   - id: BIGINT PRIMARY KEY
   - user_id: BIGINT (外键, users.id)
   - song_id: BIGINT (外键, songs.id)
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP
   - 唯一索引: (user_id, song_id)

3. user_favorites_artists - 用户关注的艺术家
   - id: BIGINT PRIMARY KEY
   - user_id: BIGINT (外键, users.id)
   - artist_id: BIGINT (外键, artists.id)
   - created_at: TIMESTAMP
   - updated_at: TIMESTAMP
   - 唯一索引: (user_id, artist_id)
*/

// ==================== TypeScript 类型定义 ====================

export interface FavoriteWork {
  id: number
  workId: number
  workTitle: string
  artists: string[] // 艺术家名称列表
  cover?: string // 封面图片URL
  releaseDate?: string
  createdAt: string
}

export interface FavoriteSong {
  id: number
  songId: number
  songTitle: string
  artist: string // 艺术家名称
  workTitle?: string // 所属专辑
  cover?: string // 封面图片URL（通常为专辑封面）
  duration?: number // 时长（秒）
  createdAt: string
}

export interface FavoriteArtist {
  id: number
  artistId: number
  artistName: string
  avatar?: string // 艺术家头像
  followersCount?: number
  createdAt: string
}

// 收藏汇总信息
export interface FavoritesStats {
  worksCount: number
  songsCount: number
  artistsCount: number
}

// API 请求/响应类型
export interface GetFavoritesResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface AddFavoriteRequest {
  itemId: number
  type: 'work' | 'song' | 'artist'
}

export interface RemoveFavoriteRequest {
  itemId: number
  type: 'work' | 'song' | 'artist'
}

export interface CheckFavoriteResponse {
  isFavorited: boolean
  favoriteId?: number
}
