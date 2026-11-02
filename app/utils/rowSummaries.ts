type Row = Record<string, unknown>

export interface RowSummaryContext {
  t: (key: string, params?: Record<string, unknown>) => string
  te: (key: string) => boolean
  /** A row of another collection in the documents the changes belong to, e.g. the disc a TOC is on. */
  find: (collection: string, id: unknown) => Row | undefined
}

/**
 * How a change list (catalog/DiffView) describes the rows of a collection whose every field, listed one after the
 * other, would be a wall of numbers. Collections without an entry get the generic description.
 */
export interface RowSummary {
  /** A whole row, added or removed. */
  summary: (row: Row, context: RowSummaryContext) => string
  /** A changed row's name. */
  label: (row: Row, context: RowSummaryContext) => string
  /** A changed field's value; undefined keeps the generic one. */
  value?: (field: string, value: unknown, context: RowSummaryContext) => string | undefined
}

const discPosition = (row: Row, { find }: RowSummaryContext) => find('discs', row.disc_id)?.position as number | undefined

export const ROW_SUMMARIES: Record<string, RowSummary> = {
  // "Disc 1 · 第 1–13 轨 · 数据轨 13 · EAC 日志"; without the disc at hand, "TOC · 第 1–13 轨 …".
  disc_tocs: {
    summary: (row, context) => {
      const { t, te } = context
      const position = discPosition(row, context)
      const source = `catalog.toc.source.${row.source}`
      return [
        position === undefined ? 'TOC' : t('catalog.toc.disc_n', { n: position }),
        t('catalog.toc.tracks', { first: row.first_track, last: row.last_track }),
        row.data_track ? t('catalog.toc.data_track_n', { n: row.data_track }) : null,
        te(source) ? t(source) : row.source,
      ].filter(Boolean).join(' · ')
    },
    label: (row, context) => {
      const position = discPosition(row, context)
      return position === undefined ? 'TOC' : context.t('catalog.toc.disc_toc', { n: position })
    },
    value: (field, value, { t }) => field === 'offsets' && Array.isArray(value) && value.length
      ? t('catalog.toc.offsets_short', { n: value.length, first: value[0], last: value.at(-1) })
      : undefined,
  },
}
