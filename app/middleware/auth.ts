/**
 * 认证中间件
 * 保护需要登录才能访问的页面
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()

  // 如果用户未登录，重定向到登录页面
  if (!isAuthenticated.value) {
    // 保存原始目标路径，登录后可以跳转回来
    const redirectPath = to.fullPath
    return navigateTo({
      path: '/auth/login',
      query: { redirect: redirectPath }
    })
  }
})
