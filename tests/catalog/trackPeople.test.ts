import type { AlbumDisc, AlbumTrack } from '../../app/types/album'
import type { CatalogCredit } from '../../app/types/catalog'
import { describe, expect, it } from 'vitest'
import { trackPeople } from '../../app/utils/trackPeople'

const ORDER = ['artist', 'composer', 'arranger', 'performer']
let nextId = 1
const credit = (role: string, name: string, artistId: number | null, detail: string | null = null): CatalogCredit => ({
  id: nextId++, role, category: null, artist: artistId ? { id: artistId, name } : null, credited_as: artistId ? null : name, detail,
})
const track = (number: number, credits: CatalogCredit[], extra: Partial<AlbumTrack> = {}): AlbumTrack => ({
  id: number * 10 + (extra.disc_number ?? 1) * 1000, disc_number: 1, track_number: number, number_label: null, title: `T${number}`, titles: [], duration: 200,
  is_instrumental: false, isrc: null, favorites_count: 0, is_favorited: false, has_lyrics: false, lyrics_count: 0, translations_count: 0,
  originals: [], credits, attributes: [], ...extra,
})
const disc = (position: number, tracks: AlbumTrack[]): AlbumDisc => ({ id: position, position, title: null, titles: [], format: 'cd', bonus_id: null, tracks })

describe('track people', () => {
  it('groups track credits by artist in tracklist order, roles in order with their tracks as ranges', () => {
    const people = trackPeople([disc(1, [
      track(1, [credit('composer', 'NAGI', 1), credit('artist', 'Vivienne', 2)]),
      track(2, [credit('composer', 'NAGI', 1), credit('arranger', 'NAGI', 1), credit('artist', 'Vivienne', 2)]),
      track(3, [credit('composer', 'NAGI', 1), credit('artist', 'Vivienne', 2)]),
      track(4, [credit('artist', 'Vivienne', 2), credit('performer', 'Eris', null, 'Guitar')]),
      track(5, [credit('composer', 'NAGI', 1), credit('artist', 'Vivienne', 2)]),
    ])], role => ORDER.indexOf(role))
    expect(people.map(person => [person.name, person.artistId, person.roles.map(role => [role.role, role.detail, role.tracks])])).toEqual([
      ['NAGI', 1, [['composer', null, '1–3, 5'], ['arranger', null, '2']]],
      ['Vivienne', 2, [['artist', null, null]]],
      ['Eris', null, [['performer', 'Guitar', '4']]],
    ])
  })

  it('names the disc when there are several and keeps printed numbers', () => {
    const people = trackPeople([
      disc(2, [track(1, [credit('composer', 'A', 1)], { disc_number: 2 })]),
      disc(1, [track(1, [credit('composer', 'A', 1)], { number_label: 'A1' }), track(2, [])]),
    ], role => ORDER.indexOf(role))
    expect(people[0]!.roles[0]!.tracks).toBe('Disc 1: A1 · Disc 2: 1')
  })
})
