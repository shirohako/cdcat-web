/** A disc TOC as the album document stores it (docs/catalog/README.md#TOC); the Disc IDs are computed by the server. */
export interface ParsedToc {
  first_track: number
  last_track: number
  /** Lead-out in absolute sectors, including the 150-sector lead-in */
  leadout_offset: number
  /** Track start offsets in absolute sectors, including the lead-in */
  offsets: number[]
  source: 'eac' | 'xld' | 'manual'
}

const LEAD_IN = 150
// "    1  |  0:00.00 |  5:32.14 |         0    |    24913" (EAC; XLD prints 00:00:00)
const TOC_ROW = /^\s*(\d{1,2})\s*\|\s*[\d:.]+\s*\|\s*[\d:.]+\s*\|\s*(\d+)\s*\|\s*(\d+)\s*$/

/**
 * Reads the "TOC of the extracted CD" table of an EAC or XLD log. Only audio sessions are
 * supported: for enhanced CDs with a data track, remove the data track's row first.
 * Returns null when the text has no TOC table.
 */
export const parseToc = (text: string): ParsedToc | null => {
  const rows: Array<{ track: number, start: number, end: number }> = []
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const match = line.match(TOC_ROW)
    if (match) rows.push({ track: Number(match[1]), start: Number(match[2]), end: Number(match[3]) })
  }
  if (!rows.length) return null
  rows.sort((a, b) => a.track - b.track)
  if (rows.some((row, index) => index > 0 && row.track !== rows[index - 1]!.track + 1)) return null

  return {
    first_track: rows[0]!.track,
    last_track: rows.at(-1)!.track,
    leadout_offset: rows.at(-1)!.end + 1 + LEAD_IN,
    offsets: rows.map(row => row.start + LEAD_IN),
    source: /X Lossless Decoder/i.test(text) ? 'xld' : /Exact Audio Copy/i.test(text) ? 'eac' : 'manual',
  }
}
