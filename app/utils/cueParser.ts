import { FRAMES_PER_SECOND, toSeconds } from '~/utils/discToc'

/** One audio track of a CUE sheet. */
export interface CueTrack {
  track_number: number
  title: string
  performer: string | null
  isrc: string | null
  /** Null when the sheet can't tell, see parseCue. */
  duration: number | null
}

export interface ParsedCue {
  title: string | null
  /** REM DISCNUMBER */
  disc_number: number | null
  tracks: CueTrack[]
}

/** The encodings a CUE sheet comes in; rippers on older Japanese and Chinese systems don't write UTF-8. */
export const CUE_ENCODINGS = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'utf-16le', label: 'UTF-16 LE' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
  { value: 'shift_jis', label: 'Shift-JIS' },
  { value: 'gbk', label: 'GBK' },
  { value: 'big5', label: 'Big5' },
  { value: 'euc-kr', label: 'EUC-KR' },
]

/** By its byte order mark, else UTF-8 if the bytes are valid UTF-8, else Shift-JIS, the likeliest for this catalogue. */
export function detectCueEncoding(bytes: Uint8Array): string {
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le'
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be'
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return 'utf-8'
  } catch {
    return 'shift_jis'
  }
}

export const decodeCue = (bytes: Uint8Array, encoding: string) => new TextDecoder(encoding).decode(bytes)

const value = (text: string) => (/^"(.*)"/.exec(text)?.[1] ?? text).trim()

/** Twelve characters without hyphens; anything else, such as the 000000000000 of some rippers, is no ISRC. */
const isrcOf = (text: string) => {
  const isrc = value(text).replace(/[-\s]/g, '').toUpperCase()
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc) ? isrc : null
}

/**
 * Reads a CUE sheet. A sheet only says where each track starts, so a track's length is the distance to the next
 * track's INDEX 01 in the same file, in whole seconds as everywhere (see toSeconds). That leaves no length for the last
 * track of a file: the end of the audio isn't in the sheet, and with one file per track none of them has one.
 * Data tracks are left out.
 */
export function parseCue(text: string): ParsedCue {
  const rows: (Omit<CueTrack, 'duration'> & { audio: boolean, file: number, start: number | null })[] = []
  let title: string | null = null
  let discNumber: number | null = null
  let file = 0

  for (const line of text.split(/\r\n|\r|\n/)) {
    const [, command, rest] = /^\s*(\S+)\s*(.*?)\s*$/.exec(line) ?? []
    if (!command) continue
    const row = rows.at(-1)
    switch (command.toUpperCase()) {
      case 'FILE':
        file++
        break
      case 'TRACK': {
        const [, number, type] = /^(\d+)\s+(\S+)/.exec(rest!) ?? []
        if (number) rows.push({ track_number: Number(number), title: '', performer: null, isrc: null, audio: type!.toUpperCase() === 'AUDIO', file, start: null })
        break
      }
      case 'TITLE':
        if (row) row.title = value(rest!)
        else title = value(rest!) || null
        break
      case 'PERFORMER':
        if (row) row.performer = value(rest!) || null
        break
      case 'ISRC':
        if (row) row.isrc = isrcOf(rest!)
        break
      case 'INDEX': {
        const [, index, minutes, seconds, frames] = /^(\d+)\s+(\d+):(\d+):(\d+)/.exec(rest!) ?? []
        if (row && Number(index) === 1) row.start = (Number(minutes) * 60 + Number(seconds)) * FRAMES_PER_SECOND + Number(frames)
        break
      }
      case 'REM': {
        const number = /^DISCNUMBER\s+"?(\d+)/i.exec(rest!)?.[1]
        if (number) discNumber = Number(number)
        break
      }
    }
  }

  const tracks = rows.flatMap(({ audio, file: rowFile, start, ...track }, index) => {
    if (!audio) return []
    const next = rows[index + 1]
    const known = next?.audio && next.file === rowFile && start !== null && next.start !== null && next.start > start
    return [{ ...track, duration: known ? toSeconds(next.start! - start!) : null }]
  })
  return { title, disc_number: discNumber || null, tracks }
}
