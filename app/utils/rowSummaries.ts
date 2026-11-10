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

/** 3:45, or 1:02:03 past an hour. */
const clock = (seconds: number) => {
  const [hours, minutes, rest] = [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
  const pad = (value: number) => String(value).padStart(2, '0')
  return hours ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`
}

/** "Disc 1 · 5. Title"; without the disc at hand, "5. Title". */
const trackPlace = (row: Row, context: RowSummaryContext) => {
  const position = discPosition(row, context)
  return `${position === undefined ? '' : `${context.t('catalog.toc.disc_n', { n: position })} · `}${row.track_number}. ${row.title ?? ''}`
}

export const ROW_SUMMARIES: Record<string, RowSummary> = {
  // "Disc 1 · 5. Title (3:45) · 纯音乐 · ISRC …": an added or removed track reads as the track it is, not as its fields.
  tracks: {
    summary: (row, context) => [
      [trackPlace(row, context), typeof row.duration === 'number' ? `(${clock(row.duration)})` : null].filter(Boolean).join(' '),
      row.is_instrumental ? context.t('catalog.field.is_instrumental') : null,
      row.isrc ? `ISRC ${row.isrc}` : null,
    ].filter(Boolean).join(' · '),
    label: (row, context) => trackPlace(row, context),
  },
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
