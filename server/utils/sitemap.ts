import type { H3Event } from 'h3'
import { siteUrl } from '../../shared/utils/siteUrl'
import { BARE_LOCALE, SITE_LOCALES, languageUrl, type SiteLocale } from '../../shared/utils/languageUrls'

// The sitemap lists only pages worth a search result (docs/seo in the API repo): the API's /v1/sitemap already
// leaves out tracks without lyrics, artists on a couple of albums, events with nothing on them and so on. Page
// addresses are built here and nowhere else; the API gives ids, update times and main images.

/** What GET /v1/sitemap/{type} lists; see docs/api/sitemap.md in the API repo. */
export interface SitemapItem {
  id: number
  slug?: string | null
  /** Profiles are addressed by name. */
  username?: string | null
  /** The main cover, avatar or key visual, for image search. */
  image?: string | null
  updated_at: string | null
}

export interface SitemapSummary {
  chunk: number
  types: Record<string, { total: number, last_modified: string | null }>
}

/** Each content type's page address. */
export const SITEMAP_PATHS: Record<string, (item: SitemapItem) => string> = {
  'albums': item => `/albums/${item.id}`,
  'artists': item => `/artists/${item.id}`,
  'tracks': item => `/tracks/${item.id}`,
  'entries': item => `/entries/${item.id}`,
  'franchises': item => `/franchises/${item.id}`,
  'events': item => `/events/${item.id}`,
  'event-series': item => `/event-series/${item.id}`,
  'articles': item => `/articles/${item.id}${item.slug ? `/${encodeURIComponent(item.slug)}` : ''}`,
  'topics': item => `/discussions/${item.id}`,
  'discussion-categories': item => `/discussions/c/${encodeURIComponent(item.slug ?? '')}`,
  'profiles': item => `/profile/${encodeURIComponent(item.username ?? '')}`,
}

/**
 * Types whose pages are written by a member in one language, whatever the interface is: one address each, so no
 * language files (the pages pass `languages: false` to usePageSeo).
 */
export const SITEMAP_SINGLE: ReadonlySet<string> = new Set(['articles', 'topics', 'discussion-categories', 'profiles'])

/** Pages that are always there and have a version in every language: the home page, the lists, the documents. */
export const SITEMAP_PAGES = [
  '/', '/albums', '/vinyls', '/artists', '/entries', '/franchises', '/events',
  '/contribute', '/about', '/terms', '/privacy', '/docs/api', '/docs/markdown',
]

/** Fixed pages with one address: lists of members' writing, and the guides written in Chinese only. */
export const SITEMAP_PAGES_SINGLE = ['/articles', '/discussions', '/docs/design', '/docs/editor', '/join']

/** The languages with sitemap files of their own; the unsuffixed files are the bare (Japanese) addresses. */
export const SITEMAP_LOCALES: readonly SiteLocale[] = SITE_LOCALES.filter(locale => locale !== BARE_LOCALE)

export interface SitemapEntry {
  loc: string
  lastmod?: string | null
  image?: string | null
}

/**
 * The files of one chunk (`pages`, `albums-1`): the bare one, then one per other language when the pages have
 * language versions. Bing and Naver find the versions through these rather than through hreflang.
 */
export const sitemapFiles = (name: string, localized: boolean) =>
  [`${name}.xml`, ...(localized ? SITEMAP_LOCALES.map(locale => `${name}.${locale}.xml`) : [])]

/** What a file name asks for: `pages.xml`, `albums-2.xml`, `albums-2.zh-Hans.xml`. Null for anything else. */
export function parseSitemapFile(file: string): { type: string, page: number, locale: SiteLocale } | null {
  const [, name, type, page, locale] = file.match(/^(pages|([a-z-]+)-(\d+))(?:\.([A-Za-z-]+))?\.xml$/) ?? []
  if (!name) return null
  if (locale !== undefined && !SITEMAP_LOCALES.includes(locale as SiteLocale)) return null
  const wanted = (locale ?? BARE_LOCALE) as SiteLocale
  if (name === 'pages') return { type: 'pages', page: 1, locale: wanted }
  if (!type || !SITEMAP_PATHS[type] || Number(page) < 1) return null
  if (SITEMAP_SINGLE.has(type) && wanted !== BARE_LOCALE) return null
  return { type, page: Number(page), locale: wanted }
}

/** The fixed pages in one language; the pages with a single address go in the bare file only. */
export const pageEntries = (baseUrl: string, locale: SiteLocale): SitemapEntry[] => [
  ...SITEMAP_PAGES.map(path => ({ loc: siteUrl(baseUrl, languageUrl(path, locale)) })),
  ...(locale === BARE_LOCALE ? SITEMAP_PAGES_SINGLE.map(path => ({ loc: siteUrl(baseUrl, path) })) : []),
]

/** One chunk of a type in one language. Images go with the bare addresses only: one picture, listed once. */
export function itemEntries(type: string, items: SitemapItem[], baseUrl: string, locale: SiteLocale): SitemapEntry[] {
  const path = SITEMAP_PATHS[type]
  if (!path) return []
  return items.map(item => ({
    loc: siteUrl(baseUrl, languageUrl(path(item), locale)),
    lastmod: item.updated_at,
    image: locale === BARE_LOCALE ? item.image : null,
  }))
}

/** Every address of the items, language versions included: what IndexNow is told about. */
export function itemUrls(type: string, items: SitemapItem[], baseUrl: string) {
  const path = SITEMAP_PATHS[type]
  if (!path) return []
  const locales = SITEMAP_SINGLE.has(type) ? [BARE_LOCALE] : SITE_LOCALES
  return items.flatMap(item => locales.map(locale => siteUrl(baseUrl, languageUrl(path(item), locale))))
}

/** A GET on the API's sitemap endpoints; a failure answers 503 so that nothing empty is cached. */
export async function sitemapApi<T>(event: H3Event | undefined, path: string, query?: Record<string, unknown>) {
  const { apiBaseUrl } = useRuntimeConfig(event).public
  try {
    const response = await $fetch<{ data: T }>(`/v1/sitemap${path}`, { baseURL: String(apiBaseUrl), query })
    return response.data
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Sitemap data unavailable' })
  }
}

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\'', '&apos;')

/** A sitemap document: `<urlset>` of pages, or `<sitemapindex>` of sitemap files. */
export function sitemapXml(kind: 'urlset' | 'sitemapindex', entries: SitemapEntry[]) {
  const tag = kind === 'urlset' ? 'url' : 'sitemap'
  const images = kind === 'urlset' && entries.some(entry => entry.image)
  const body = entries.map(({ loc, lastmod, image }) => [
    `<${tag}><loc>${escapeXml(loc)}</loc>`,
    lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '',
    images && image ? `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : '',
    `</${tag}>`,
  ].join('')).join('\n')
  const namespaces = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${images ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''}`
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${kind} ${namespaces}>\n${body}\n</${kind}>\n`
}

/** Sitemaps are rebuilt at most hourly; errors are never cached. */
export const SITEMAP_CACHE = { maxAge: 60 * 60, swr: true, getKey: (event: H3Event) => event.path }
