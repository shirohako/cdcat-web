/**
 * A tracklist pasted from a booklet, a shop page or a music database, split into discs and tracks. Only discs, numbers,
 * titles and durations are read: an artist printed beside each title is cut off and left out (粘贴人员表 is for people).
 *
 * The text goes through three lists of rules; a new format adds a rule to the list it needs, an example to
 * TRACKLIST_FORMATS (with editor.paste.<key>_title / <key>_points in every locale), and the tests read every example:
 *   1. LINE_RULES rewrite the lines before tracks are read: a number on a line of its own joins the line after it.
 *   2. LINE_READERS take a piece off one line, in order: the duration at the end, then the number at the start.
 *      A "Disc 2" heading is read before them.
 *   3. LIST_RULES look at every track at once: an artist beside every title, and which side of the dash it is on.
 */
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
  isrc?: string | null
  /** The artist cut off the title, only shown in the preview */
  artist?: string
}

/** Where the artist is in "A - B" lines: `left` for "Artist - Title", `right` for "Title - Artist", `none` keeps lines whole. */
export type ArtistSide = 'left' | 'right' | 'none'

export interface ParsedTracklist {
  discs: ParsedDisc[]
  /** Set when lines read "A - B": the side used, the side guessed, and whether the guess is clear */
  artists: { side: ArtistSide, guess: ArtistSide, sure: boolean } | null
}

/** The formats the paste dialog shows, each with an example (labels: editor.paste.<key>_title, <key>_points). */
export const TRACKLIST_FORMATS = [
  { key: 'numbers', text: '01. 星屑のアトラス 3:45\n02. 夜明けのプリズム (4:12)\n3) Moonlight Parade [5:01]\nTr.4 Ending\nおまけ 1:20' },
  { key: 'discs', text: 'Disc 1\n01. Opening\n02. Main Theme\n\nDisc 2: Bonus\n01. Opening (Instrumental)\n\n3-01 Live Medley\n3-02 Encore' },
  { key: 'title_artist', text: '1. Bipolar Singularity - Rmjesty (02:00)\n\n2. Moonset~Another side - Tiuro逍遥 & AivF (04:57)\n\n3. Moon Street - xuAlex5 (03:18)' },
  { key: 'artist_title', text: '1.samebeam - do you understand how i feel? 02:50\n2.kasumi - Lindo o aterrador 02:38\n3.rtmfrk - is it stuck in the past 01:44' },
  { key: 'number_lines', text: '1.\nsamebeam - do you understand how i feel? 02:50\n2.\nkasumi - Lindo o aterrador 02:38\n3.\n.｡*ﾟ+.*.Curren｡+ - Accelerate 02:56' },
] as const

// ---- reading one line ----

const DISC_LINE = /^(?:disc|disk|cd|dvd|bd|blu-?ray|side)\s*(\d+)\s*(?:[:：\-–—.]\s*(.*))?$/i
const DURATION_AT_END = /[\s\t]*[([（]?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[)\]）]?\s*$/
// "1.", "01", "1)", "1-03", "A1", "Tr.5" before the title
const NUMBER = String.raw`(?:tr(?:ack)?\.?\s*)?(?:(\d{1,2})[-.](\d{1,3})|([A-Za-z]{1,2}-?\d{1,3})|(\d{1,3}))`
const NUMBER_AT_START = new RegExp(String.raw`^${NUMBER}(?:[.)．、:：]|\s)\s*`, 'i')
const NUMBER_ONLY = new RegExp(String.raw`^${NUMBER}[.)．、:：]?$`, 'i')

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

/** One line on its way to a track: what is left of the text, and what the readers took off it. */
interface LineState {
  text: string
  duration: number | null
  /** Disc and track from "2-03", or the track alone */
  disc: number | null
  number: number | null
  label: string | null
}

type LineReader = (line: LineState) => void

/** A trailing "3:45", also in brackets; never the whole line. */
const readDuration: LineReader = (line) => {
  const match = line.text.match(DURATION_AT_END)
  if (!match || match.index! === 0) return
  line.duration = parseDuration(match[1]!)
  line.text = line.text.slice(0, match.index).trim()
}

/** "1.", "2-03" (disc 2), "A1" (kept as printed); never the whole line, so "1999" stays a title. */
const readNumber: LineReader = (line) => {
  const match = line.text.match(NUMBER_AT_START)
  if (!match || line.text.length <= match[0].length) return
  if (match[1] && match[2]) {
    line.disc = Number(match[1])
    line.number = Number(match[2])
  }
  else if (match[3]) {
    line.label = match[3].toUpperCase()
  }
  else if (match[4]) {
    line.number = Number(match[4])
  }
  line.text = line.text.slice(match[0].length).trim()
}

const LINE_READERS: LineReader[] = [readDuration, readNumber]

// ---- rewriting the lines first ----

type LineRule = (lines: string[]) => string[]

/** "10." on a line of its own and the title on the next: one line, unless the next line has a number of its own. */
const joinNumberLines: LineRule = (lines) => {
  const result: string[] = []
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!
    const next = lines[index + 1]
    if (NUMBER_ONLY.test(line) && next && !DISC_LINE.test(next) && !NUMBER_ONLY.test(next) && !NUMBER_AT_START.test(next)) {
      result.push(`${line} ${next}`)
      index++
    }
    else {
      result.push(line)
    }
  }
  return result
}

const LINE_RULES: LineRule[] = [joinNumberLines]

// ---- looking at every track ----

interface ListOptions {
  artistSide?: ArtistSide
}

type ListRule = (tracks: ParsedTrack[], options: ListOptions, result: ParsedTracklist) => void

