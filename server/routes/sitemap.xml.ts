/**
 * The sitemap index: the fixed pages, then the files of each chunk of each content type, in the order the API
 * lists the types (albums first). Types with language versions have a file per language.
 */
export default defineCachedEventHandler(async (event) => {
  const baseUrl = String(useRuntimeConfig(event).public.baseUrl ?? '')
  const summary = await sitemapApi<SitemapSummary>(event, '')

  const files: SitemapEntry[] = sitemapFiles('pages', true).map(file => ({ loc: siteUrl(baseUrl, `/sitemaps/${file}`) }))
  for (const [type, { total, last_modified }] of Object.entries(summary.types)) {
    if (!SITEMAP_PATHS[type]) continue
    for (let page = 1; page <= Math.ceil(total / summary.chunk); page++) {
      for (const file of sitemapFiles(`${type}-${page}`, !SITEMAP_SINGLE.has(type))) {
        files.push({ loc: siteUrl(baseUrl, `/sitemaps/${file}`), lastmod: last_modified })
      }
    }
  }

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return sitemapXml('sitemapindex', files)
}, { ...SITEMAP_CACHE, name: 'sitemap-index' })
