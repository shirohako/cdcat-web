import type { UseFetchOptions } from 'nuxt/app'

/**
 * Custom API composable
 * Wraps useFetch with custom $api instance
 *
 * Note: This composable uses $api provided by plugins/api.ts
 * $api is configured with:
 * - Automatic Authorization header injection
 * - Unified error handling (e.g., auto-redirect to login on 401)
 * - Standardized response format processing
 *
 * @example
 * // GET request
 * const { data, pending, error, refresh } = await useAPI<User[]>('/users')
 *
 * @example
 * // POST request
 * const { data, execute } = useAPI('/users', {
 *   method: 'POST',
 *   body: { name: 'John' },
 *   immediate: false
 * })
 * await execute()
 *
 * @example
 * // Reactive URL
 * const userId = ref(1)
 * const { data } = await useAPI(() => `/users/${userId.value}`, {
 *   watch: [userId]
 * })
 */
export function useAPI<T>(
  url: string | (() => string),
  options?: UseFetchOptions<T>,
) {
  // Use $api instance provided by plugins/api.ts
  const { $api } = useNuxtApp()

  return useFetch(url, {
    ...options,
    $fetch: $api,
  })
}
