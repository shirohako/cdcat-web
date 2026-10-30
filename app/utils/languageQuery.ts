import type { LocationQuery } from 'vue-router'

/** The interface languages, as i18n locale codes. */
export type SiteLocale = 'zh-Hans' | 'zh-Hant' | 'en' | 'ja' | 'ko'

/** Query parameters that pick the interface language: `lang`, then Steam's `l`. */
export const LANGUAGE_QUERY = ['lang', 'l'] as const

/** Steam's language names (store.steampowered.com/?l=schinese) for the languages we offer. */
const STEAM_NAMES: Record<string, SiteLocale> = { schinese: 'zh-Hans', tchinese: 'zh-Hant', english: 'en', japanese: 'ja', koreana: 'ko' }

/** Script and region subtags that mean Traditional Chinese. */
const TRADITIONAL = ['hant', 'tw', 'hk', 'mo']

/**
 * The interface language a `?l=` or `?lang=` value names: a Steam name or a language tag in any case,
 * with `-` or `_` (schinese, zh-hans, zh-CN, zh_TW, ja-JP, ko-KR, en-GB …). Null for a language we don't offer.
 */
export function languageFromQuery(value: string): SiteLocale | null {
  const tag = value.trim().toLowerCase().replaceAll('_', '-')
  if (STEAM_NAMES[tag]) return STEAM_NAMES[tag]
  const [language, ...subtags] = tag.split('-')
  if (language === 'en') return 'en'
  if (language === 'ja') return 'ja'
  if (language === 'ko') return 'ko'
  if (language === 'zh') return subtags.some(subtag => TRADITIONAL.includes(subtag)) ? 'zh-Hant' : 'zh-Hans'
  return null
}

/** The language the address asks for, or null; a value we don't offer is skipped. */
export function queryLanguage(query: LocationQuery): SiteLocale | null {
  for (const name of LANGUAGE_QUERY) {
    const raw = query[name]
    const value = Array.isArray(raw) ? raw[0] : raw
    const language = typeof value === 'string' ? languageFromQuery(value) : null
    if (language) return language
  }
  return null
}

/** The query without the language parameters. */
export function withoutLanguageQuery(query: LocationQuery): LocationQuery {
  return Object.fromEntries(Object.entries(query).filter(([name]) => !(LANGUAGE_QUERY as readonly string[]).includes(name)))
}
