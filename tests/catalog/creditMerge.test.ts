import { describe, expect, it } from 'vitest'
import type { CreditGroup, CreditPerson } from '~/utils/creditMerge'
import { mergeCreditRoles } from '~/utils/creditMerge'

const kino: CreditPerson = { name: 'キノ', artistId: 1, detail: null }
const konomi: CreditPerson = { name: '姫宮このみ', artistId: 2, detail: null }
const group = (role: string, ...people: CreditPerson[]): CreditGroup => ({ key: role, role, role_label: null, category: 'other', people })
const shape = (groups: CreditGroup[]) => mergeCreditRoles(groups).map(row => [row.roles.map(item => item.role), row.people.map(person => person.name)])

describe('mergeCreditRoles', () => {
  it('puts roles held by the same people on one row, at the first role', () => {
    expect(shape([group('composer', kino), group('lyricist', kino, konomi), group('script', kino), group('setting', konomi, kino)])).toEqual([
      [['composer', 'script'], ['キノ']],
      [['lyricist', 'setting'], ['キノ', '姫宮このみ']],
    ])
  })

  it('keeps roles apart when only some of the people match', () => {
    expect(shape([group('composer', kino), group('sound', kino, konomi)])).toHaveLength(2)
  })

  it('keeps a different credited name or detail on its own row', () => {
    expect(shape([group('composer', kino), group('script', { ...kino, name: 'KINO' })])).toHaveLength(2)
    expect(shape([group('composer', kino), group('performer', { ...kino, detail: 'Guitar' })])).toHaveLength(2)
  })

  it('tells people without an artist apart by name', () => {
    const name = (text: string): CreditPerson => ({ name: text, artistId: null, detail: null })
    expect(shape([group('a', name('もろこし')), group('b', name('さゆ')), group('c', name('もろこし'))])).toEqual([
      [['a', 'c'], ['もろこし']],
      [['b'], ['さゆ']],
    ])
  })
})
