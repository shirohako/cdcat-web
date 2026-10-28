import type { EventBooth, VenueMapData } from '~/types/event'

/** One desk on the map, with the circles that share it. */
export interface VenueSpace {
  id: number
  hallId: number
  area: string
  number: string
  x: number
  y: number
  w: number
  h: number
  pieces: VenuePiece[]
}

/** The part of a desk one circle has: the whole desk, a half (a/b) or a third (x/y/z). */
export interface VenuePiece {
  key: string
  spaceId: number
  circle: EventBooth | null
  x: number
  y: number
  w: number
  h: number
}

const PARTS: Record<string, string[]> = { ab: ['ab'], a: ['a', 'b'], b: ['a', 'b'], x: ['x', 'y', 'z'], y: ['x', 'y', 'z'], z: ['x', 'y', 'z'] }

/**
 * Desks with their circles. A desk is cut along its longer side: two circles share a desk by
 * halves, mini spaces by thirds; a half nobody took stays empty.
 */
export function buildSpaces(map: VenueMapData, circles: EventBooth[]): VenueSpace[] {
  const bySpace = new Map<number, EventBooth[]>()
  for (const circle of circles) {
    if (circle.space_id === null) continue
    const list = bySpace.get(circle.space_id) ?? []
    list.push(circle)
    bySpace.set(circle.space_id, list)
  }
  return map.spaces.map(([id, hallId, area, number, x, y, w, h]) => {
    const own = bySpace.get(id) ?? []
    const parts = own.length === 1 && !own[0]!.sub ? ['ab'] : PARTS[own.find(c => c.sub)?.sub ?? 'ab'] ?? ['ab']
    const across = w >= h
    const step = (across ? w : h) / parts.length
    const pieces = parts.map((part, i) => ({
      key: `${id}-${part}`,
      spaceId: id,
      circle: parts.length === 1 ? own[0] ?? null : own.find(c => c.sub === part) ?? null,
      x: across ? x + step * i : x,
      y: across ? y : y + step * i,
      w: across ? step : w,
      h: across ? h : step,
    }))
    return { id, hallId, area, number, x, y, w, h, pieces }
  })
}

/**
 * Genre families coloured on the map. A floor plan puts every colour next to every other, so only
 * three hues are used (the data-viz palette's three all-pairs-safe slots); single genres are picked
 * from the legend instead, which dims the rest.
 */
export const GENRE_FAMILIES = [
  { key: 'music', color: '#2a78d6', tint: '#dbe8f8' },
  { key: 'anime_game', color: '#eb6834', tint: '#fbe1d6' },
  { key: 'other', color: '#1baf7a', tint: '#d3f0e5' },
] as const

export type GenreFamily = typeof GENRE_FAMILIES[number]['key']

export function genreFamily(code: string | null | undefined, genres: VenueMapData['genres']): GenreFamily | null {
  if (!code) return null
  const group = genres[code]?.group
  if (group === 'music') return 'music'
  if (group === 'anime_game') return 'anime_game'
  return group ? 'other' : null
}

/** The genre label without its family prefix ("音楽一般：ポップス" → "ポップス"). */
export function genreShortLabel(code: string, genres: VenueMapData['genres']) {
  const label = genres[code]?.label ?? code
  return label.includes('：') ? label.slice(label.indexOf('：') + 1) : label
}

/** Lowercase, full-width ASCII folded, katakana as hiragana: enough for searching names and kana. */
export function foldSearch(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

export function circleSearchText(circle: EventBooth) {
  return foldSearch([circle.name, circle.name_kana, circle.space_code, circle.twitter_handle && `@${circle.twitter_handle}`, ...circle.keywords, ...circle.artists.map(artist => artist.name)]
    .filter(Boolean).join(' '))
}

/** The host a link points at, for showing it compactly. */
export function linkLabel(link: { type: string, url: string }) {
  try {
    const host = new URL(link.url).hostname.replace(/^www\./, '')
    return host
  } catch {
    return link.url
  }
}

/** An icon for a circle link, by host. */
export function linkIcon(url: string) {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^(www|m)\./, '')
    } catch {
      return ''
    }
  })()
  if (host === 'x.com' || host === 'twitter.com') return 'simple-icons:x'
  if (host.endsWith('youtube.com') || host === 'youtu.be') return 'simple-icons:youtube'
  if (host.endsWith('soundcloud.com')) return 'simple-icons:soundcloud'
  if (host.endsWith('nicovideo.jp') || host === 'nico.ms') return 'simple-icons:niconico'
  if (host.endsWith('bandcamp.com')) return 'simple-icons:bandcamp'
  if (host.endsWith('booth.pm')) return 'lucide:shopping-bag'
  if (host === 'instagram.com') return 'simple-icons:instagram'
  if (host === 'lit.link' || host === 'linktr.ee') return 'lucide:link'
  if (host.endsWith('spotify.com')) return 'simple-icons:spotify'
  return 'lucide:globe'
}

/** A circle's preview video, watched on its own site. */
export interface CircleVideo {
  key: string
  url: string
  site: 'youtube' | 'niconico'
  thumbnail: string | null
}

/**
 * The catalog's YouTube embeds plus links that point at a single video (not a channel or a
 * profile), one card per video.
 */
export function circleVideos(circle: Pick<EventBooth, 'embeds' | 'links'>): CircleVideo[] {
  const videos = new Map<string, CircleVideo>()
  const youtube = (id: string) => videos.set(`yt:${id}`, {
    key: `yt:${id}`,
    url: `https://www.youtube.com/watch?v=${id}`,
    site: 'youtube',
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  })
  for (const embed of circle.embeds) if (embed.type === 'youtube') youtube(embed.id)
  for (const link of circle.links) {
    let url: URL
    try {
      url = new URL(link.url)
    } catch {
      continue
    }
    const host = url.hostname.replace(/^(www|m)\./, '')
    const path = url.pathname
    const id = host === 'youtu.be'
      ? path.slice(1)
      : host === 'youtube.com' || host === 'music.youtube.com'
        ? (path === '/watch' ? url.searchParams.get('v') : path.match(/^\/(?:shorts|live|embed)\/([\w-]{6,20})/)?.[1]) ?? ''
        : ''
    if (/^[\w-]{6,20}$/.test(id)) {
      youtube(id)
      continue
    }
    const nico = (host === 'nicovideo.jp' || host === 'sp.nicovideo.jp') ? path.match(/^\/watch\/((?:sm|so|nm)\d+)/)?.[1] : host === 'nico.ms' ? path.match(/^\/((?:sm|so|nm)\d+)/)?.[1] : undefined
    if (nico) videos.set(`nico:${nico}`, { key: `nico:${nico}`, url: `https://www.nicovideo.jp/watch/${nico}`, site: 'niconico', thumbnail: null })
  }
  return [...videos.values()]
}
