/**
 * 追踪管理 Composable
 * 提供专辑追踪状态的获取、添加、删除、更新等功能
 */

import type {
  TrackingAlbum,
  TrackingStatus,
  TrackingStats,
  GetTrackingAlbumsResponse
} from '~/types/tracking'

/**
 * 将 API 返回的 album+tracking 数据映射为前端 TrackingAlbum 类型
 * API 返回的是 album 对象，tracking 信息嵌套在 album.tracking 中
 */
const mapApiTracking = (item: any): TrackingAlbum => {
  const tracking = item.tracking || {}
  const statusRaw = tracking.status ?? item.status
  return {
    id: item.id,
    albumId: item.id,
    albumTitle: item.title ?? '',
    image_url: item.image_url ?? '',
    release_date: item.release_date ?? '',
    catalog_number: item.catalog_number ?? '',
    disc_count: item.disc_count ?? 1,
    track_count: item.track_count ?? 0,
    type: item.type ?? 'album',
    artists: item.artists ?? [],
    status: statusRaw,
    statusUpdatedAt: tracking.updated_at ?? '',
    addedAt: tracking.created_at ?? ''
  }
}

export const useTracking = () => {
  const { $api } = useNuxtApp()

  /**
   * 获取某个状态的追踪专辑列表
   * @param status 追踪状态
   * @param page 分页页码
   * @param pageSize 每页数量
   */
  const getTrackingAlbums = async (
    status: TrackingStatus,
    page: number = 1,
    pageSize: number = 12
  ): Promise<GetTrackingAlbumsResponse> => {
    const response = await $api<any>('/v1/me/tracking/albums', {
      params: {
        status,
        page,
        per_page: pageSize
      }
    })

    const items = response.albums ?? response.data ?? []
    const pagination = response.pagination ?? {}

    return {
      data: items.map(mapApiTracking),
      total: pagination.total ?? items.length,
      page: pagination.current_page ?? page,
      pageSize: pagination.per_page ?? pageSize
    }
  }

  /**
   * 获取追踪统计信息
   */
  const getTrackingStats = async (): Promise<TrackingStats> => {
    const response = await $api<any>('/v1/me/tracking/stats')

    const stats = response.stats ?? response

    return {
      plan_to_listen: stats.plan_to_listen ?? 0,
      wishlist: stats.wishlist ?? 0,
      completed: stats.completed ?? 0,
      owned: stats.owned ?? 0,
      dropped: stats.dropped ?? 0,
      total: response.total ?? 0
    }
  }

  /**
   * 获取专辑的追踪状态（基于 albumId）
   * @param albumId 专辑 ID
   */
  const getAlbumTracking = async (albumId: number): Promise<{ status: TrackingStatus | null; trackingId: number | null }> => {
    try {
      const response = await $api<any>(`/v1/me/tracking/albums/${albumId}`)
      const tracking = response.tracking ?? response
      return { status: tracking?.status ?? null, trackingId: tracking?.id ?? null }
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: null, trackingId: null }
      }
      throw error
    }
  }

  /**
   * 设置或更新专辑的追踪状态（基于 albumId）
   * @param albumId 专辑 ID
   * @param status 追踪状态
   */
  const setAlbumTracking = async (albumId: number, status: TrackingStatus): Promise<{ status: TrackingStatus; id: number }> => {
    const response = await $api<any>(`/v1/me/tracking/albums/${albumId}`, {
      method: 'PUT',
      body: { status }
    })
    return {
      status: response.status,
      id: response.id
    }
  }

  /**
   * 删除专辑的追踪记录（基于 albumId）
   * @param albumId 专辑 ID
   */
  const deleteAlbumTracking = async (albumId: number): Promise<boolean> => {
    try {
      await $api(`/v1/me/tracking/albums/${albumId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  return {
    getTrackingAlbums,
    getTrackingStats,
    setAlbumTracking,
    getAlbumTracking,
    deleteAlbumTracking
  }
}
