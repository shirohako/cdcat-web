import { findAdminMenuItem } from '~/config/admin'

export default defineNuxtRouteMiddleware(async (to) => {
  const { token, fetchUser, hasPermission } = useAuth()
  const login = () => navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } })
  if (!token.value) return login()

  const result = await fetchUser()
  if (!result.success) {
    if (!token.value) return login()
    throw createError({ statusCode: 503, statusMessage: 'Unable to verify admin access' })
  }
  if (!hasPermission('admin.access')) return navigateTo('/', { replace: true })

  const requiredPermission = findAdminMenuItem(to.path)?.permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return navigateTo('/admin', { replace: true })
  }
})
