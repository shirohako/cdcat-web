import type { NuxtApp } from '#app'
import type { Ref } from 'vue'

export type Theme = 'dark' | 'light'

/**
 * A theme colour: an OKLCH hue that every surface is tinted by (vivia's presets), or `ink`, a near-black theme colour
 * on faintly violet greys (theme.css, [data-palette="ink"]).
 */
export type ThemeColor = number | 'ink'

/** Dark since 2026-11-11 (user ask; light from 2026-10-25). A visitor's saved choice wins. */
export const DEFAULT_THEME: Theme = 'dark'
export const DEFAULT_COLOR: ThemeColor = 'ink'
/** The hue the ink palette's greys lean to. */
export const INK_HUE = 290
/** The admin console isn't themed yet: always light, in vivia's blue. */
export const ADMIN_HUE = 250
/** The panel's choices: ink, then vivia's preset hues. */
export const COLOR_PRESETS: readonly ThemeColor[] = ['ink', 0, 30, 60, 180, 250, 270, 300, 330, 345]

/**
 * The visitor's text size: the root font size as a percentage of the browser's own (16px unless they changed it). Every
 * rem follows it, so text, spacing and icons grow together, as with the browser's zoom (main.css, data-text-size).
 * Until they pick one it is 'auto': standard, but small on phones (below sm, where the layout turns to the phone one).
 * That is decided in CSS, so the server, which can't know the width, still draws the right size.
 */
export type TextSize = 100 | 110 | 120
export const TEXT_SIZES: readonly TextSize[] = [100, 110, 120]
export const DEFAULT_TEXT_SIZE: TextSize = 110
export const PHONE_TEXT_SIZE: TextSize = 100
/** Where the phone default applies; main.css repeats it for data-text-size="auto". */
export const PHONE_TEXT_QUERY = '(width < 40rem)'

const APPEARANCE_COOKIE = { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' } as const

interface AppearanceCookies {
  theme: Ref<string | null | undefined>
  /** The theme colour: a hue, or 'ink'. */
  hue: Ref<number | string | null | undefined>
  textSize: Ref<number | string | null | undefined>
}

const cache = new WeakMap<NuxtApp, AppearanceCookies>()

/** The cookies, one set per app (per request on the server), like useAuthCookies. */
const appearanceCookies = (): AppearanceCookies => {
  const nuxtApp = useNuxtApp()
  let cookies = cache.get(nuxtApp)
  if (!cookies) {
    cookies = nuxtApp._scope.run(() => ({
      theme: useCookie<string | null>('appearance_theme', APPEARANCE_COOKIE),
      hue: useCookie<number | string | null>('appearance_hue', APPEARANCE_COOKIE),
      textSize: useCookie<number | string | null>('appearance_text_size', APPEARANCE_COOKIE),
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

/** One of TEXT_SIZES, or null for anything else. */
export const toTextSize = (value: unknown): TextSize | null => {
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return TEXT_SIZES.find(size => size === number) ?? null
}

/**
 * The visitor's theme (dark or light), theme colour (a hue or ink) and text size, kept in cookies so the server renders
 * the right colours and sizes; the colour keeps the old cookie name, appearance_hue. app.vue puts what applies on <html>
 * (data-theme, --hue, data-palette, data-text-size): the admin console isn't themed yet, so it always gets the light
 * theme in ADMIN_HUE and the browser's own text size. The setters also write <html> straight away, because head
 * updates wait while a page is loading.
 */
export const useAppearance = () => {
  const cookies = appearanceCookies()
  const route = useRoute()

  const theme = computed<Theme>(() => cookies.theme.value === 'dark' || cookies.theme.value === 'light' ? cookies.theme.value : DEFAULT_THEME)
  const color = computed<ThemeColor>(() => toColor(cookies.hue.value) ?? DEFAULT_COLOR)
  const chosenTextSize = computed(() => toTextSize(cookies.textSize.value))
  /**
   * The size in use, for the panel: the visitor's pick, else the default for this width. The width is read in the
   * browser only (the panel renders only there, when opened); the server takes the standard size.
   */
  const textSize = computed<TextSize>(() => chosenTextSize.value
    ?? (import.meta.client && window.matchMedia(PHONE_TEXT_QUERY).matches ? PHONE_TEXT_SIZE : DEFAULT_TEXT_SIZE))

  const themed = computed(() => route.path !== '/admin' && !route.path.startsWith('/admin/'))
  const appliedTheme = computed<Theme>(() => themed.value ? theme.value : 'light')
  const appliedHue = computed(() => !themed.value ? ADMIN_HUE : color.value === 'ink' ? INK_HUE : color.value)
  const appliedPalette = computed(() => themed.value && color.value === 'ink' ? 'ink' : undefined)
  const appliedTextSize = computed<TextSize | 'auto' | undefined>(() => themed.value ? chosenTextSize.value ?? 'auto' : undefined)

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

  const setTextSize = (value: TextSize) => {
    const next = toTextSize(value) ?? DEFAULT_TEXT_SIZE
    cookies.textSize.value = next
    if (import.meta.client) document.documentElement.dataset.textSize = String(next)
  }

  return { theme, color, textSize, appliedTheme, appliedHue, appliedPalette, appliedTextSize, setTheme, setColor, setTextSize }
}
