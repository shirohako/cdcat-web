import type { ApiResponse, ApiErrorResponse } from '~/types/api'

/**
 * 自定义 API 插件
 *
 * API 响应格式：
 * 成功: { success: true, data: ..., meta?: {...} }
 * 失败: { success: false, error: { code, name, message } }
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl as string,

    // 请求拦截器
    onRequest({ options }) {
      // 自动添加认证 token
      // 优先使用 auth_token cookie，其次使用环境变量
      const authToken = useCookie('auth_token').value
      const envToken = config.public.authToken
      const token = authToken || envToken

      if (token) {
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${token}`)
        options.headers = headers
      }
    },

    // 响应拦截器 - 处理成功响应
    onResponse({ response }) {
      const result = response._data as ApiResponse | ApiErrorResponse

      // 检查是否为标准响应格式
      if (!result || typeof result !== 'object' || !('success' in result)) {
        return // 非标准格式，直接返回
      }

      // 处理失败响应
      if (!result.success) {
        const errorResponse = result as ApiErrorResponse
        const error = new Error(errorResponse.error.message || '请求失败')
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
    async onResponseError({ response }) {
      const status = response.status
      const result = response._data as ApiErrorResponse

      // 尝试从响应中提取错误信息
      let errorMessage = '网络请求失败'
      if (result?.error?.message) {
        errorMessage = result.error.message
      }

      // 401 未授权 - 清除 token 并跳转登录
      if (status === 401) {
        const authToken = useCookie('auth_token')
        const authUser = useCookie('auth_user')
        authToken.value = null
        authUser.value = null

        await navigateTo('/auth/login')
        throw new Error(errorMessage || '未授权，请重新登录')
      }

      // 403 禁止访问
      if (status === 403) {
        throw new Error(errorMessage || '没有访问权限')
      }

      // 404 未找到
      if (status === 404) {
        throw new Error(errorMessage || '请求的资源不存在')
      }

      // 500 服务器错误
      if (status >= 500) {
        throw new Error(errorMessage || '服务器错误，请稍后重试')
      }

      // 其他错误
      throw new Error(errorMessage)
    },
  })

  return {
    provide: {
      api,
    },
  }
})
