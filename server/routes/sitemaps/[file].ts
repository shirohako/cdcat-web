/**
 * One sitemap file: `pages.xml` for the fixed pages or `{type}-{page}.xml` for a chunk of one content type, and
 * `….{lang}.xml` for the same pages in another language (`?lang=` addresses).
 */
export default defineCachedEventHandler(async (event) => {
  const baseUrl = String(useRuntimeConfig(event).public.baseUrl ?? '')
  const wanted = parseSitemapFile(getRouterParam(event, 'file') ?? '')
  if (!wanted) throw createError({ statusCode: 404 })

  let entries: SitemapEntry[]
  if (wanted.type === 'pages') {
    entries = pageEntries(baseUrl, wanted.locale)
  } else {
    const { items } = await sitemapApi<{ items: SitemapItem[] }>(event, `/${wanted.type}`, { page: wanted.page })
    if (!items.length) throw createError({ statusCode: 404 })
    entries = itemEntries(wanted.type, items, baseUrl, wanted.locale)
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return sitemapXml('urlset', entries)
}, { ...SITEMAP_CACHE, name: 'sitemap-file' })
