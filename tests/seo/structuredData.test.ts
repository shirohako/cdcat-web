import { describe, expect, it } from 'vitest'
import { artistLdType, breadcrumbLd, compactLd, entryLdType, eventLd, ldDate, ldDuration, musicAlbumLd } from '../../app/utils/structuredData'

describe('helpers', () => {
  it('drops empty values at every depth but keeps false and 0', () => {
    expect(compactLd({ a: '', b: null, c: [], d: {}, e: { f: undefined }, g: false, h: 0, i: [null, 'x'] })).toEqual({ g: false, h: 0, i: ['x'] })
  })

  it('writes dates at their precision', () => {
    expect(ldDate('2026-04-26', 'day')).toBe('2026-04-26')
    expect(ldDate('2026-04-01', 'month')).toBe('2026-04')
    expect(ldDate('2026-01-01T00:00:00Z', 'year')).toBe('2026')
    expect(ldDate(null)).toBeUndefined()
  })

  it('writes ISO 8601 durations', () => {
    expect(ldDuration(185)).toBe('PT3M5S')
    expect(ldDuration(3723)).toBe('PT1H2M3S')
    expect(ldDuration(3600)).toBe('PT1H')
    expect(ldDuration(45)).toBe('PT45S')
    expect(ldDuration(0)).toBeUndefined()
    expect(ldDuration(null)).toBeUndefined()
  })

  it('maps artist and entry types onto schema.org types', () => {
    expect(artistLdType('person')).toBe('Person')
    expect(artistLdType('company')).toBe('Organization')
    expect(artistLdType('circle')).toBe('MusicGroup')
    expect(artistLdType(null)).toBe('MusicGroup')
    expect(entryLdType('game')).toBe('VideoGame')
    expect(entryLdType('anime')).toBe('TVSeries')
    expect(entryLdType('stage')).toBe('CreativeWork')
  })
})

describe('musicAlbumLd', () => {
  const album = {
    name: '东方改编',
    alternateNames: ['東方アレンジ', '东方改编', null, '東方アレンジ'],
    url: 'https://cdcat.net/albums/13',
    image: 'https://img.cdcat.net/a.webp',
    datePublished: '2026-04-26',
    genre: ['游戏'],
    artists: [{ name: 'Circle', url: 'https://cdcat.net/artists/1', type: 'circle' }, { name: 'Singer', url: 'https://cdcat.net/artists/2', type: 'person' }],
    labels: [],
    catalogNumber: 'CDCT-0101',
    tracks: [{ name: 'One', url: 'https://cdcat.net/tracks/1', duration: 245 }, { name: 'Two', url: 'https://cdcat.net/tracks/2', duration: null }],
    rating: { value: 4.5, count: 2 },
    isAdult: true,
  }

  it('describes the album, its artists, tracks, release and rating', () => {
    const ld = musicAlbumLd(album) as Record<string, unknown>
    expect(ld['@type']).toBe('MusicAlbum')
    expect(ld.alternateName).toEqual(['東方アレンジ'])
    expect(ld.byArtist).toEqual([
      { '@type': 'MusicGroup', 'name': 'Circle', 'url': 'https://cdcat.net/artists/1' },
      { '@type': 'Person', 'name': 'Singer', 'url': 'https://cdcat.net/artists/2' },
    ])
    expect(ld.numTracks).toBe(2)
    expect(ld.track).toEqual([
      { '@type': 'MusicRecording', 'position': 1, 'name': 'One', 'url': 'https://cdcat.net/tracks/1', 'duration': 'PT4M5S' },
      { '@type': 'MusicRecording', 'position': 2, 'name': 'Two', 'url': 'https://cdcat.net/tracks/2' },
    ])
    expect(ld.albumRelease).toEqual({ '@type': 'MusicRelease', 'name': '东方改编', 'catalogNumber': 'CDCT-0101' })
    expect(ld.aggregateRating).toEqual({ '@type': 'AggregateRating', 'ratingValue': 4.5, 'ratingCount': 2, 'bestRating': 5, 'worstRating': 1 })
    expect(ld.isFamilyFriendly).toBe(false)
  })

  it('leaves out the release and rating when there is nothing to say', () => {
    const ld = musicAlbumLd({ ...album, catalogNumber: null, rating: null, tracks: [] }) as Record<string, unknown>
    expect(ld).not.toHaveProperty('albumRelease')
    expect(ld).not.toHaveProperty('aggregateRating')
    expect(ld).not.toHaveProperty('numTracks')
  })
})

describe('eventLd and breadcrumbLd', () => {
  it('places an event at its venue within its series', () => {
    expect(eventLd({ name: 'M3-58', url: 'https://cdcat.net/events/5', startDate: '2026-10-25', venue: '東京流通センター', address: null, series: { name: 'M3', url: 'https://cdcat.net/event-series/1' } })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': 'M3-58',
      'url': 'https://cdcat.net/events/5',
      'startDate': '2026-10-25',
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
      'location': { '@type': 'Place', 'name': '東京流通センター' },
      'superEvent': { '@type': 'EventSeries', 'name': 'M3', 'url': 'https://cdcat.net/event-series/1' },
    })
  })

  it('numbers the crumbs from one', () => {
    const ld = breadcrumbLd([{ name: 'CDCAT', url: 'https://cdcat.net/' }, { name: 'アルバム', url: 'https://cdcat.net/albums' }]) as { itemListElement: unknown[] }
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', 'position': 1, 'name': 'CDCAT', 'item': 'https://cdcat.net/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'アルバム', 'item': 'https://cdcat.net/albums' },
    ])
  })
})
