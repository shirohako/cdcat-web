/**
 * 收藏管理 Composable
 * 提供获取、添加、删除收藏等功能
 */

import type {
  FavoriteAlbum,
  FavoriteTrack,
  FavoriteArtist,
} from '~/types/favorites'

export type FavoriteType = 'albums' | 'artists' | 'tracks'

export const useFavorites = () => {
  const { $api } = useNuxtApp()

  const setFavorite = async (type: FavoriteType, id: number, favorited: boolean): Promise<{ favorited: boolean }> => {
    return await $api(`/v1/me/favorites/${type}/${id}`, { method: favorited ? 'PUT' : 'DELETE' }) as { favorited: boolean }
  }

  // 获取用户收藏的专辑列表（真实 API）
  const getFavoriteAlbums = async (
    page: number = 1,
    perPage: number = 15
  ): Promise<{ albums: FavoriteAlbum[]; pagination: { total: number; per_page: number; current_page: number; last_page: number } }> => {
    return await $api('/v1/me/favorites/albums', {
      params: { page, per_page: perPage }
    }) as any
  }

  // 收藏或取消收藏：PUT 收藏、DELETE 取消，重复请求结果不变
  const setFavoriteAlbum = async (albumId: number, favorited: boolean): Promise<{ favorited: boolean }> => {
    return await setFavorite('albums', albumId, favorited)
  }

  // 获取用户收藏的歌曲列表（真实 API）
  const getFavoriteTracks = async (
    page: number = 1,
    perPage: number = 15
  ): Promise<{ tracks: FavoriteTrack[]; pagination: { total: number; per_page: number; current_page: number; last_page: number } }> => {
    return await $api('/v1/me/favorites/tracks', {
      params: { page, per_page: perPage }
    }) as any
  }

  // 收藏或取消收藏：PUT 收藏、DELETE 取消，重复请求结果不变
  const setFavoriteTrack = async (trackId: number, favorited: boolean): Promise<{ favorited: boolean }> => {
    return await setFavorite('tracks', trackId, favorited)
  }

  // 获取用户关注的艺术家列表（真实 API）
  const getFavoriteArtists = async (
    page: number = 1,
    perPage: number = 15
  ): Promise<{ artists: FavoriteArtist[]; pagination: { total: number; per_page: number; current_page: number; last_page: number } }> => {
    return await $api('/v1/me/favorites/artists', {
      params: { page, per_page: perPage }
    }) as any
  }

  // 收藏或取消收藏：PUT 收藏、DELETE 取消，重复请求结果不变
  const setFavoriteArtist = async (artistId: number, favorited: boolean): Promise<{ favorited: boolean }> => {
    return await setFavorite('artists', artistId, favorited)
  }

  return {
    setFavorite,
    getFavoriteAlbums,
    setFavoriteAlbum,
    getFavoriteTracks,
    setFavoriteTrack,
    getFavoriteArtists,
    setFavoriteArtist,
  }
}
