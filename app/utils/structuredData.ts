/**
 * schema.org objects for the JSON-LD on public pages (docs/seo in the API repo). Callers pass names already in
 * the page language and absolute URLs; empty values are dropped, so optional fields can be passed as they are.
 */

import type { DatePrecision } from '~/types/entry'

type Json = Record<string, unknown>

export interface LdRef {
  name: string
  url?: string
}

/** Drops null, undefined, '' and empty arrays/objects, at every depth. */
export function compactLd<T>(value: T): T {
  if (Array.isArray(value)) return value.map(compactLd).filter(isFilled) as T
  if (value && typeof value === 'object') {
    const out: Json = {}
    for (const [key, entry] of Object.entries(value)) {
      const compacted = compactLd(entry)
      if (isFilled(compacted)) out[key] = compacted
    }
    return out as T
  }
  return value
}

const isFilled = (value: unknown) => value !== null && value !== undefined && value !== ''
  && !(Array.isArray(value) && !value.length) && !(typeof value === 'object' && !Array.isArray(value) && !Object.keys(value as object).length)

/** An ISO 8601 date at its precision: 2026, 2026-04 or 2026-04-26. */
export function ldDate(date: string | null | undefined, precision: DatePrecision | null | undefined = 'day') {
  if (!date) return undefined
  const day = date.slice(0, 10)
  return precision === 'year' ? day.slice(0, 4) : precision === 'month' ? day.slice(0, 7) : day
}

/** An ISO 8601 duration such as PT3M5S. */
export function ldDuration(seconds: number | null | undefined) {
  if (!seconds || seconds < 0) return undefined
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = Math.floor(seconds % 60)
  return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${rest || (!hours && !minutes) ? `${rest}S` : ''}`
}

/** Other names, without the one already in `name`. */
const alternates = (name: string, others: Array<string | null | undefined>) => [...new Set(others.filter((other): other is string => !!other && other !== name))]

/** People are a Person, companies an Organization; groups, circles, virtual singers and characters a MusicGroup. */
export function artistLdType(type: string | null | undefined) {
  return type === 'person' ? 'Person' : type === 'company' ? 'Organization' : 'MusicGroup'
}

const ENTRY_LD_TYPES: Record<string, string> = { game: 'VideoGame', anime: 'TVSeries', tv: 'TVSeries', movie: 'Movie', book: 'Book', manga: 'Book' }
export const entryLdType = (type: string | null | undefined) => ENTRY_LD_TYPES[type ?? ''] ?? 'CreativeWork'

const ref = (type: string, item: LdRef | null | undefined) => item ? { '@type': type, 'name': item.name, 'url': item.url } : undefined

export function breadcrumbLd(items: LdRef[]) {
  return compactLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({ '@type': 'ListItem', 'position': index + 1, 'name': item.name, 'item': item.url })),
  })
}

export function websiteLd(site: { name: string, url: string, logo: string, description?: string, inLanguage?: string }) {
  return [
    compactLd({ '@context': 'https://schema.org', '@type': 'WebSite', 'name': site.name, 'url': site.url, 'description': site.description, 'inLanguage': site.inLanguage }),
    compactLd({ '@context': 'https://schema.org', '@type': 'Organization', 'name': site.name, 'url': site.url, 'logo': site.logo }),
  ]
}

export interface AlbumLdInput {
  name: string
  alternateNames: Array<string | null | undefined>
  url: string
  image?: string | null
  description?: string
  datePublished?: string
  genre?: string[]
  artists: Array<LdRef & { type?: string | null }>
  labels: LdRef[]
  catalogNumber?: string | null
  tracks: Array<LdRef & { duration?: number | null }>
  rating?: { value: number, count: number } | null
  isAdult: boolean
}

export function musicAlbumLd(album: AlbumLdInput) {
  return compactLd({
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    'name': album.name,
    'alternateName': alternates(album.name, album.alternateNames),
    'url': album.url,
    'image': album.image,
    'description': album.description,
    'datePublished': album.datePublished,
    'genre': album.genre,
    'byArtist': album.artists.map(artist => ref(artistLdType(artist.type), artist)),
    'numTracks': album.tracks.length || undefined,
    'track': album.tracks.map((track, index) => ({ '@type': 'MusicRecording', 'position': index + 1, 'name': track.name, 'url': track.url, 'duration': ldDuration(track.duration) })),
    'albumRelease': album.catalogNumber || album.labels.length
      ? { '@type': 'MusicRelease', 'name': album.name, 'catalogNumber': album.catalogNumber, 'recordLabel': album.labels.map(label => ref('Organization', label)) }
      : undefined,
    'aggregateRating': album.rating?.count
      ? { '@type': 'AggregateRating', 'ratingValue': album.rating.value, 'ratingCount': album.rating.count, 'bestRating': 5, 'worstRating': 1 }
      : undefined,
    'isFamilyFriendly': !album.isAdult,
  })
}

export function musicRecordingLd(track: { name: string, alternateNames: Array<string | null | undefined>, url: string, duration?: number | null, isrc?: string | null, album?: LdRef | null, artists: Array<LdRef & { type?: string | null }> }) {
  return compactLd({
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    'name': track.name,
    'alternateName': alternates(track.name, track.alternateNames),
    'url': track.url,
    'duration': ldDuration(track.duration),
    'isrcCode': track.isrc,
    'inAlbum': ref('MusicAlbum', track.album),
    'byArtist': track.artists.map(artist => ref(artistLdType(artist.type), artist)),
  })
}

/** An artist, label, entry or franchise: a named thing with other names, an image and links elsewhere. */
export function namedLd(type: string, item: { name: string, alternateNames: Array<string | null | undefined>, url: string, image?: string | null, description?: string, sameAs?: string[], [field: string]: unknown }) {
  const { name, alternateNames, url, image, description, sameAs, ...rest } = item
  return compactLd({
    '@context': 'https://schema.org',
    '@type': type,
    name,
    'alternateName': alternates(name, alternateNames),
    url,
    image,
    description,
    sameAs,
    ...rest,
  })
}

export function eventLd(event: { name: string, url: string, startDate?: string | null, endDate?: string | null, venue?: string | null, address?: string | null, image?: string | null, description?: string, series?: LdRef | null }) {
  return compactLd({
    '@context': 'https://schema.org',
    '@type': 'Event',
    'name': event.name,
    'url': event.url,
    'startDate': event.startDate,
    'endDate': event.endDate,
    'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
    'location': event.venue || event.address ? { '@type': 'Place', 'name': event.venue || event.address, 'address': event.address } : undefined,
    'image': event.image,
    'description': event.description,
    'superEvent': ref('EventSeries', event.series),
  })
}
