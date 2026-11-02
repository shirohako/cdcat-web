/**
 * Reading a CD table of contents as the album document stores it (docs/catalog/README.md#TOC 与 Disc ID): every track's
 * start sector including the 150-sector lead-in, a data track's too, and the disc's lead-out. The disc ids come from the
 * server (docs/catalog/disc-id.md); these helpers lay the TOC out the way EAC's log does, for the editor and album page.
 */
export interface DiscTocLike {
  first_track: number
  last_track: number
  leadout_offset: number
  offsets: number[]
  data_track: number | null
}

export interface DiscTocRow {
  track: number
  data: boolean
  /** Sector numbers as EAC prints them, without the lead-in. */
  start: number
  end: number
  length: number
}

export const LEAD_IN = 150
/** Between the end of an Enhanced CD's audio and its data track: lead-out, lead-in and the data track's pregap. */
export const SESSION_GAP = 11400
export const FRAMES_PER_SECOND = 75

/** Where the audio ends: before the gap to an Enhanced CD's data track, otherwise at the lead-out. */
export const audioLeadout = (toc: DiscTocLike) =>
  toc.data_track !== null && toc.data_track === toc.last_track && toc.offsets.length > 1
    ? toc.offsets.at(-1)! - SESSION_GAP
    : toc.leadout_offset

/** EAC's "TOC of the extracted CD" rows: start, end and length of every track, the data track marked. */
export function tocRows(toc: DiscTocLike): DiscTocRow[] {
  return toc.offsets.map((offset, index) => {
    const track = toc.first_track + index
    const next = index === toc.offsets.length - 1
      ? toc.leadout_offset
      : track + 1 === toc.data_track && toc.data_track === toc.last_track ? audioLeadout(toc) : toc.offsets[index + 1]!
    return { track, data: track === toc.data_track, start: offset - LEAD_IN, end: next - LEAD_IN - 1, length: next - offset }
  })
}

/** The audio tracks' rows, in order. */
export const audioRows = (toc: DiscTocLike) => tocRows(toc).filter(row => !row.data)

/** How long the audio plays, in frames. */
export const audioLength = (toc: DiscTocLike) => audioRows(toc).reduce((sum, row) => sum + row.length, 0)

/** A duration in whole seconds, as the tracklist stores it. */
export const toSeconds = (frames: number) => Math.round(frames / FRAMES_PER_SECOND)

/** m:ss.ff, frames after the dot, like EAC's Start and Length columns. */
export function formatFrames(frames: number): string {
  const seconds = Math.floor(frames / FRAMES_PER_SECOND)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}.${pad(frames % FRAMES_PER_SECOND)}`
}

/** Same disc, lead-out and starts: the same TOC, whatever its data track says (the server's natural key). */
export const sameToc = (a: DiscTocLike, b: DiscTocLike) =>
  a.leadout_offset === b.leadout_offset && a.offsets.length === b.offsets.length && a.offsets.every((offset, index) => offset === b.offsets[index])
