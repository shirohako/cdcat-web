import type { AlbumDisc, AlbumTrack } from '../../app/types/album'
import type { CatalogCredit } from '../../app/types/catalog'
import { describe, expect, it } from 'vitest'
import { trackPeople, trackRoleGroups } from '../../app/utils/trackPeople'

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
const disc = (position: number, tracks: AlbumTrack[]): AlbumDisc => ({ id: position, position, title: null, titles: [], format: 'cd', bonus_id: null, tocs: [], tracks })

describe('track people', () => {
  it('keeps each job title of a role apart and spells it in the groups', () => {
    const designer = (name: string, artistId: number, role_label: string | null) => ({ ...credit('performer', name, artistId), role_label })
    const people = trackPeople([disc(1, [
      track(1, [designer('NAGI', 1, 'Graphic Designer'), designer('Eris', 2, null)]),
      track(2, [designer('NAGI', 1, 'Package Designer'), designer('Eris', 2, 'Graphic Designer')]),
      track(3, []),
    ])], role => ORDER.indexOf(role))
    expect(people[0]!.roles.map(role => [role.role_label, role.tracks])).toEqual([['Graphic Designer', '1'], ['Package Designer', '2']])
    expect(people[0]!.tracks?.[0]?.tracks[1]?.roles).toEqual([{ role: 'performer', role_label: 'Package Designer', detail: null }])
    expect(trackRoleGroups(people, role => ORDER.indexOf(role)).map(group => [group.role_label, group.people.map(person => person.name)])).toEqual([
      ['Graphic Designer', ['NAGI', 'Eris']], ['Package Designer', ['NAGI']], [null, ['Eris']],
    ])
  })

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

  it('shows the printed name and keeps an artist\'s two printed names apart', () => {
    const as = (role: string, artistId: number, name: string, printed: string | null): CatalogCredit => ({ ...credit(role, name, artistId), credited_as: printed })
    const people = trackPeople([disc(1, [
      track(1, [as('composer', 1, 'Akarin', 'Silence Akarin')]),
      track(2, [as('composer', 1, 'Akarin', null), as('arranger', 1, 'Akarin', 'Silence Akarin')]),
    ])], role => ORDER.indexOf(role))
    expect(people.map(person => [person.name, person.artistId, person.artistName, person.roles.map(role => [role.role, role.tracks])])).toEqual([
      ['Silence Akarin', 1, 'Akarin', [['composer', '1'], ['arranger', '2']]],
      ['Akarin', 1, 'Akarin', [['composer', '2']]],
    ])
  })

  it('names the disc when there are several and keeps printed numbers', () => {
    const people = trackPeople([
      disc(2, [track(1, [credit('composer', 'A', 1)], { disc_number: 2 })]),
      disc(1, [track(1, [credit('composer', 'A', 1)], { number_label: 'A1' }), track(2, [])]),
    ], role => ORDER.indexOf(role))
    expect(people[0]!.roles[0]!.tracks).toBe('Disc 1: A1 · Disc 2: 1')
  })

  it('lists each person\'s tracks per disc with their roles on each, null for every track', () => {
    const people = trackPeople([
      disc(1, [track(1, [credit('arranger', 'A', 1), credit('composer', 'A', 1), credit('artist', 'B', 2)], { number_label: 'A1' }), track(2, [credit('artist', 'B', 2)])]),
      disc(2, [track(3, [credit('performer', 'A', 1, 'Guitar'), credit('artist', 'B', 2)], { disc_number: 2 })]),
    ], role => ORDER.indexOf(role))
    expect(people[0]!.tracks).toEqual([
      { disc: 1, tracks: [{ id: 1010, label: 'A1', title: 'T1', roles: [{ role: 'composer', role_label: null, detail: null }, { role: 'arranger', role_label: null, detail: null }] }] },
      { disc: 2, tracks: [{ id: 2030, label: '3', title: 'T3', roles: [{ role: 'performer', role_label: null, detail: 'Guitar' }] }] },
    ])
    expect(people[1]!.tracks).toBeNull()
  })

  it('turns the people around into one group per role, people in tracklist order', () => {
    const order = (role: string) => ORDER.indexOf(role)
    const groups = trackRoleGroups(trackPeople([disc(1, [
      track(1, [credit('performer', 'Eris', null, 'Guitar'), credit('composer', 'NAGI', 1)]),
      track(2, [credit('composer', 'Mio', 3), credit('performer', 'Eris', null, 'Bass'), credit('artist', 'Vivienne', 2)]),
    ])], order), order)
    expect(groups.map(group => [group.role, group.people.map(person => [person.name, person.detail, person.tracks])])).toEqual([
      ['artist', [['Vivienne', null, '2']]],
      ['composer', [['NAGI', null, '1'], ['Mio', null, '2']]],
      ['performer', [['Eris', 'Guitar', '1'], ['Eris', 'Bass', '2']]],
    ])
  })
})
