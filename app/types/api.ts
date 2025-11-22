/**
 * API 响应类型定义
 */

// 成功响应
export interface ApiResponse<T = any> {
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
  [key: string]: any
}

// 错误响应
export interface ApiErrorResponse {
  success: false
  error: {
    code: string | number
    name: string
    message: string
    [key: string]: any
  }
}
