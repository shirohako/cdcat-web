import { describe, expect, it } from 'vitest'
import { byOrder, fillRowIds, moveRow, nextOrder, placeRow, sameId } from '../../app/utils/documentRows'

describe('document rows', () => {
  it('orders by sort_order, then position', () => {
    const rows = [{ id: 1, sort_order: 2 }, { id: 2, sort_order: 0 }, { id: 3 }]
    expect(byOrder(rows).map(row => row.id)).toEqual([2, 1, 3])
  })

  it('moves a row and renumbers', () => {
    const rows = [{ id: 1, sort_order: 0 }, { id: 2, sort_order: 1 }, { id: 3, sort_order: 2 }]
    moveRow(rows, rows[2]!, -1)
    expect(byOrder(rows).map(row => [row.id, row.sort_order])).toEqual([[1, 0], [3, 1], [2, 2]])
    moveRow(rows, rows[0]!, -1)
    expect(byOrder(rows).map(row => row.id)).toEqual([1, 3, 2])
  })

  it('places a row before another, or last', () => {
    const rows = [{ id: 1, sort_order: 0 }, { id: 2, sort_order: 1 }, { id: 3, sort_order: 2 }, { id: 4, sort_order: 3 }]
    placeRow(rows, rows[3]!, rows[1]!)
    expect(byOrder(rows).map(row => [row.id, row.sort_order])).toEqual([[1, 0], [4, 1], [2, 2], [3, 3]])
    placeRow(rows, rows[0]!, null)
    expect(byOrder(rows).map(row => row.id)).toEqual([4, 2, 3, 1])
    placeRow(rows, rows[2]!, rows[2]!)
    expect(byOrder(rows).map(row => row.id)).toEqual([4, 2, 3, 1])
  })

  it('appends after the largest order', () => {
    expect(nextOrder([])).toBe(0)
    expect(nextOrder([{ sort_order: 5 }, { sort_order: 1 }])).toBe(6)
    expect(nextOrder([{}, {}])).toBe(2)
  })

  it('compares integer ids and new keys', () => {
    expect(sameId(3, 3)).toBe(true)
    expect(sameId('d1', 'd1')).toBe(true)
    expect(sameId(null, null)).toBe(false)
  })

  it('gives rows saved without an id a key of their own, and leaves the others', () => {
    const doc: Record<string, unknown> = {
      title: 'x',
      credits: [{ role: 'artist' }, { id: null, role: 'vocals' }, { id: '', role: 'composer' }, { id: 7, role: 'arranger' }, { id: 'c1', role: 'mixing' }],
      links: [{ url: 'https://example.com' }],
      tracks: 'not rows',
    }
    fillRowIds(doc, { collections: [{ name: 'credits' }, { name: 'links' }, { name: 'tracks' }, { name: 'titles' }] })
    const ids = (doc.credits as Array<{ id: unknown }>).map(row => row.id)
    expect(ids.slice(3)).toEqual([7, 'c1'])
    expect(ids.slice(0, 3).every(id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(id))).toBe(true)
    expect(new Set(ids).size).toBe(5)
    expect((doc.links as Array<{ id: unknown }>)[0]!.id).toEqual(expect.any(String))
    expect(doc.tracks).toBe('not rows')
  })
})
