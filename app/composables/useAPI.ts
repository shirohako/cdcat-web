import type { UseFetchOptions } from 'nuxt/app'

/**
 * 自定义 API composable
 * 包装 useFetch，使用自定义的 $api 实例
 *
 * @example
 * // GET 请求
 * const { data, pending, error, refresh } = await useAPI<User[]>('/users')
 *
 * @example
 * // POST 请求
 * const { data, execute } = useAPI('/users', {
 *   method: 'POST',
 *   body: { name: 'John' },
 *   immediate: false
 * })
 * await execute()
 *
 * @example
 * // 响应式 URL
 * const userId = ref(1)
 * const { data } = await useAPI(() => `/users/${userId.value}`, {
 *   watch: [userId]
 * })
 */
export function useAPI<T>(
  url: string | (() => string),
  options?: UseFetchOptions<T>,
) {
  const { $api } = useNuxtApp()

  return useFetch(url, {
    ...options,
    $fetch: $api,
  })
}
