import { itemUrls, sitemapApi, SITEMAP_PATHS, type SitemapItem } from '../utils/sitemap'
import { INDEXNOW_ENDPOINT, INDEXNOW_WINDOW_MS, indexNowBodies } from '../utils/indexnow'

/**
 * Hourly (nuxt.config `scheduledTasks`): tells IndexNow about the pages that changed since the last run, in every
 * language version. The addresses come from the same data and the same rules as the sitemap, so only pages that
 * may be indexed are sent. It runs only where NUXT_INDEXNOW_KEY is set and the site is indexable (production).
 */
export default defineTask({
  meta: { name: 'indexnow', description: 'Tell IndexNow (Bing, Naver) about pages changed in the last hour' },
  async run() {
    const config = useRuntimeConfig()
    const key = String(config.indexnowKey || '')
    const baseUrl = String(config.public.baseUrl || '')
    if (!key || !baseUrl || !config.public.indexable) return { result: 'skipped: no key, no base URL or not indexable' }

    const since = new Date(Date.now() - INDEXNOW_WINDOW_MS).toISOString()
    const urls: string[] = []
    for (const type of Object.keys(SITEMAP_PATHS)) {
      for (let page = 1; ; page++) {
        const { items } = await sitemapApi<{ items: SitemapItem[] }>(undefined, `/${type}`, { page, updated_since: since })
        urls.push(...itemUrls(type, items, baseUrl))
        if (!items.length) break
      }
    }
    for (const body of indexNowBodies(baseUrl, key, urls)) await $fetch(INDEXNOW_ENDPOINT, { method: 'POST', body })
    return { result: `${urls.length} addresses` }
  },
})
