import type { LoginRequest, RegisterRequest, AuthResponse, User } from '~/types/auth'

/**
 * 认证状态管理 composable
 */
export const useAuth = () => {
  const { $api } = useNuxtApp()
  const router = useRouter()

  // 使用 cookie 存储 token 和用户信息
  const tokenCookie = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 天
    sameSite: 'lax'
  })
  const userCookie = useCookie<User | null>('auth_user', {
    maxAge: 60 * 60 * 24 * 7, // 7 天
    sameSite: 'lax'
  })

  // 使用 useState 来保证状态在服务端和客户端之间共享
  const user = useState<User | null>('auth:user', () => userCookie.value)
  const token = useState<string | null>('auth:token', () => tokenCookie.value)

  // 计算属性：是否已登录
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // 从 cookie 初始化认证状态
  const initAuth = () => {
    if (tokenCookie.value && userCookie.value) {
      token.value = tokenCookie.value
      user.value = userCookie.value
    }
  }

  // 保存认证数据
  const saveAuth = (authData: AuthResponse) => {
    token.value = authData.token
    user.value = authData.user
    tokenCookie.value = authData.token
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
      const response = await $api<AuthResponse>('/v1/auth/login', {
        method: 'POST',
        body: credentials
      })

      saveAuth(response)
      return { success: true, data: response }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登录失败，请重试'
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
    } catch (error: any) {
      const apiError = error.details
      return {
        success: false,
        error: apiError?.message || error.message || '注册失败，请重试',
        details: apiError?.details as Record<string, string[]> | undefined
      }
    }
  }

  // 登出
  const logout = async () => {
    try {
      // 可选：调用后端登出接口
      // await $api('/v1/auth/logout', { method: 'POST' })

      clearAuth()
      await router.push('/')
      return { success: true }
    } catch (error: any) {
      clearAuth()
      return {
        success: false,
        error: error.message || '登出失败'
      }
    }
  }

  // 获取当前用户信息
  const fetchUser = async () => {
    if (!token.value) {
      return { success: false, error: '未登录' }
    }

    try {
      const response = await $api<User>('/v1/auth/me')
      user.value = response
      userCookie.value = response

      return { success: true, data: response }
    } catch (error: any) {
      // 如果获取用户信息失败（可能 token 过期），清除认证状态
      clearAuth()
      return {
        success: false,
        error: error.message || '获取用户信息失败'
      }
    }
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    initAuth,
    login,
    register,
    logout,
    fetchUser
  }
}
