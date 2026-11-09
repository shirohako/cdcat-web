import type { CatalogLink } from '~/types/catalog'

/** What the external link card says about a link. Only `url` is needed; the rest fills in the card's rows. */
export interface ExternalLinkInfo {
  url: string
  /** The link's own name (a catalog link's label, a button's text such as 官方网站). */
  name?: string | null
  /** The site's name; the card shows the host when there is none. */
  site?: string | null
  /** A link category (official, shop …); `other` when not given. */
  category?: string | null
  /** The link provider's key, for the tile's hue. */
  providerKey?: string | null
}

/** The link on screen; AppExternalLink shows it. Only set in the browser, so it is never shared between requests. */
const shown = shallowRef<ExternalLinkInfo | null>(null)

/** Web addresses get the card; others (mail addresses in descriptions) open as they would. */
export const isWebAddress = (url: string) => /^https?:\/\//i.test(url)

/** What the card shows for a catalog link (album, artist, entry and series links). */
export const catalogLinkInfo = (link: CatalogLink): ExternalLinkInfo => ({
  url: link.url,
  name: link.label,
  site: link.provider?.name,
  category: link.provider?.category,
  providerKey: link.provider?.key,
})

/**
 * The card that stands in front of external links on detail pages: what the link is, its full address, a reminder
 * that it leaves CDCat, and buttons to copy or open it. Links stay real `<a href target="_blank">`; give them
 * `@click="onClick($event, info)"`. A plain click on a web address opens the card instead of the site; a click with a
 * modifier key, a middle click or the context menu opens the link as the browser would, and so does a click that
 * something else (a tooltip's long press) has already taken.
 */
export function useExternalLink() {
  const open = (info: ExternalLinkInfo) => { shown.value = info }
  const onClick = (event: MouseEvent, info: ExternalLinkInfo) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (!isWebAddress(info.url)) return
    event.preventDefault()
    open(info)
  }
  return { open, onClick, shown: readonly(shown) }
}

/** Closes the card; used by AppExternalLink. */
export function closeExternalLink() {
  shown.value = null
}
