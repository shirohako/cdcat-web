import type { H3Event } from 'h3'

/** What GET /v1/sitemap/{type} lists; see docs/api/sitemap.md in the API repo. */
export interface SitemapItem {
  id: number
  slug?: string | null
  updated_at: string | null
}

export interface SitemapSummary {
  chunk: number
  types: Record<string, { total: number, last_modified: string | null }>
}

/** Each content type's page address. */
export const SITEMAP_PATHS: Record<string, (item: SitemapItem) => string> = {
  'albums': item => `/albums/${item.id}`,
  'tracks': item => `/tracks/${item.id}`,
  'artists': item => `/artists/${item.id}`,
  'labels': item => `/labels/${item.id}`,
  'entries': item => `/entries/${item.id}`,
  'franchises': item => `/franchises/${item.id}`,
  'events': item => `/events/${item.id}`,
  'event-series': item => `/event-series/${item.id}`,
  'articles': item => `/articles/${item.id}${item.slug ? `/${encodeURIComponent(item.slug)}` : ''}`,
  'topics': item => `/discussions/${item.id}`,
  'discussion-categories': item => `/discussions/c/${encodeURIComponent(item.slug ?? '')}`,
}

/** Pages that are always there: the home page and each section's list. */
export const SITEMAP_PAGES = [
  '/', '/albums', '/vinyls', '/artists', '/labels', '/entries', '/franchises', '/events',
  '/articles', '/discussions', '/contribute', '/about', '/terms', '/privacy', '/help/markdown',
]

/** A GET on the API's sitemap endpoints; a failure answers 503 so that nothing empty is cached. */
export async function sitemapApi<T>(event: H3Event, path: string, query?: Record<string, unknown>) {
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
export function sitemapXml(kind: 'urlset' | 'sitemapindex', entries: Array<{ loc: string, lastmod?: string | null }>) {
  const tag = kind === 'urlset' ? 'url' : 'sitemap'
  const body = entries.map(({ loc, lastmod }) =>
    `<${tag}><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</${tag}>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${kind} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</${kind}>\n`
}

/** Sitemaps are rebuilt at most hourly; errors are never cached. */
export const SITEMAP_CACHE = { maxAge: 60 * 60, swr: true, getKey: (event: H3Event) => event.path }
