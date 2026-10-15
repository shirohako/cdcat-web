import type { ApiResponse, ApiErrorResponse } from '~/types/api'
import type { User } from '~/types/auth'

/**
 * 自定义 API 插件
 *
 * API 响应格式：
 * 成功: { success: true, data: ..., meta?: {...} }
 * 失败: { success: false, error: { code, name, message } }
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const stateToken = useState<string | null>('auth:token')
  const stateUser = useState<User | null>('auth:user')
  const authTokenCookie = useCookie<string | null>('auth_token')
  const authUserCookie = useCookie('auth_user')
  const translateError = (key: string) => nuxtApp.$i18n.t(key)

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,

    // 请求拦截器
    onRequest({ options }) {
      // 从 useState 读取 token（与 useAuth composable 共享同一个 ref，写入即时生效）
      // 回退到 cookie（SSR 首次请求时 useState 可能未初始化）
      const token = stateToken.value || authTokenCookie.value

      if (token) {
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${token}`)
        options.headers = headers
      }
    },

    // 响应拦截器 - 处理成功响应
    onResponse({ response }) {
      // Let HTTP errors reach onResponseError, which also clears invalid sessions.
      if (!response.ok) return
      const result = response._data as ApiResponse | ApiErrorResponse

      // 检查是否为标准响应格式
      if (!result || typeof result !== 'object' || !('success' in result)) {
        return // 非标准格式，直接返回
      }

      // 处理失败响应
      if (!result.success) {
        const errorResponse = result as ApiErrorResponse
        const error = new Error(translateError('errors.request_failed'))
        // 附加错误详情
        Object.assign(error, {
          code: errorResponse.error.code,
          name: errorResponse.error.name,
          details: errorResponse.error,
        })
        throw error
      }

      // 处理成功响应 - 返回 data（保留 meta）
      const successResponse = result as ApiResponse
      if (successResponse.meta) {
        // 如果有 meta，返回包含 data 和 meta 的对象
        response._data = {
          data: successResponse.data,
          meta: successResponse.meta,
        }
      } else {
        // 没有 meta，直接返回 data
        response._data = successResponse.data
      }
    },

    // 错误拦截器 - 处理 HTTP 错误
    onResponseError({ response }) {
      const status = response.status
      const result = response._data as ApiErrorResponse

      // 尝试从响应中提取错误信息
      // 创建包含 API 错误详情的 Error
      const createApiError = (msg: string) => {
        const error = new Error(msg)
        Object.assign(error, { status })
        if (result?.error) {
          Object.assign(error, {
            code: result.error.code,
            name: result.error.name,
            details: result.error,
          })
        }
        return error
      }

      // Clear invalid sessions; route guards decide whether to show the login page.
      if (status === 401 || result?.error?.name === 'USER_INACTIVE') {
        stateToken.value = null
        stateUser.value = null
        authTokenCookie.value = null
        authUserCookie.value = null

        throw createApiError(translateError('errors.unauthorized'))
      }

      // 403 禁止访问
      if (status === 403) {
        throw createApiError(translateError('errors.forbidden'))
      }

      // 404 未找到
      if (status === 404) {
        throw createApiError(translateError('errors.not_found'))
      }

      // 500 服务器错误
      if (status >= 500) {
        throw createApiError(translateError('errors.server'))
      }

      // 其他错误
      throw createApiError(translateError('errors.network'))
    },
  })

  return {
    provide: {
      api,
    },
  }
})
