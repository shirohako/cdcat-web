import { describe, expect, it } from 'vitest'
import type { CreditRowPerson, CreditRowRole } from '../../app/utils/albumCreditPeople'
import { albumCreditPeople } from '../../app/utils/albumCreditPeople'

const person = (name: string, detail: string | null = null, artistId: number | null = null): CreditRowPerson => ({ name, artistId, artistName: artistId ? name : null, detail })
const group = (role: string, people: CreditRowPerson[], role_label: string | null = null): CreditRowRole => ({ key: JSON.stringify([role, role_label]), role, role_label, category: 'music', people })

describe('albumCreditPeople', () => {
  it('lists each person once with all their roles, in order', () => {
    const people = albumCreditPeople([group('composer', [person('Hagali', null, 1)]), group('mastering', [person('Shibayan', null, 2)]), group('producer', [person('Hagali', null, 1)])])
    expect(people.map(item => item.name)).toEqual(['Hagali', 'Shibayan'])
    expect(people[0]!.roles.map(role => role.role)).toEqual(['composer', 'producer'])
  })

  it('gathers a role\'s details', () => {
    const [patori] = albumCreditPeople([group('performer', [person('ぱとり', 'Tin Whistle'), person('ぱとり', 'Irish Flute'), person('ぱとり', 'Tin Whistle')])])
    expect(patori!.roles).toHaveLength(1)
    expect(patori!.roles[0]!.details).toEqual(['Tin Whistle', 'Irish Flute'])
  })

  it('keeps job titles of one role apart', () => {
    const [artist] = albumCreditPeople([group('other', [person('A')], 'Website'), group('other', [person('A')], 'Crossfade Video')])
    expect(artist!.roles.map(role => role.role_label)).toEqual(['Website', 'Crossfade Video'])
  })

  it('keeps someone credited under two names as two people', () => {
    const people = albumCreditPeople([group('composer', [person('A', null, 1)]), group('arranger', [person('B', null, 1)])])
    expect(people.map(item => item.name)).toEqual(['A', 'B'])
  })

  it('tells name-only credits apart by name', () => {
    expect(albumCreditPeople([group('composer', [person('A'), person('B')])]).map(item => item.name)).toEqual(['A', 'B'])
  })
})
