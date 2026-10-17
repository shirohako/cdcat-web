import { describe, expect, it } from 'vitest'
import { byOrder, moveRow, nextOrder, sameId } from '../../app/utils/documentRows'

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
})
