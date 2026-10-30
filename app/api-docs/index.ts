import { flattenTexts, textKeys } from './keys'
import { API_DOCS_STRUCTURE } from './structure'
import type { ApiDocsDoc, ApiDocsLocale, ApiDocsTexts } from './types'

export type { ApiDocsDoc, ApiDocsLocale } from './types'

type Loader = () => Promise<{ default: ApiDocsTexts }>

// Each language is its own chunk, so the page only fetches the words it shows.
const LOADERS: Partial<Record<ApiDocsLocale, Loader>> = {
  'zh-Hans': () => import('./locales/zh-Hans'),
  'en': () => import('./locales/en'),
  'zh-Hant': () => import('./locales/zh-Hant'),
  'ja': () => import('./locales/ja'),
  'ko': () => import('./locales/ko'),
}

/** The language the reference is written in first, which readers get until their own is written. */
export const SOURCE_LOCALE: ApiDocsLocale = 'zh-Hans'

/** When the reference last changed (YYYY-MM-DD); bump it with every edit that changes what it says. */
export const API_DOCS_UPDATED = '2026-10-30'

/** The reference's words in the reader's language, or in the language it was written in first. */
export async function loadApiDocs(locale: string): Promise<ApiDocsDoc> {
  const written = (locale in LOADERS ? locale : SOURCE_LOCALE) as ApiDocsLocale
  const texts = (await LOADERS[written]!()).default
  if (import.meta.dev) warnOnMissingTexts(written, texts)
  return { locale: written, updated: API_DOCS_UPDATED, texts }
}

/** While writing: every text the structure needs, and nothing it doesn't (tests/api-docs check the same). */
function warnOnMissingTexts(locale: ApiDocsLocale, texts: ApiDocsTexts) {
  const { required, optional } = textKeys(API_DOCS_STRUCTURE)
  const present = flattenTexts(texts)
  const missing = [...required].filter(key => !present.get(key))
  const stray = [...present.keys()].filter(key => !required.has(key) && !optional.has(key))
  if (missing.length) console.warn(`[api-docs] ${locale}: ${missing.length} texts missing`, missing)
  if (stray.length) console.warn(`[api-docs] ${locale}: texts the structure doesn't use`, stray)
}
