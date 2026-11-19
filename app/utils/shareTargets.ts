import { truncateText } from './seoText'

/**
 * Where the share card dialog sends a page's link (docs/share-cards in the API repo, 「分享」): each site's own share
 * page, opened in a new tab. None of them needs an app key. Discord has no such page, so its button copies the link;
 * KakaoTalk needs a registered Kakao app and is left for later.
 */
export interface SharePage {
  /** The page's absolute address, in the sharer's language (`?lang=`). */
  url: string
  /** What the page tells crawlers it is (og:title): an album's title and artists, an artist's name. */
  title: string
  /** og:description, for QQ's summary line. */
  description?: string | null
  /** A square picture (the cover, the avatar): QQ's link card shows a small square, where the wide card would be cut. */
  image?: string | null
}

export type ShareSite = 'x' | 'line' | 'qq'

export const SHARE_SITES: readonly ShareSite[] = ['x', 'line', 'qq']

/** QQ shows two lines of summary under the title. */
const QQ_SUMMARY_LENGTH = 80

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
    case 'qq':
      // QQ互联's share page: a logged-in QQ for PC sends it in one click, otherwise mobile QQ scans a code.
      return `https://connect.qq.com/widget/shareqq/index.html?${query({
        url: page.url,
        title: page.title,
        summary: page.description ? truncateText(page.description, QQ_SUMMARY_LENGTH) : null,
        pics: page.image,
        site: 'CDCat',
      })}`
  }
}
