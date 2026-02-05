/**
 * 收藏管理 Composable
 * 提供获取、添加、删除收藏等功能
 */

import type {
  FavoriteWork,
  FavoriteSong,
  FavoriteArtist,
} from '~/types/favorites'

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

  // 获取用户收藏的歌曲列表（真实 API）
  const getFavoriteSongs = async (
    page: number = 1,
    perPage: number = 15
  ): Promise<{ songs: FavoriteSong[]; pagination: { total: number; per_page: number; current_page: number; last_page: number } }> => {
    return await $api('/v1/favorites/songs', {
      params: { page, per_page: perPage }
    }) as any
  }

  // 切换歌曲收藏状态（真实 API）
  const toggleFavoriteSong = async (songId: number): Promise<{ favorited: boolean }> => {
    return await $api(`/v1/favorites/songs/${songId}`, {
      method: 'POST'
    }) as any
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

  return {
    getFavoriteWorks,
    toggleFavoriteWork,
    getFavoriteSongs,
    toggleFavoriteSong,
    getFavoriteArtists,
    toggleFavoriteArtist,
  }
}
