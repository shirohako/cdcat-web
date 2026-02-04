/**
 * 收藏管理 Composable
 * 提供获取、添加、删除收藏等功能
 */

import type {
  FavoriteWork,
  FavoriteSong,
  FavoriteArtist,
  FavoritesStats,
  GetFavoritesResponse,
  CheckFavoriteResponse
} from '~/types/favorites'

// Mock 数据 - Songs
const mockFavoriteSongs: FavoriteSong[] = [
  {
    id: 1,
    songId: 201,
    songTitle: 'Gurenge',
    artist: 'LiSA',
    workTitle: 'Demon Slayer',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 256,
    createdAt: '2024-01-01'
  },
  {
    id: 2,
    songId: 202,
    songTitle: 'Red Swan',
    artist: 'Yoshiki',
    workTitle: 'Attack on Titan',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 240,
    createdAt: '2024-01-02'
  },
  {
    id: 3,
    songId: 203,
    songTitle: 'Lost in Paradise',
    artist: 'ALI',
    workTitle: 'Jujutsu Kaisen',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 252,
    createdAt: '2024-01-03'
  },
  {
    id: 4,
    songId: 204,
    songTitle: 'Kaikai Kitan',
    artist: 'Eve',
    workTitle: 'Jujutsu Kaisen',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 244,
    createdAt: '2024-01-04'
  },
  {
    id: 5,
    songId: 205,
    songTitle: 'Nandemonaiya',
    artist: 'RADWIMPS',
    workTitle: 'Your Name',
    cover: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=100&h=100&fit=crop',
    duration: 303,
    createdAt: '2024-01-05'
  }
]


export const useFavorites = () => {
  const { $api } = useNuxtApp()

  // 获取用户收藏的专辑列表（真实 API）
  const getFavoriteWorks = async (
    page: number = 1,
    perPage: number = 15
  ): Promise<{ works: FavoriteWork[]; pagination: { total: number; per_page: number; current_page: number; last_page: number } }> => {
    return await $api('/v1/favorites/works', {
      params: { page, per_page: perPage }
    }) as any
  }

  // 切换专辑收藏状态（真实 API）
  const toggleFavoriteWork = async (workId: number): Promise<{ favorited: boolean }> => {
    return await $api(`/v1/favorites/works/${workId}`, {
      method: 'POST'
    }) as any
  }

  // 获取用户收藏的歌曲列表（Mock）
  const getFavoriteSongs = async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<GetFavoritesResponse<FavoriteSong>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return {
      data: mockFavoriteSongs.slice(start, end),
      total: mockFavoriteSongs.length,
      page,
      pageSize
    }
  }

  // 获取用户关注的艺术家列表（真实 API）
  const getFavoriteArtists = async (
    page: number = 1,
    perPage: number = 15
  ): Promise<{ artists: FavoriteArtist[]; pagination: { total: number; per_page: number; current_page: number; last_page: number } }> => {
    return await $api('/v1/favorites/artists', {
      params: { page, per_page: perPage }
    }) as any
  }

  // 切换艺术家收藏状态（真实 API）
  const toggleFavoriteArtist = async (artistId: number): Promise<{ favorited: boolean }> => {
    return await $api(`/v1/favorites/artists/${artistId}`, {
      method: 'POST'
    }) as any
  }

  // 获取收藏统计信息（Mock）
  const getFavoritesStats = async (): Promise<FavoritesStats> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      worksCount: 0,
      songsCount: mockFavoriteSongs.length,
      artistsCount: 0
    }
  }

  // 添加收藏（Mock）
  const addFavorite = async (itemId: number, type: 'work' | 'song' | 'artist'): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return true
  }

  // 删除收藏（Mock）
  const removeFavorite = async (itemId: number, type: 'work' | 'song' | 'artist'): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return true
  }

  // 检查是否已收藏（Mock）
  const checkFavorite = async (
    itemId: number,
    type: 'work' | 'song' | 'artist'
  ): Promise<CheckFavoriteResponse> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      isFavorited: false,
      favoriteId: undefined
    }
  }

  // 删除一个收藏项（Mock - 用于 songs/artists）
  const removeFavoriteItem = async (
    favoriteId: number,
    type: 'work' | 'song' | 'artist'
  ): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return true
  }

  return {
    getFavoriteWorks,
    toggleFavoriteWork,
    getFavoriteSongs,
    getFavoriteArtists,
    toggleFavoriteArtist,
    getFavoritesStats,
    addFavorite,
    removeFavorite,
    checkFavorite,
    removeFavoriteItem
  }
}
