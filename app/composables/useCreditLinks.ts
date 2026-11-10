import type { NuxtApp } from '#app'
import type { Ref } from 'vue'

/**
 * How a credited name shows the part that links to the artist (main.css, `.credit-link` / `.credit-plain`):
 * - `accent`: the linked part in a heavier weight and the theme colour (a blue with the ink palette), the rest as it is
 * - `fade`: the linked part in a heavier weight, the rest of the name faded (the default)
 * - `dotted`: a dotted line under the linked part, solid on hover
 */
export type CreditLinkStyle = 'accent' | 'fade' | 'dotted'

export const CREDIT_LINK_STYLES: readonly CreditLinkStyle[] = ['accent', 'fade', 'dotted']
export const DEFAULT_CREDIT_LINK_STYLE: CreditLinkStyle = 'fade'

const cache = new WeakMap<NuxtApp, Ref<string | null | undefined>>()

/** One cookie ref per app (per request on the server), so the head and the settings dialog share it. */
const creditLinksCookie = () => {
  const nuxtApp = useNuxtApp()
  let cookie = cache.get(nuxtApp)
  if (!cookie) {
    cookie = nuxtApp._scope.run(() => useCookie<string | null>('credit_links', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' }))!
    cache.set(nuxtApp, cookie)
  }
  return cookie
}

/**
 * The reader's choice, in a cookie so the server renders it; useAppHead puts it on <html> as data-credit-links. The
 * setter also writes <html> straight away, as head updates wait while a page is loading.
 */
export const useCreditLinks = () => {
  const cookie = creditLinksCookie()
  const style = computed<CreditLinkStyle>(() => CREDIT_LINK_STYLES.includes(cookie.value as CreditLinkStyle) ? cookie.value as CreditLinkStyle : DEFAULT_CREDIT_LINK_STYLE)
  const setStyle = (value: CreditLinkStyle) => {
    cookie.value = value
    if (import.meta.client) document.documentElement.dataset.creditLinks = value
  }
  return { style, setStyle }
}
