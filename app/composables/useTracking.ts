/**
 * 追踪管理 Composable
 * 提供专辑追踪状态的获取、添加、删除、更新等功能
 */

import type {
  TrackingWork,
  TrackingStatus,
  TrackingStats,
  GetTrackingWorksResponse
} from '~/types/tracking'

// 状态映射: 字符串 <-> 数字
// 1=plan_to_listen(想听) 2=completed(听过) 3=wishlist(想买) 4=owned(已购入) 5=dropped(不感兴趣)
const statusToNumber: Record<TrackingStatus, number> = {
  plan_to_listen: 1,
  completed: 2,
  wishlist: 3,
  owned: 4,
  dropped: 5
}

const numberToStatus: Record<number, TrackingStatus> = {
  1: 'plan_to_listen',
  2: 'completed',
  3: 'wishlist',
  4: 'owned',
  5: 'dropped'
}

/**
 * 将 API 返回的 work+tracking 数据映射为前端 TrackingWork 类型
 * API 返回的是 work 对象，tracking 信息嵌套在 work.tracking 中
 */
const mapApiTracking = (item: any): TrackingWork => {
  const tracking = item.tracking || {}
  const statusRaw = tracking.status ?? item.status
  return {
    id: item.id,
    workId: item.id,
    workTitle: item.title ?? '',
    image_url: item.image_url ?? '',
    release_date: item.release_date ?? '',
    catalog_number: item.catalog_number ?? '',
    disc_count: item.disc_count ?? 1,
    track_count: item.track_count ?? 0,
    type: item.type ?? 'album',
    artists: item.artists ?? [],
    status: typeof statusRaw === 'number' ? numberToStatus[statusRaw] : statusRaw,
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
  const getTrackingWorks = async (
    status: TrackingStatus,
    page: number = 1,
    pageSize: number = 12
  ): Promise<GetTrackingWorksResponse> => {
    const response = await $api<any>('/v1/tracking/works', {
      params: {
        status: statusToNumber[status],
        page,
        per_page: pageSize
      }
    })

    const items = response.works ?? response.data ?? []
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
    const response = await $api<any>('/v1/tracking/stats')

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
   * 获取专辑的追踪状态（基于 workId）
   * @param workId 专辑 ID
   */
  const getWorkTracking = async (workId: number): Promise<{ status: TrackingStatus | null; trackingId: number | null }> => {
    try {
      const response = await $api<any>(`/v1/tracking/works/${workId}`)
      const status = typeof response.status === 'number'
        ? numberToStatus[response.status]
        : response.status
      return { status, trackingId: response.id }
    } catch (error: any) {
      if (error.statusCode === 404) {
        return { status: null, trackingId: null }
      }
      throw error
    }
  }

  /**
   * 设置或更新专辑的追踪状态（基于 workId）
   * @param workId 专辑 ID
   * @param status 追踪状态
   */
  const setWorkTracking = async (workId: number, status: TrackingStatus): Promise<{ status: TrackingStatus; id: number }> => {
    const response = await $api<any>(`/v1/tracking/works/${workId}`, {
      method: 'POST',
      body: { status: statusToNumber[status] }
    })
    return {
      status: typeof response.status === 'number' ? numberToStatus[response.status] : response.status,
      id: response.id
    }
  }

  /**
   * 删除专辑的追踪记录（基于 workId）
   * @param workId 专辑 ID
   */
  const deleteWorkTracking = async (workId: number): Promise<boolean> => {
    try {
      await $api(`/v1/tracking/works/${workId}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  }

  return {
    getTrackingWorks,
    getTrackingStats,
    setWorkTracking,
    getWorkTracking,
    deleteWorkTracking
  }
}
