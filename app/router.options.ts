import type { RouterConfig } from 'nuxt/schema'
import { START_LOCATION, type RouteLocationNormalized } from 'vue-router'

/** The longest a page switch waits for its scroll target before scrolling anyway. */
const TARGET_TIMEOUT = 2500
/** Keys that scroll the page: pressing one while we wait means the reader has taken over. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

/**
 * Nuxt's default scroll behaviour (nuxt/dist/pages/runtime/router.options.js, which the package doesn't
 * export), plus one step: pages now render before their data (composables/usePageData.ts), so a #hash
 * target or the height a saved position needs may not be there yet. Wait for it first. And because the page
 * scrolls smoothly (html { scroll-behavior } in main.css), a new page's scroll is asked to be instant; only
 * jumps within the same page glide.
 */
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()
    const router = useRouter()
    const hashBehavior = (router.options as unknown as RouterConfig).scrollBehaviorType ?? 'auto'

    if (to.path.replace(/\/$/, '') === from.path.replace(/\/$/, '')) {
      if (from.hash && !to.hash) return savedPosition ?? { left: 0, top: 0 }
      if (to.hash) return { el: to.hash, top: hashScrollMargin(to.hash), behavior: hashBehavior }
      return false
    }

    const scrollToTop = typeof to.meta.scrollToTop === 'function' ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop
    if (scrollToTop === false) return false
    if (from === START_LOCATION) return position(to, savedPosition, 'instant')

    return new Promise((resolve) => {
      const isCurrent = () => router.currentRoute.value.fullPath === to.fullPath
      // A saved position needs the page's real content, which replaces the skeleton marked with data-skeleton.
      const ready = savedPosition
        ? () => !document.querySelector('[data-skeleton]')
        : to.hash ? () => !!document.getElementById(to.hash.slice(1)) : undefined
      const scroll = async () => {
        if (ready && !(await waitFor(ready, isCurrent))) return resolve(false)
        requestAnimationFrame(() => resolve(isCurrent() ? position(to, savedPosition, 'instant') : false))
      }
      nuxtApp.hooks.hookOnce('page:loading:end', () => {
        // Wait for the old page to finish leaving, as Nuxt's default does (an internal API).
        const transition = (nuxtApp as unknown as { '~transitionPromise'?: Promise<void> })['~transitionPromise']
        if (transition) transition.then(scroll)
        else scroll()
      })
    })
  },
}

/**
 * Checks `ready` every frame for up to TARGET_TIMEOUT. Resolves true once it holds (or time is up),
 * false if the route changed or the reader started scrolling first.
 */
function waitFor(ready: () => boolean, isCurrent: () => boolean) {
  if (ready()) return Promise.resolve(true)
  return new Promise<boolean>((resolve) => {
    const started = performance.now()
    let frame = 0
    const finish = (value: boolean) => {
      cancelAnimationFrame(frame)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', onKey)
      resolve(value)
    }
    const cancel = () => finish(false)
    const onKey = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) cancel()
    }
    const check = () => {
      if (!isCurrent()) return finish(false)
      if (ready() || performance.now() - started > TARGET_TIMEOUT) return finish(true)
      frame = requestAnimationFrame(check)
    }
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    window.addEventListener('keydown', onKey)
    frame = requestAnimationFrame(check)
  })
}

function hashScrollMargin(hash: string) {
  const element = document.getElementById(hash.slice(1))
  if (!element) return 0
  return (Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0)
    + (Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)
}

function position(to: RouteLocationNormalized, savedPosition: { left: number, top: number } | null, behavior: ScrollBehavior) {
  if (savedPosition) return { ...savedPosition, behavior }
  if (to.hash) return { el: to.hash, top: hashScrollMargin(to.hash), behavior }
  return { left: 0, top: 0, behavior }
}
