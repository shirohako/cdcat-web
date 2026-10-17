import type { RowId } from '~/types/document'

type Ordered = { sort_order?: number }

/** Whether two row ids are the same row: ids are integers, new rows' keys are strings. */
export const sameId = (a: RowId | null | undefined, b: RowId | null | undefined) =>
  a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b)

/** Rows in display order: by sort_order, rows without one by their position. */
export const byOrder = <T extends Ordered>(rows: T[]): T[] => rows
  .map((row, index) => ({ row, index }))
  .sort((a, b) => (a.row.sort_order ?? a.index) - (b.row.sort_order ?? b.index) || a.index - b.index)
  .map(entry => entry.row)

/** The sort_order for a row appended to `rows`. */
export const nextOrder = (rows: Ordered[]) => rows.reduce((max, row) => Math.max(max, row.sort_order ?? -1), rows.length - 1) + 1

/** Moves a row up or down in display order and renumbers sort_order 0..n-1. */
export const moveRow = <T extends Ordered>(rows: T[], row: T, delta: number) => {
  const ordered = byOrder(rows)
  const from = ordered.indexOf(row)
  const to = from + delta
  if (from < 0 || to < 0 || to >= ordered.length) return
  ordered.splice(to, 0, ...ordered.splice(from, 1))
  ordered.forEach((item, index) => { item.sort_order = index })
}
