// A credit list pasted into the album editor, from a booklet, a shop page or VGMdb, split into roles,
// names and tracks:
//
//   作曲・編曲：ミナト（M1–M3）、Yuki（M4）     roles before the colon, names after it, tracks in brackets
//   Vocal：ルナ（CV：星野あかり）              brackets that are no track list become the detail
//   01. 星屑のアトラス                         a track's own block: the lines under it, up to a blank line, are that track's
//   Disc 2                                     numbers after it are on disc 2
//
// Role words are looked up by the caller (the role dictionary's names and other spellings); matching the
// names to artists is the dialog's business.

export interface TrackRef {
  disc: number
  number: number
}

export interface ParsedCreditName {
  name: string
  /** What the brackets after the name held when it was no track list, e.g. "CV：星野あかり" */
  detail: string | null
  /** The tracks given, 'all' for 全曲, or null for none: then the whole album, or the track whose block it is in. */
  tracks: TrackRef[] | 'all' | null
}

export interface ParsedCreditLine {
  /** The line's number in the pasted text, from 1 */
  line: number
  /** The role words as written, e.g. "作曲・編曲" */
  roleText: string
  roles: string[]
  /** Role words no role goes by */
  unknown: string[]
  names: ParsedCreditName[]
}

export interface ParsedCredits {
  lines: ParsedCreditLine[]
  /** Numbers of the lines that were neither credits, tracks nor discs */
  skipped: number[]
}

/** Shorthands booklets use that the role dictionary doesn't list, folded (see foldRoleWord). */
export const ROLE_SHORTHANDS: Record<string, string[]> = {
  vo: ['vocals'], vox: ['vocals'], 唄: ['vocals'], 歌唱: ['vocals'], cho: ['chorus'],
  gt: ['guitar'], gtr: ['guitar'], ba: ['bass'], dr: ['drums'], ds: ['drums'], key: ['keyboards'], kb: ['keyboards'],
  pf: ['piano'], vn: ['violin'], vln: ['violin'], str: ['strings'], prog: ['programming'],
  comp: ['composer'], arr: ['arranger'], arrange: ['arranger'], lyric: ['lyricist'], rec: ['recording_engineer'],
  作編曲: ['composer', 'arranger'], 作詞作曲: ['lyricist', 'composer'], 詞曲: ['lyricist', 'composer'],
}

/** A role word as the lookup compares it: full-width forms, case, spaces and dots don't count. */
export const foldRoleWord = (word: string) => word.normalize('NFKC').toLowerCase().replace(/[\s.。・]/g, '')

