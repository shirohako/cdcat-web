import type { ChangeOp } from '~/types/catalog'

/** Collection metadata the diff needs: its fields, and reference sets such as products.disc_ids. */
export interface DiffCollection {
  name: string
  fields: Array<{ name: string }>
  refsets?: Record<string, unknown>
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/**
 * The changes from one external document to another, in the format the API uses for revision items
 * and versions: root fields, added and removed rows, changed row fields and reference set elements.
 * Display order (`sort_order`) is ignored, as the server's diff ignores renumbering.
 */
export const documentDiff = (
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  collections: DiffCollection[],
): ChangeOp[] => {
  const ops: ChangeOp[] = []
  const collectionNames = new Set(collections.map(collection => collection.name))
  for (const [name, value] of Object.entries(after)) {
    if (collectionNames.has(name)) continue
    if (!same(before?.[name], value)) ops.push({ op: 'set', path: [name], from: before?.[name] ?? null, to: value })
  }
  for (const collection of collections) {
    const oldRows = new Map(((before?.[collection.name] as Array<Record<string, unknown>> | undefined) ?? []).map(row => [String(row.id), row]))
    const newRows = new Map(((after[collection.name] as Array<Record<string, unknown>> | undefined) ?? []).map(row => [String(row.id), row]))
    const refsets = Object.keys(collection.refsets ?? {})
    for (const [id, row] of newRows) {
      const old = oldRows.get(id)
      if (!old) {
        ops.push({ op: 'add', path: [collection.name, row.id as string | number], value: row })
        continue
      }
      for (const field of collection.fields) {
        if (field.name === 'sort_order') continue
        if (!same(old[field.name], row[field.name])) ops.push({ op: 'set', path: [collection.name, row.id as string | number, field.name], from: old[field.name] ?? null, to: row[field.name] ?? null })
      }
      for (const refset of refsets) {
        const was = new Set(((old[refset] as unknown[]) ?? []).map(String))
        const now = new Set(((row[refset] as unknown[]) ?? []).map(String))
        for (const element of (row[refset] as Array<string | number>) ?? []) {
          if (!was.has(String(element))) ops.push({ op: 'add', path: [collection.name, row.id as string | number, refset, element] })
        }
        for (const element of (old[refset] as Array<string | number>) ?? []) {
          if (!now.has(String(element))) ops.push({ op: 'remove', path: [collection.name, row.id as string | number, refset, element] })
        }
      }
    }
    for (const [id, row] of oldRows) {
      if (!newRows.has(id)) ops.push({ op: 'remove', path: [collection.name, row.id as string | number], value: row })
    }
  }
  return ops
}
