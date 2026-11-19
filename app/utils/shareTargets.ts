/**
 * Where the share card dialog sends a page's link (docs/share-cards in the API repo, 「分享」): each site's own share
 * page, opened in a new tab. Neither needs an app key. The other buttons have no such page:
 * - Discord: the link is copied.
 * - QQ: shared from phones through the system's share sheet. A plain link stays a bare link in QQ, which draws
 *   cards only for sites it knows; QQ Connect's share page address does too, and the page itself is only a code to scan.
 * - KakaoTalk needs a registered Kakao app and is left for later.
 */
export interface SharePage {
  /** The page's absolute address, in the sharer's language (`?lang=`). */
  url: string
  /** What the page tells crawlers it is (og:title): an album's title and artists, an artist's name. */
  title: string
}

export type ShareSite = 'x' | 'line'

/** Query parameters percent-encoded (not `+` for spaces, which not every share page reads back as a space). */
function query(params: Record<string, string | null | undefined>) {
  return Object.entries(params)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('&')
}

/** The address of `site`'s share page for `page`. */
export function shareUrl(site: ShareSite, page: SharePage): string {
  switch (site) {
    case 'x':
      return `https://x.com/intent/tweet?${query({ text: page.title, url: page.url })}`
    case 'line':
      // LINE's official share page takes the address only; the chat shows the page's own preview.
      return `https://social-plugins.line.me/lineit/share?${query({ url: page.url })}`
  }
}
