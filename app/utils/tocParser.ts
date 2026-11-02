import { LEAD_IN, SESSION_GAP } from './discToc'

/** A disc TOC as the album document stores it (docs/catalog/README.md#TOC 与 Disc ID); the disc ids are computed by the server. */
export interface ParsedToc {
  first_track: number
  last_track: number
  /** Lead-out in absolute sectors, including the 150-sector lead-in */
  leadout_offset: number
  /** Track start offsets in absolute sectors, including the lead-in; a data track's too */
  offsets: number[]
  /** An Enhanced CD's data track, found by the 11400-sector gap before it */
  data_track: number | null
  source: 'eac' | 'xld' | 'cueripper' | 'manual'
}

/** Why a text gave no TOC: no table, two discs' tables (one log at a time), or tracks missing. */
export type TocProblem = 'none' | 'several' | 'gaps'

// "    1  |  0:00.00 |  5:32.14 |         0    |    24913" (EAC and CUERipper; XLD prints 00:00:00)
const TOC_ROW = /^\s*(\d{1,2})\s*\|\s*[\d:.]+\s*\|\s*[\d:.]+\s*\|\s*(\d+)\s*\|\s*(\d+)\s*$/

/**
 * Reads the "TOC of the extracted CD" table of an EAC, XLD or CUERipper log. A last track that starts exactly 11400
 * sectors after the previous one ends is an Enhanced CD's data track. Says what went wrong when there is no one TOC.
 */
export function parseToc(text: string): ParsedToc | TocProblem {
  const rows: Array<{ track: number, start: number, end: number }> = []
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const match = line.match(TOC_ROW)
    if (match) rows.push({ track: Number(match[1]), start: Number(match[2]), end: Number(match[3]) })
  }
  if (!rows.length) return 'none'
  if (new Set(rows.map(row => row.track)).size !== rows.length) return 'several'
  rows.sort((a, b) => a.track - b.track)
  if (rows.some((row, index) => index > 0 && (row.track !== rows[index - 1]!.track + 1 || row.start <= rows[index - 1]!.start))) return 'gaps'

  const last = rows.at(-1)!
  const before = rows.at(-2)
  return {
    first_track: rows[0]!.track,
    last_track: last.track,
    leadout_offset: last.end + 1 + LEAD_IN,
    offsets: rows.map(row => row.start + LEAD_IN),
    data_track: before && last.start - before.end - 1 === SESSION_GAP ? last.track : null,
    source: /X Lossless Decoder/i.test(text) ? 'xld' : /CUERipper/i.test(text) ? 'cueripper' : /Exact Audio Copy/i.test(text) ? 'eac' : 'manual',
  }
}
