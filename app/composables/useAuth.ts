import type { LoginRequest, RegisterRequest, AuthResponse, User } from '~/types/auth'
import { localDrafts } from '~/utils/localDrafts'

/**
 * 认证状态管理 composable
 */
export const useAuth = () => {
  const { $api } = useNuxtApp()
  const router = useRouter()
  const { localizeError } = useLocalizedApiError()

  // 使用 cookie 存储 token 和用户信息
  const { token: tokenCookie, user: userCookie } = useAuthCookies()

  // 使用 useState 来保证状态在服务端和客户端之间共享
  const user = useState<User | null>('auth:user', () => userCookie.value ?? null)
  const token = useState<string | null>('auth:token', () => tokenCookie.value ?? null)

  // 计算属性：是否已登录
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // 从 cookie 初始化认证状态
  const initAuth = () => {
    if (tokenCookie.value && userCookie.value) {
      token.value = tokenCookie.value
      user.value = userCookie.value
    }
  }

  // 保存 token
  const saveToken = (tokenStr: string) => {
    token.value = tokenStr
    tokenCookie.value = tokenStr
  }

  // 保存认证数据（token + user）
  const saveAuth = (authData: AuthResponse) => {
    saveToken(authData.token)
    user.value = authData.user
    userCookie.value = authData.user
  }

  // 清除认证数据
  const clearAuth = () => {
    token.value = null
    user.value = null
    tokenCookie.value = null
    userCookie.value = null
  }

  // 登录
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await $api<{ token: string }>('/v1/auth/login', {
        method: 'POST',
        body: credentials
      })

      // 先保存 token
      saveToken(response.token)
      user.value = null
      userCookie.value = null
      // 再用 token 拉取完整用户数据
      return await fetchUser()
    } catch (error) {
      return {
        success: false,
        error: localizeError(error, 'auth.login.login_failed')
      }
    }
  }

  // 注册
  const register = async (userData: RegisterRequest) => {
    try {
      const response = await $api<AuthResponse>('/v1/auth/register', {
        method: 'POST',
        body: userData
      })

      saveAuth(response)
      return { success: true, data: response }
    } catch (error) {
      return {
        success: false,
        error: localizeError(error, 'auth.register.register_failed'),
        details: (error as { details?: { details?: Record<string, unknown> } })?.details?.details
      }
    }
  }

  // 登出
  const logout = async () => {
    // Revision drafts are kept in this browser until submitted; logging out deletes them all.
    if (import.meta.client) await localDrafts.clear().catch(() => undefined)
    try {
      await $api('/v1/auth/logout', { method: 'POST', retry: 0 })

      clearAuth()
      await router.push('/')
      return { success: true }
    } catch (error) {
      clearAuth()
      return {
        success: false,
        error: localizeError(error)
      }
    }
  }

  // 获取当前用户信息
  const fetchUser = async () => {
    if (!token.value) {
      return { success: false, error: localizeError({ status: 401 }) }
    }

    try {
      const response = await $api<User>('/v1/me')
      user.value = response
      userCookie.value = response
      // Re-setting the same token extends the cookie, keeping active sessions signed in.
      tokenCookie.value = token.value

      return { success: true, data: response }
    } catch (error) {
      // A temporary network/server failure must not discard a valid session.
      const failure = error as { status?: number, name?: string }
      if (failure?.status === 401 || failure?.name === 'USER_INACTIVE') clearAuth()
      return {
        success: false,
        error: localizeError(error)
      }
    }
  }

  const hasPermission = (permission: string) =>
    user.value?.permissions?.includes(permission) ?? false

  const hasRole = (role: string) =>
    user.value?.roles === role

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    hasPermission,
    hasRole,
    initAuth,
    login,
    register,
    logout,
    fetchUser
  }
}
