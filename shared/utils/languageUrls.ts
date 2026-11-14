// The language versions of a page, as search engines index them (docs/seo in the API repo). People use the bare
// address, which follows their browser and cookie; `?lang=` names one language outright, so each version has an
// address a crawler can fetch. Used by the page head (app) and by the sitemap and IndexNow (server).

/** The interface languages, as i18n locale codes. */
export type SiteLocale = 'zh-Hans' | 'zh-Hant' | 'en' | 'ja' | 'ko'

/** Every interface language, in the order hreflang lists them. */
export const SITE_LOCALES: readonly SiteLocale[] = ['ja', 'en', 'zh-Hans', 'zh-Hant', 'ko']

/** The language of an address without `?lang=`: what a visitor that states no language (a crawler) is shown. */
export const BARE_LOCALE: SiteLocale = 'ja'

/** The version for readers whose language is none of ours (hreflang `x-default`). */
export const FALLBACK_LOCALE: SiteLocale = 'en'

/** The query parameter that names a language version; `l` (Steam's) is read too, but never written. */
export const LANGUAGE_PARAM = 'lang'

/** `path`, with or without a query, as the address of one language version. */
export function languageUrl(path: string, locale: SiteLocale) {
  if (locale === BARE_LOCALE) return path
  return `${path}${path.includes('?') ? '&' : '?'}${LANGUAGE_PARAM}=${locale}`
}

/**
 * A page's hreflang set: one entry per language version, then `x-default`. Every version of the page lists the
 * same set, itself included, which is what search engines ask for.
 */
export function languageAlternates(path: string, locales: readonly SiteLocale[] = SITE_LOCALES) {
  const entries: Array<{ hreflang: string, path: string }> = locales.map(locale => ({ hreflang: locale, path: languageUrl(path, locale) }))
  const fallback = locales.includes(FALLBACK_LOCALE) ? FALLBACK_LOCALE : locales.includes(BARE_LOCALE) ? BARE_LOCALE : null
  if (fallback) entries.push({ hreflang: 'x-default', path: languageUrl(path, fallback) })
  return entries
}
