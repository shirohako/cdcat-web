import type { LoginRequest, RegisterRequest, AuthResponse, User } from '~/types/auth'

/**
 * 认证状态管理 composable
 */
export const useAuth = () => {
  const { $api } = useNuxtApp()
  const router = useRouter()

  // 使用 useState 来保证状态在服务端和客户端之间共享
  const user = useState<User | null>('auth:user', () => null)
  const token = useState<string | null>('auth:token', () => null)

  // 计算属性：是否已登录
  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // 从 localStorage 初始化认证状态
  const initAuth = () => {
    if (import.meta.client) {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('auth_user')

      if (savedToken && savedUser) {
        token.value = savedToken
        try {
          user.value = JSON.parse(savedUser)
        } catch (e) {
          // 如果解析失败，清除无效数据
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        }
      }
    }
  }

  // 保存认证数据
  const saveAuth = (authData: AuthResponse) => {
    token.value = authData.token
    user.value = authData.user

    if (import.meta.client) {
      localStorage.setItem('auth_token', authData.token)
      localStorage.setItem('auth_user', JSON.stringify(authData.user))
    }
  }

  // 清除认证数据
  const clearAuth = () => {
    token.value = null
    user.value = null

    if (import.meta.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
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
      return {
        success: false,
        error: error.message || '注册失败，请重试'
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

      if (import.meta.client) {
        localStorage.setItem('auth_user', JSON.stringify(response))
      }

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
