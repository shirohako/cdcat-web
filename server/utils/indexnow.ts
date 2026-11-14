// IndexNow (indexnow.org): one POST tells Bing, Naver and the other engines behind it which pages are new or
// changed, so they needn't wait for a crawl. The key is public by design: it is served at /indexnow-key.txt, and
// the engines fetch it to check that the sender runs the site.

/** IndexNow takes at most this many addresses in one request. */
export const INDEXNOW_BATCH = 10000

/** How far back each hourly run looks; the overlap covers a late run, and repeating an address does no harm. */
export const INDEXNOW_WINDOW_MS = 70 * 60 * 1000

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/** The request bodies for `urls`: the site's host, the key and where to check it, and the addresses in batches. */
export function indexNowBodies(baseUrl: string, key: string, urls: string[]) {
  const host = new URL(baseUrl).host
  const unique = [...new Set(urls)]
  const bodies: Array<{ host: string, key: string, keyLocation: string, urlList: string[] }> = []
  for (let start = 0; start < unique.length; start += INDEXNOW_BATCH) {
    bodies.push({ host, key, keyLocation: `${baseUrl.replace(/\/+$/, '')}/indexnow-key.txt`, urlList: unique.slice(start, start + INDEXNOW_BATCH) })
  }
  return bodies
}
