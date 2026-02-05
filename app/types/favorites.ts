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
  title: string
  catalog_number?: string
  image_url?: string
  release_date?: string
  artists?: Array<{ id: number; name: string; pivot?: { display_name?: string } }>
  favorited_at: string
}

export interface FavoriteSong {
  id: number
  title: string
  duration?: number
  track_number?: number
  disc_number?: number
  work?: {
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

