/** Crawling is allowed only where NUXT_PUBLIC_INDEXABLE=true; other environments turn every crawler away. */
export default defineEventHandler((event) => {
  const { indexable, baseUrl } = useRuntimeConfig(event).public
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  if (!indexable) return 'User-agent: *\nDisallow: /\n'

  return [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /search',
    'Disallow: /discussions/search',
    'Disallow: /dev/',
    '',
    `Sitemap: ${siteUrl(String(baseUrl ?? ''), '/sitemap.xml')}`,
    '',
  ].join('\n')
})
