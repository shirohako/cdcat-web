import type { NuxtApp } from '#app'
import type { Ref } from 'vue'

export type Theme = 'dark' | 'light'

export const DEFAULT_THEME: Theme = 'dark'
export const DEFAULT_HUE = 250
/** vivia's preset theme colours, as OKLCH hues. */
export const HUE_PRESETS = [0, 30, 60, 180, 250, 270, 300, 330, 345] as const

const APPEARANCE_COOKIE = { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' } as const

interface AppearanceCookies {
  theme: Ref<string | null | undefined>
  hue: Ref<number | string | null | undefined>
}

const cache = new WeakMap<NuxtApp, AppearanceCookies>()

/** The two cookies, one pair per app (per request on the server), like useAuthCookies. */
const appearanceCookies = (): AppearanceCookies => {
  const nuxtApp = useNuxtApp()
  let cookies = cache.get(nuxtApp)
  if (!cookies) {
    cookies = nuxtApp._scope.run(() => ({
      theme: useCookie<string | null>('appearance_theme', APPEARANCE_COOKIE),
      hue: useCookie<number | string | null>('appearance_hue', APPEARANCE_COOKIE),
    }))!
    cache.set(nuxtApp, cookies)
  }
  return cookies
}

/** A whole number of degrees from 0 to 360, or null. Cookie values end up in an attribute, so nothing else passes. */
export const toHue = (value: unknown): number | null => {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN
  return Number.isFinite(number) ? Math.min(360, Math.max(0, Math.round(number))) : null
}

/**
 * The visitor's theme (dark or light) and theme colour (a hue), kept in cookies so the server renders the right
 * colours. app.vue puts the applied pair on <html>: the admin console isn't themed yet, so it always gets the light
 * theme in the default colour. The setters also write <html> straight away, because head updates wait while a page
 * is loading and the hue slider has to follow the pointer.
 */
export const useAppearance = () => {
  const cookies = appearanceCookies()
  const route = useRoute()
  // The hue being dragged on the slider, saved to the cookie once the slider is let go.
  const draftHue = useState<number | null>('appearance-draft-hue', () => null)

  const theme = computed<Theme>(() => cookies.theme.value === 'light' ? 'light' : DEFAULT_THEME)
  const savedHue = computed(() => toHue(cookies.hue.value) ?? DEFAULT_HUE)
  const hue = computed(() => draftHue.value ?? savedHue.value)

  const themed = computed(() => route.path !== '/admin' && !route.path.startsWith('/admin/'))
  const appliedTheme = computed<Theme>(() => themed.value ? theme.value : 'light')
  const appliedHue = computed(() => themed.value ? hue.value : DEFAULT_HUE)

  const paintTheme = (value: Theme) => {
    if (import.meta.client) document.documentElement.dataset.theme = value
  }
  const paintHue = (value: number) => {
    if (import.meta.client) document.documentElement.style.setProperty('--hue', String(value))
  }

  const setTheme = (value: Theme) => {
    cookies.theme.value = value
    paintTheme(value)
  }

  /** Shows a hue without saving it, while the slider moves. */
  const previewHue = (value: number) => {
    const next = toHue(value)
    if (next === null) return
    draftHue.value = next
    paintHue(next)
  }

  const setHue = (value: number) => {
    const next = toHue(value) ?? DEFAULT_HUE
    draftHue.value = null
    cookies.hue.value = next
    paintHue(next)
  }

  const resetHue = () => setHue(DEFAULT_HUE)

  return { theme, hue, appliedTheme, appliedHue, setTheme, previewHue, setHue, resetHue }
}
