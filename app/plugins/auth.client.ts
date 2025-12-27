/**
 * 认证初始化插件（仅在客户端运行）
 * 在应用启动时从 localStorage 恢复认证状态
 */
export default defineNuxtPlugin(() => {
  const { initAuth } = useAuth()

  // 初始化认证状态
  initAuth()
})
