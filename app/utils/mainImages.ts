import type { RowId } from '~/types/document'
import { byOrder } from './documentRows'

/**
 * Main images (docs/catalog/README.md#图片): an album or artist may have several images of a kind that has a main one
 * (cover, avatar, banner); the one marked is_primary is what the pages show. Uploading another or giving a row that
 * kind never changes it: only making a row the main one does, and the old main one stays as it was, a plain image.
 */
type ImageRow = { id: RowId, kind: string, is_primary?: boolean, sort_order?: number }

/** The main image of a kind, if one is marked. */
export const mainImageOf = <T extends ImageRow>(rows: T[], kind: string) => byOrder(rows).find(row => row.kind === kind && row.is_primary) ?? null

/** Makes a row the main one of its kind; the one that was stays among the other images. */
export function makeMainImage<T extends ImageRow>(rows: T[], row: T) {
  for (const other of rows) {
    if (other !== row && other.kind === row.kind && other.is_primary) other.is_primary = false
  }
  row.is_primary = true
}
