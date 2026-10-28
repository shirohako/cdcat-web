/**
 * API 响应类型定义
 */

// 成功响应
export interface ApiResponse<T = unknown> {
  success: true
  data: T
  meta?: ApiMeta
}

// 分页元数据
export interface ApiMeta {
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
  [key: string]: unknown
}

// 错误响应
export interface ApiErrorResponse {
  success: false
  error: {
    code: string | number
    name: string
    message: string
    [key: string]: unknown
  }
}

// 列表接口的分页信息（data.pagination）
export interface Pagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}
