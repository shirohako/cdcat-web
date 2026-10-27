import type { NuxtApp } from '#app'
import type { Ref } from 'vue'

export type Theme = 'dark' | 'light'

/**
 * A theme colour: an OKLCH hue that every surface is tinted by (vivia's presets), or `ink`, a near-black theme colour
 * on faintly violet greys (theme.css, [data-palette="ink"]).
 */
export type ThemeColor = number | 'ink'

export const DEFAULT_THEME: Theme = 'light'
export const DEFAULT_COLOR: ThemeColor = 'ink'
/** The hue the ink palette's greys lean to. */
export const INK_HUE = 290
/** The admin console isn't themed yet: always light, in vivia's blue. */
export const ADMIN_HUE = 250
/** The panel's choices: ink, then vivia's preset hues. */
export const COLOR_PRESETS: readonly ThemeColor[] = ['ink', 0, 30, 60, 180, 250, 270, 300, 330, 345]

const APPEARANCE_COOKIE = { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' } as const

interface AppearanceCookies {
  theme: Ref<string | null | undefined>
  /** The theme colour: a hue, or 'ink'. */
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

/** `ink`, a hue, or null for anything else. */
export const toColor = (value: unknown): ThemeColor | null => value === 'ink' ? 'ink' : toHue(value)

/**
 * The visitor's theme (dark or light) and theme colour (a hue or ink), kept in cookies so the server renders the right
 * colours; the colour keeps the old cookie name, appearance_hue. app.vue puts what applies on <html> (data-theme,
 * --hue, data-palette): the admin console isn't themed yet, so it always gets the light theme in ADMIN_HUE. The setters
 * also write <html> straight away, because head updates wait while a page is loading.
 */
export const useAppearance = () => {
  const cookies = appearanceCookies()
  const route = useRoute()

  const theme = computed<Theme>(() => cookies.theme.value === 'dark' || cookies.theme.value === 'light' ? cookies.theme.value : DEFAULT_THEME)
  const color = computed<ThemeColor>(() => toColor(cookies.hue.value) ?? DEFAULT_COLOR)

  const themed = computed(() => route.path !== '/admin' && !route.path.startsWith('/admin/'))
  const appliedTheme = computed<Theme>(() => themed.value ? theme.value : 'light')
  const appliedHue = computed(() => !themed.value ? ADMIN_HUE : color.value === 'ink' ? INK_HUE : color.value)
  const appliedPalette = computed(() => themed.value && color.value === 'ink' ? 'ink' : undefined)

  const paintTheme = (value: Theme) => {
    if (import.meta.client) document.documentElement.dataset.theme = value
  }
  const paintColor = (value: ThemeColor) => {
    if (!import.meta.client) return
    const root = document.documentElement
    root.style.setProperty('--hue', String(value === 'ink' ? INK_HUE : value))
    if (value === 'ink') root.dataset.palette = 'ink'
    else delete root.dataset.palette
  }

  const setTheme = (value: Theme) => {
    cookies.theme.value = value
    paintTheme(value)
  }

  const setColor = (value: ThemeColor) => {
    const next = toColor(value) ?? DEFAULT_COLOR
    cookies.hue.value = next
    paintColor(next)
  }

  return { theme, color, appliedTheme, appliedHue, appliedPalette, setTheme, setColor }
}
