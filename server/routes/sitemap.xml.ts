/** The sitemap index: the fixed pages, then one file per chunk of each content type. */
export default defineCachedEventHandler(async (event) => {
  const baseUrl = String(useRuntimeConfig(event).public.baseUrl ?? '')
  const summary = await sitemapApi<SitemapSummary>(event, '')

  const files = [{ loc: siteUrl(baseUrl, '/sitemaps/pages.xml'), lastmod: null as string | null }]
  for (const [type, { total, last_modified }] of Object.entries(summary.types)) {
    if (!SITEMAP_PATHS[type]) continue
    for (let page = 1; page <= Math.ceil(total / summary.chunk); page++) {
      files.push({ loc: siteUrl(baseUrl, `/sitemaps/${type}-${page}.xml`), lastmod: last_modified })
    }
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return sitemapXml('sitemapindex', files)
}, { ...SITEMAP_CACHE, name: 'sitemap-index' })
