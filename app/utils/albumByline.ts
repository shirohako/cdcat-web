import type { AlbumByline } from '~/types/album'

/** Plain text, never translated, like the backend's (App\Support\AlbumByline::VARIOUS). */
export const VARIOUS_ARTISTS = 'Various Artists'

/** Where space is short (page titles, descriptions), more 署名艺术家 than this read Various Artists. */
export const BYLINE_MAX_NAMES = 3

/** The byline as one line of text, as App\Support\AlbumByline::text writes it; '' when the album has none. */
export function bylineText(byline: AlbumByline | null | undefined, max = BYLINE_MAX_NAMES): string {
  const names = (byline?.artists ?? []).map(artist => artist.name)
  if (!names.length) return ''
  return byline?.role === 'artist' && names.length > max ? VARIOUS_ARTISTS : names.join(', ')
}
