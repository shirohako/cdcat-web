/**
 * 认证初始化插件
 * 在应用启动时自动获取最新的用户信息
 */
export default defineNuxtPlugin(async () => {
  const { fetchUser, token } = useAuth()

  // 如果有 token，自动获取最新用户信息
  if (token.value) {
    try {
      await fetchUser()
    } catch (error) {
      // fetchUser 内部已经处理了错误（清除认证状态），这里只需静默处理
      console.error('Failed to fetch user:', error)
    }
  }
})
