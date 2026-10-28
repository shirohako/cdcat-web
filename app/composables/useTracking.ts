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
import type { Pagination } from '~/types/api'

/** 一条追踪记录（API 的 album.tracking） */
interface ApiTracking {
  id?: number
  status?: TrackingStatus
  created_at?: string
  updated_at?: string
}

/** API 返回的专辑，追踪信息在 tracking 里 */
interface ApiTrackingItem {
  id: number
  title?: string
  image_url?: string
  release_date?: string
  catalog_number?: string
  disc_count?: number
  track_count?: number
  type?: TrackingAlbum['type']
  byline?: TrackingAlbum['byline']
  status?: TrackingStatus
  tracking?: ApiTracking | null
}

type ApiTrackingStats = Partial<Omit<TrackingStats, 'total'>>

/**
 * 将 API 返回的 album+tracking 数据映射为前端 TrackingAlbum 类型
 * API 返回的是 album 对象，tracking 信息嵌套在 album.tracking 中
 */
const mapApiTracking = (item: ApiTrackingItem): TrackingAlbum => {
  const tracking: ApiTracking = item.tracking || {}
  const statusRaw = (tracking.status ?? item.status) as TrackingStatus
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
    byline: item.byline ?? null,
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
    const response = await $api<{ albums?: ApiTrackingItem[]; data?: ApiTrackingItem[]; pagination?: Partial<Pagination> }>('/v1/me/tracking/albums', {
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
    const response = await $api<ApiTrackingStats & { stats?: ApiTrackingStats; total?: number }>('/v1/me/tracking/stats')

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
      const response = await $api<ApiTracking & { tracking?: ApiTracking | null }>(`/v1/me/tracking/albums/${albumId}`)
      const tracking = response.tracking ?? response
      return { status: tracking?.status ?? null, trackingId: tracking?.id ?? null }
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
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
    const response = await $api<{ status: TrackingStatus; id: number }>(`/v1/me/tracking/albums/${albumId}`, {
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
