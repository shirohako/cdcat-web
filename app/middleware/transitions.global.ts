/**
 * Page and layout transitions (nuxt.config `app`) are for the public site. The admin console keeps switching
 * pages instantly, and so does everything when the system asks for reduced motion. Nuxt merges route meta
 * afresh for every navigation, so this never changes the route records.
 */
export default defineNuxtRouteMiddleware((to) => {
  const admin = to.path === '/admin' || to.path.startsWith('/admin/')
  const reducedMotion = import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!admin && !reducedMotion) return
  to.meta.pageTransition = false
  to.meta.layoutTransition = false
})
