/** A tracklist pasted from a booklet, a shop page or VGMdb, split into discs and tracks. */
export interface ParsedDisc {
  position: number
  title: string | null
  tracks: ParsedTrack[]
}

export interface ParsedTrack {
  track_number: number
  /** Printed number when it is not a plain number, e.g. "A1" on vinyl */
  number_label: string | null
  title: string
  duration: number | null
}

const DISC_LINE = /^(?:disc|disk|cd|dvd|bd|blu-?ray|side)\s*(\d+)\s*(?:[:：\-–—.]\s*(.*))?$/i
const DURATION_AT_END = /[\s\t]*[([（]?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[)\]）]?\s*$/
// "1.", "01", "1)", "1-03", "M-1", "A1", "Tr.5" before the title
const NUMBER_AT_START = /^(?:tr(?:ack)?\.?\s*)?(?:(\d{1,2})[-.](\d{1,3})|([A-Za-z]{1,2}-?\d{1,3})|(\d{1,3}))(?:[.)．、:：]|\s)\s*/i

/** "3:45" → 225, "1:02:03" → 3723 */
export const parseDuration = (value: string): number | null => {
  const parts = value.split(':').map(Number)
  if (parts.some(Number.isNaN)) return null
  return parts.reduce((total, part) => total * 60 + part, 0)
}

export const formatDurationInput = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}

/**
 * Parses one track per line. "Disc 2", "CD2: Bonus" or a "2-01" number starts a new disc; a
 * trailing "3:45" (also in brackets) is the duration; letter numbers such as "A1" are kept as
 * the printed number. Lines without a number get the next number on their disc.
 */
export const parseTracklist = (text: string): ParsedDisc[] => {
  const discs: ParsedDisc[] = []
  const disc = (position: number, title: string | null = null) => {
    let found = discs.find(item => item.position === position)
    if (!found) {
      found = { position, title, tracks: [] }
      discs.push(found)
    } else if (title && !found.title) {
      found.title = title
    }
    return found
  }
  let current: ParsedDisc | null = null

  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    let line = raw.trim()
    if (!line) continue

    const discMatch = line.match(DISC_LINE)
    if (discMatch) {
      current = disc(Number(discMatch[1]), discMatch[2]?.trim() || null)
      continue
    }

    let duration: number | null = null
    const durationMatch = line.match(DURATION_AT_END)
    if (durationMatch && durationMatch.index! > 0) {
      duration = parseDuration(durationMatch[1]!)
      line = line.slice(0, durationMatch.index).trim()
    }

    let numberLabel: string | null = null
    let trackNumber: number | null = null
    const numberMatch = line.match(NUMBER_AT_START)
    if (numberMatch && line.length > numberMatch[0].length) {
      if (numberMatch[1] && numberMatch[2]) {
        current = disc(Number(numberMatch[1]))
        trackNumber = Number(numberMatch[2])
      } else if (numberMatch[3]) {
        numberLabel = numberMatch[3].toUpperCase()
      } else if (numberMatch[4]) {
        trackNumber = Number(numberMatch[4])
      }
      line = line.slice(numberMatch[0].length).trim()
    }
    if (!line) continue

    current ??= disc(1)
    const next = Math.max(0, ...current.tracks.map(track => track.track_number)) + 1
    current.tracks.push({ track_number: trackNumber ?? next, number_label: numberLabel, title: line, duration })
  }

  return discs.sort((a, b) => a.position - b.position)
}
