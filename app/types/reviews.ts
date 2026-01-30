/**
 * 评价管理 - 数据模型和接口定义
 * 用户可以对专辑发表评价（文字感想）并可选打分（0-10分）
 */

// 排序选项
export type ReviewSortBy = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'

// 艺术家信息
export interface ReviewArtist {
  id: number
  name: string
  image_url?: string
}

// 评价互动计数（类似 Steam）
export interface ReviewReactions {
  helpful: number             // 有用
  unhelpful: number           // 无用
  funny: number               // 欢乐
}

// 用户评价
export interface UserReview {
  id: number
  workId: number
  workTitle: string
  workImageUrl: string
  artists: ReviewArtist[]
  content: string             // 评价内容
  score: number | null        // 0-10 分，null 表示未评分
  reactions: ReviewReactions  // 互动计数
  createdAt: string           // 创建时间
  updatedAt: string           // 更新时间
}

// 评价统计
export interface ReviewStats {
  totalReviews: number
  averageScore: number        // 仅计算有评分的平均值，无评分时为 0
  scoredCount: number         // 有评分的评价数
}

// 分页响应
export interface GetReviewsResponse {
  data: UserReview[]
  total: number
  page: number
  pageSize: number
}

// 可搜索的专辑（写评价模态框用）
export interface SearchableAlbum {
  id: number
  title: string
  imageUrl: string
  artists: ReviewArtist[]
  releaseDate: string
  catalogNumber: string
}

// 创建评价请求
export interface CreateReviewRequest {
  workId: number
  content: string
  score: number | null
}

// 更新评价请求
export interface UpdateReviewRequest {
  reviewId: number
  content: string
  score: number | null
}