/** " - ", " – ", " — " between an artist and a title */
const DASH = /\s+[-–—－]\s+/g
/** Written between two people, or before a voice actor */
const ARTIST_MARK = /\s(?:&|＆|×|feat\.?|ft\.)\s|[(（]CV/i
/** Written in titles: a subtitle after a wave dash, quotes, a version in brackets */
const TITLE_MARK = /[~～〜「『]|[([（][^)\]）]*\b(?:remix|mix|ver\.?|version|instrumental|inst\.?|off vocal|arrange|edit)\b/i

/** Rough printed width: CJK and full-width characters count twice. */
const width = (text: string) => [...text].reduce((sum, char) => sum + (/[\u2E80-\uFFEF]/u.test(char) ? 2 : 1), 0)
const fold = (text: string) => text.trim().toLowerCase()

/** The two ends of an "A - B" line: the artist on the left ends at the first dash, one on the right starts after the last. */
const ends = (title: string) => {
  const dashes = [...title.matchAll(DASH)]
  if (!dashes.length) return null
  const first = dashes[0]!
  const last = dashes.at(-1)!
  return {
    left: { artist: title.slice(0, first.index).trim(), title: title.slice(first.index + first[0].length).trim() },
    right: { artist: title.slice(last.index + last[0].length).trim(), title: title.slice(0, last.index).trim() },
  }
}

/**
 * An artist beside every title ("A - B" on at least two lines and four in five of them): each line votes for the side
 * that looks like the artist, a name that comes back on other lines, written with & or feat., the shorter side, the
 * side without a subtitle or a version; the guess is clear when nearly every line agrees.
 */
const cutArtists: ListRule = (tracks, options, result) => {
  const split = tracks.map(track => ends(track.title))
  const lines = split.filter(item => item !== null)
  if (!lines.length) return
  const suggested = lines.length >= 2 && lines.length >= tracks.length * 0.8

  const counts = (side: 'left' | 'right') => {
    const seen = new Map<string, number>()
    for (const line of lines) {
      for (const name of line[side].artist.split(/\s+(?:&|＆|×)\s+/)) seen.set(fold(name), (seen.get(fold(name)) ?? 0) + 1)
    }
    return seen
  }
  const repeated = { left: counts('left'), right: counts('right') }
  const comesBack = (side: 'left' | 'right', name: string) => name.split(/\s+(?:&|＆|×)\s+/).some(part => (repeated[side].get(fold(part)) ?? 0) > 1)

  let left = 0
  let right = 0
  for (const line of lines) {
    const [a, b] = [line.left.artist, line.right.artist]
    let vote = 0
    if (comesBack('left', a)) vote += 2
    if (comesBack('right', b)) vote -= 2
    if (ARTIST_MARK.test(a) || TITLE_MARK.test(b)) vote += 1
    if (ARTIST_MARK.test(b) || TITLE_MARK.test(a)) vote -= 1
    if (width(a) * 4 < width(b) * 3) vote += 1
    if (width(b) * 4 < width(a) * 3) vote -= 1
    if (vote > 0) left++
    if (vote < 0) right++
  }
  const guess: ArtistSide = !suggested ? 'none' : left > right ? 'left' : 'right'
  const sure = guess !== 'none' && Math.max(left, right) >= 0.8 * lines.length && Math.min(left, right) <= 0.1 * lines.length
  const side = options.artistSide ?? guess
  result.artists = { side, guess, sure }
  if (side === 'none') return

  tracks.forEach((track, index) => {
    const parts = split[index]?.[side]
    if (!parts?.title || !parts.artist) return
    track.title = parts.title
    track.artist = parts.artist
  })
}

const LIST_RULES: ListRule[] = [cutArtists]

// ---- the whole text ----

/**
 * Reads one track per line. "Disc 2", "CD2: Bonus" or a "2-01" number starts a new disc; letter numbers such as "A1"
 * are kept as the printed number; lines without a number get the next number on their disc.
 */
export const readTracklist = (text: string, options: ListOptions = {}): ParsedTracklist => {
  const result: ParsedTracklist = { discs: [], artists: null }
  const discs = result.discs
  const disc = (position: number, title: string | null = null) => {
    let found = discs.find(item => item.position === position)
    if (!found) {
      found = { position, title, tracks: [] }
      discs.push(found)
    }
    else if (title && !found.title) {
      found.title = title
    }
    return found
  }
  let current: ParsedDisc | null = null

  const lines = LINE_RULES.reduce((all, rule) => rule(all), text.replace(/\r\n?/g, '\n').split('\n').map(line => line.trim()).filter(Boolean))
  for (const raw of lines) {
    const discMatch = raw.match(DISC_LINE)
    if (discMatch) {
      current = disc(Number(discMatch[1]), discMatch[2]?.trim() || null)
      continue
    }

    const line: LineState = { text: raw, duration: null, disc: null, number: null, label: null }
    for (const read of LINE_READERS) read(line)
    if (!line.text) continue

    if (line.disc !== null) current = disc(line.disc)
    current ??= disc(1)
    const next = Math.max(0, ...current.tracks.map(track => track.track_number)) + 1
    current.tracks.push({ track_number: line.number ?? next, number_label: line.label, title: line.text, duration: line.duration })
  }

  const tracks = discs.flatMap(item => item.tracks)
  for (const rule of LIST_RULES) rule(tracks, options, result)
  discs.sort((a, b) => a.position - b.position)
  return result
}

/** The discs alone, as read with the artist side guessed. */
export const parseTracklist = (text: string): ParsedDisc[] => readTracklist(text).discs