const DISC_LINE = /^(?:disc|disk|cd|dvd|bd)\s*[-#.]?\s*(\d{1,2})\b/i
const TRACK_LINE = /^(?:m|tr\.?|track|#|no\.?)?\s*(\d{1,3})(?:[.．:：)）、\]\s-]|$)/i
const TRACK_ITEM = /^(?:m|tr\.?|track|#|no\.?)?\s*(\d{1,3})(?:\s*[-–—~〜～]\s*(?:m|tr\.?|track|#|no\.?)?\s*(\d{1,3}))?$/i
/** "2-03": a disc and a zero-padded track number, as VGMdb writes them, rather than a range. */
const DISC_TRACK_ITEM = /^(\d)-(\d{2})$/
const ALL_TRACKS = /^(?:全曲|全て|すべて|全部|all(?:\s*tracks)?)$/i
const BRACKETS: Record<string, string> = { '（': '）', '(': ')', '［': '］', '[': ']', '【': '】' }

/** "M1, M3–M5" as track numbers on the disc; null when it is no track list. */
function parseTracks(text: string, disc: number): TrackRef[] | 'all' | null {
  const value = text.trim()
  if (ALL_TRACKS.test(value)) return 'all'
  const items = value.split(/\s*[,，、;；/／]\s*|\s+/).filter(Boolean)
  if (!items.length) return null
  const refs: TrackRef[] = []
  for (const item of items) {
    const discTrack = item.match(DISC_TRACK_ITEM)
    if (discTrack) {
      refs.push({ disc: Number(discTrack[1]), number: Number(discTrack[2]) })
      continue
    }
    const match = item.match(TRACK_ITEM)
    if (!match) return null
    const from = Number(match[1])
    const to = match[2] ? Number(match[2]) : from
    if (to < from || to - from > 200) return null
    for (let number = from; number <= to; number++) refs.push({ disc, number })
  }
  return refs
}

/** Splits at the separators outside brackets: "A（M1、M2）、B" is two names. */
function splitNames(text: string): string[] {
  const parts: string[] = []
  const closing: string[] = []
  let current = ''
  for (const char of text) {
    if (BRACKETS[char]) closing.push(BRACKETS[char]!)
    else if (char === closing[closing.length - 1]) closing.pop()
    if (!closing.length && /[、，,／/;；]/.test(char)) {
      parts.push(current)
      current = ''
    }
    else current += char
  }
  parts.push(current)
  return parts.map(part => part.trim()).filter(Boolean)
}

/** A name with its brackets taken off the end: track lists become tracks, anything else the detail. */
function parseName(text: string, disc: number): ParsedCreditName {
  let name = text
  const details: string[] = []
  let tracks: ParsedCreditName['tracks'] = null
  for (;;) {
    const match = name.match(/[（(［[【]([^（(［[【）)］\]】]*)[）)］\]】]\s*$/)
    if (!match || match.index === undefined || match.index === 0) break
    const inside = match[1]!.trim()
    const asTracks = parseTracks(inside, disc)
    if (asTracks && tracks === null) tracks = asTracks
    else if (inside) details.unshift(inside)
    name = name.slice(0, match.index).trim()
  }
  return { name, detail: details.join(' ') || null, tracks }
}

/** The colon that ends the role words: the first one outside brackets. */
function roleColon(line: string): number {
  let depth = 0
  for (let index = 0; index < line.length; index++) {
    const char = line[index]!
    if (BRACKETS[char]) depth++
    else if (depth && Object.values(BRACKETS).includes(char)) depth--
    else if (!depth && (char === ':' || char === '：')) return index
  }
  return -1
}

/**
 * Reads a pasted credit list. `rolesOf` gives the role keys a folded role word stands for (none when it is not
 * one); ROLE_SHORTHANDS are tried after it.
 */
export function parseCredits(text: string, rolesOf: (folded: string) => string[]): ParsedCredits {
  const lookup = (word: string) => {
    const folded = foldRoleWord(word)
    const found = rolesOf(folded)
    return found.length ? found : ROLE_SHORTHANDS[folded] ?? []
  }
  const lines: ParsedCreditLine[] = []
  const skipped: number[] = []
  let disc = 1
  let track: number | null = null

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim().replace(/^[-*•·]\s*/, '')
    // A blank line ends a track's block: the whole album's staff usually follows the tracks.
    if (!line) {
      track = null
      return
    }
    const discHeading = line.match(DISC_LINE)
    const colon = roleColon(line)
    const left = colon > 0 ? line.slice(0, colon).trim() : ''
    const words = left ? left.split(/\s*[・/／&＆,，、+＋]\s*|\s+(?:and|&)\s+/i).map(word => word.trim()).filter(Boolean) : []
    const roles = [...new Set(words.flatMap(lookup))]
    const unknown = words.filter(word => !lookup(word).length)

    // A line naming no known role may be a disc or a track heading: "Disc 2", "01. Title", "M1 Title: Subtitle".
    if (!roles.length) {
      if (discHeading && (colon < 0 || !unknown.length)) {
        disc = Number(discHeading[1])
        track = null
        return
      }
      const heading = line.match(TRACK_LINE)
      if (heading && (colon < 0 || unknown.length)) {
        track = Number(heading[1])
        return
      }
    }
    if (colon <= 0 || left.length > 40) {
      skipped.push(index + 1)
      return
    }
    const names = splitNames(line.slice(colon + 1)).map(part => parseName(part, disc))
      .filter(name => name.name)
      .map(name => ({ ...name, tracks: name.tracks ?? (track === null ? null : [{ disc, number: track }]) }))
    if (!names.length) {
      skipped.push(index + 1)
      return
    }
    lines.push({ line: index + 1, roleText: left, roles, unknown, names })
  })
  return { lines, skipped }
}
