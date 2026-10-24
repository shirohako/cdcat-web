/** One sitemap file: `pages.xml` for the fixed pages, or `{type}-{page}.xml` for a chunk of one content type. */
export default defineCachedEventHandler(async (event) => {
  const baseUrl = String(useRuntimeConfig(event).public.baseUrl ?? '')
  const file = getRouterParam(event, 'file') ?? ''

  let entries: Array<{ loc: string, lastmod?: string | null }>
  if (file === 'pages.xml') {
    entries = SITEMAP_PAGES.map(path => ({ loc: siteUrl(baseUrl, path) }))
  } else {
    const [, type, page] = file.match(/^([a-z-]+)-(\d+)\.xml$/) ?? []
    const path = type ? SITEMAP_PATHS[type] : undefined
    if (!path || !page || Number(page) < 1) throw createError({ statusCode: 404 })
    const { items } = await sitemapApi<{ items: SitemapItem[] }>(event, `/${type}`, { page })
    if (!items.length) throw createError({ statusCode: 404 })
    entries = items.map(item => ({ loc: siteUrl(baseUrl, path(item)), lastmod: item.updated_at }))
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return sitemapXml('urlset', entries)
}, { ...SITEMAP_CACHE, name: 'sitemap-file' })
