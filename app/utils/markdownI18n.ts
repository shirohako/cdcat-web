import { computed, unref } from 'vue'
import { tryUseNuxtApp } from '#app'

/**
 * Translation for the Markdown editor, renderer and guide. The messages live in
 * `i18n/locales/markdown/*.json` under the `markdown.*` namespace.
 *
 * The renderer rules call `mdT` with no component instance to hang a composable
 * off, so `$i18n` is resolved per call. Hoisting it into a module-level variable
 * would leak one SSR request's locale into the next. Outside a Nuxt app (unit
 * tests) the key itself is returned.
 */

interface NuxtI18n {
  t?: (key: string, named?: Record<string, unknown>) => unknown
  locale?: unknown
}

function nuxtI18n(): NuxtI18n | undefined {
  try {
    return (tryUseNuxtApp() as { $i18n?: NuxtI18n } | undefined | null)?.$i18n
  }
  catch {
    return undefined
  }
}

/** `t` for the plain helpers in `utils/`. Returns the key when nothing can translate it. */
export function mdT(key: string, named?: Record<string, unknown>): string {
  const i18n = nuxtI18n()
  return typeof i18n?.t === 'function' ? String(i18n.t(key, named ?? {})) : key
}

/**
 * `t` for components. Reading `locale.value` inside `t` is what makes a render
 * effect re-run when the site switches language.
 */
export function useMarkdownT() {
  const locale = computed(() => String(unref(nuxtI18n()?.locale) ?? ''))
  const t = (key: string, named?: Record<string, unknown>) => {
    void locale.value
    return mdT(key, named)
  }
  return { t, locale }
}
