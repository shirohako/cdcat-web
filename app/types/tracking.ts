/**
 * 追踪管理 - 数据模型和接口定义
 * 用户可以追踪专辑的状态（只对专辑有效）
 */

// 追踪状态枚举
export type TrackingStatus = 'plan_to_listen' | 'wishlist' | 'completed' | 'owned' | 'dropped'

// 艺术家信息
export interface Artist {
  id: number
  name: string
  image_url?: string
}

// 追踪专辑信息
export interface TrackingWork {
  id: number // 追踪记录 ID
  workId: number // 专辑 ID
  workTitle: string // 专辑标题
  image_url: string // 专辑封面
  release_date: string // 发行日期
  catalog_number: string // 编号
  disc_count: number // 光盘数
  track_count: number // 轨道数
  type: 'album' | 'single' | 'ep' | 'compilation' // 类型
  artists: Artist[] // 艺术家列表
  status: TrackingStatus // 当前追踪状态
  statusUpdatedAt: string // 状态更新时间
  addedAt: string // 添加到追踪时间
}

// 追踪统计信息
export interface TrackingStats {
  plan_to_listen: number
  wishlist: number
  completed: number
  owned: number
  dropped: number
  total: number
}

// API 请求/响应类型
export interface GetTrackingWorksResponse {
  data: TrackingWork[]
  total: number
  page: number
  pageSize: number
}

export interface UpdateTrackingStatusRequest {
  trackingId: number
  newStatus: TrackingStatus
}

export interface UpdateTrackingStatusResponse {
  success: boolean
  tracking: TrackingWork
}

export interface RemoveTrackingRequest {
  trackingId: number
}

export interface RemoveTrackingResponse {
  success: boolean
  trackingId: number
}

export interface CreateTrackingRequest {
  workId: number
  status: TrackingStatus
}

export interface CreateTrackingResponse {
  success: boolean
  tracking: TrackingWork
}
