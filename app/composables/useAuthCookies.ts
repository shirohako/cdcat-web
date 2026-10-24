import type { NuxtApp } from '#app'
import type { Ref } from 'vue'
import type { User } from '~/types/user'

/**
 * Sessions last a year from the last visit: every page the server renders runs /v1/me and re-sets
 * the cookies (`refresh`), so only a year without visiting signs someone out. API tokens don't expire.
 *
 * Only the server refreshes. In the browser, Nuxt shares cookie changes between tabs; with `refresh`
 * every tab rewrote the cookie it was just told about (auth_user is an object, so each copy counts as
 * a change), and two open tabs bounced the write back and forth until the browser hung. Without it a
 * tab writes only a value that differs, so the echo stops after one round.
 */
const AUTH_COOKIE = { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', refresh: import.meta.server } as const

interface AuthCookies {
  token: Ref<string | null | undefined>
  user: Ref<User | null | undefined>
}

const cache = new WeakMap<NuxtApp, AuthCookies>()

/**
 * The auth cookies, one pair per app (per request on the server). Refs made per component
 * would each write their own stale copy back when the session is refreshed or cleared.
 */
export const useAuthCookies = (): AuthCookies => {
  const nuxtApp = useNuxtApp()
  let cookies = cache.get(nuxtApp)
  if (!cookies) {
    // Created in the app's scope so their watchers outlive the component that asked first.
    cookies = nuxtApp._scope.run(() => ({
      token: useCookie<string | null>('auth_token', AUTH_COOKIE),
      user: useCookie<User | null>('auth_user', AUTH_COOKIE),
    }))!
    cache.set(nuxtApp, cookies)
  }
  return cookies
}
