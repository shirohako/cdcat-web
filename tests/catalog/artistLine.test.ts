import { describe, expect, it } from 'vitest'
import { attachGuests, lineText, nameParts, parentCandidates, parentOf } from '../../app/utils/artistLine'

type Credit = { id: number | string, track_id: number | string | null, parent_id?: number | string | null, role: string, sort_order: number, name: string }
const credit = (id: Credit['id'], role: string, sortOrder: number, extra: Partial<Credit> = {}): Credit =>
  ({ id, track_id: 1, role, sort_order: sortOrder, name: String(id), ...extra })

describe('credit parents', () => {
  it('keeps a parent of the same track, else gives a 客串 the nearest credit before it, else the last', () => {
    const credits = [credit('xeudo', 'artist', 0), credit('xeno', 'artist', 1), credit('eili', 'featuring', 2)]
    expect(parentOf(credits[2]!, credits)?.id).toBe('xeno')
    expect(parentOf({ ...credits[2]!, parent_id: 'xeudo' }, credits)?.id).toBe('xeudo')
    // Listed first: the last one; another track's credit is no parent
    const early = [credit('guest', 'featuring', 0, { parent_id: 'other' }), credit('a', 'artist', 1), credit('b', 'artist', 2), credit('other', 'artist', 0, { track_id: 2 })]
    expect(parentOf(early[0]!, early)?.id).toBe('b')
  })

  it('leaves other roles without a parent unless they have one, and never a 客串 or a credit that belongs to one', () => {
    const credits = [credit('a', 'artist', 0), credit('t', 'tuning', 1), credit('v', 'vocals', 2, { parent_id: 'a' }), credit('f', 'featuring', 3)]
    expect(parentOf(credits[1]!, credits)).toBeNull()
    expect(parentOf(credits[2]!, credits)?.id).toBe('a')
    expect(parentCandidates(credits[3]!, credits).map(item => item.id)).toEqual(['a', 't'])
  })

  it('hangs the guests on their credits and prints the line', () => {
    const { lines, left } = attachGuests(['しゅーりん', 'MoAE:.'], ['nayuta', 'Rin'], name => name, guest => (guest === 'nayuta' ? 'MoAE:.' : 'nobody'))
    expect(lines).toEqual([{ item: 'しゅーりん', guests: [] }, { item: 'MoAE:.', guests: ['nayuta'] }])
    expect(lineText(lines, left, name => name)).toBe('しゅーりん, MoAE:. feat. nayuta, Rin')
    expect(lineText([{ item: 'A', guests: [] }], ['C'], name => name)).toBe('A feat. C')
    expect(lineText([], ['C', 'D'], name => name)).toBe('C, D')
  })

  it('finds the artist\'s own name in a credited one', () => {
    expect(nameParts('void (Mournfinale)', 'void')).toEqual(['', 'void', ' (Mournfinale)'])
    expect(nameParts('CV: YUKI', 'yuki')).toEqual(['CV: ', 'YUKI', ''])
    expect(nameParts('Yuki Kajiura', '梶浦由記')).toBeNull()
    expect(nameParts('void', 'void')).toBeNull()
  })
})
