// A credit list pasted into the album editor, from a booklet, a shop page or VGMdb, split into roles,
// names and tracks:
//
//   作曲・編曲：ミナト（M1–M3）、Yuki（M4）     roles before the colon, names after it, tracks in brackets
//   Vocal：ルナ（CV：星野あかり）              a voice actor is the person, the character goes in the printed name
//   Bass：Yuki（5弦）                         other brackets that are no track list become the detail
//   Vocal：Gardens feat. moon jelly（M2）      who comes after feat. / ft. (or in "(feat. …)") is a 客串
//   Artist：しゅーりん × MoAE:.（M10）         two people; × & vs. only part names
//   01. 星屑のアトラス                         a track's own block: the lines under it, up to a blank line, are that track's
//   M-01.                                      the same in a VGMdb note (Music&Lyric: …, Guitar&Bass: … under it)
//   M1.プリズムにさよならを                    lines indented under a heading stay that track's across blank lines; text with
//      Vocal:つぐ&るる                         a blank line after every line ends a block only at a longer gap. "つぐ&るる":
//                                              & between Japanese names parts two people
//   Disc 2                                     numbers after it are on disc 2
//   Composer: ESTIMATE, LLC. (02-09, 11-13)    a company suffix after a comma (LLC., Inc., Co., Ltd.) stays with the name
//   Composer: 《ESTIMATE, LLC.》 (02-09)        so does what 《》「」『』〈〉“” wrap, the quotes taken off
//   艺术家:A(1.1)、黒魔feat.B(1.2)、             1.2 is disc 1, track 2; feat. may touch a Japanese name; a list that wraps
//   C(2.1)、D                                   goes on under a line ending in a separator, or under one starting with
//   (2.2)、E(2.3)                               the brackets or separator of the name before
//   设计-CD Design: A                           a role, then the job title as printed (credits.role_label)
//   custom-Comic: B                             the same under the role 其他, for titles no role stands for
//
// Role words are looked up by the caller (the role dictionary's names and other spellings); matching the
// names to artists is the dialog's business.

export interface TrackRef {
  disc: number
  number: number
}

export interface ParsedCreditName {
  name: string
  /** What the brackets after the name held when it was no track list, e.g. "5弦" */
  detail: string | null
  /** With a voice actor as `name`: the character they voice, "ルナ" in "ルナ（CV：星野あかり）" */
  character?: string
  /** The tracks given, 'all' for 全曲, or null for none: then the whole album, or the track whose block it is in. */
  tracks: TrackRef[] | 'all' | null
  /** Written after "feat." / "ft.": a 客串, credited as such rather than in the line's roles. */
  featuring?: boolean
  /** On a 客串: the index in the line's names of who it belongs to, the name right before the feat. */
  host?: number
  /** On the first of several people split from one written name ("A & B"): that name and how many it became */
  unit?: { name: string, size: number }
}

export interface ParsedCreditLine {
  /** The line's number in the pasted text, from 1 */
  line: number
  /** The role words as written, e.g. "作曲・編曲" */
  roleText: string
  roles: string[]
  /** Role words no role goes by */
  unknown: string[]
  /** The job title as printed, after "设计-" or "custom-" */
  roleLabel: string | null
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
  comp: ['composer'], arr: ['arranger'], arrange: ['arranger'], lyric: ['lyricist'], rec: ['recording'],
  作編曲: ['composer', 'arranger'], 作詞作曲: ['lyricist', 'composer'], 詞曲: ['lyricist', 'composer'],
}

/**
 * The name a new artist takes: a Japanese or Chinese name without the spaces between its characters (上杉 悟 →
 * 上杉悟), as the server's lookup and the harvest review take them for one person.
 */
export const newArtistName = (name: string) => name.trim().replace(/(?<=[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}ー々〆])[\s\u3000]+(?=[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}ー々〆])/gu, '')

/** A role word as the lookup compares it: full-width forms, case, spaces and dots don't count. */
export const foldRoleWord = (word: string) => word.normalize('NFKC').toLowerCase().replace(/[\s.。・]/g, '')

/** The role "custom-…" files a job title under. */
export const CUSTOM_ROLE = 'other'
const CUSTOM_WORD = 'custom'
/** "设计-CD Design", split at the first hyphen, so the title may hold more of them ("custom-Re-Mastering"). */
const ROLE_AND_LABEL = /^(.+?)\s*[-－]\s*(.+)$/

const DISC_LINE = /^(?:disc|disk|cd|dvd|bd)\s*[-#.]?\s*(\d{1,2})\b/i
/** "M-01." as VGMdb notes write a track's block: M with a hyphen or dot before the number too. */
const TRACK_LINE = /^(?:m[-.]?|tr\.?|track|#|no\.?)?\s*(\d{1,3})(?:[.．:：)）、\]\s-]|$)/i
const TRACK_ITEM = /^(?:m[-.]?|tr\.?|track|#|no\.?)?\s*(\d{1,3})(?:\s*[-–—~〜～]\s*(?:m[-.]?|tr\.?|track|#|no\.?)?\s*(\d{1,3}))?$/i
/**
 * "2-03": a disc and a zero-padded track number, as VGMdb writes them, rather than a range. Past track 9 only the
 * padding of the others in the list tells them apart: "2-03, 2-12" is disc 2, "4, 8-10" a range.
 */
const DISC_TRACK_ITEM = /^(\d)-(\d{2})$/
const PADDED_DISC_TRACK_ITEM = /^\d-0\d$/
/** "1.5" and "1.5-1.8": a disc and a track number. */
const DISC_DOT_ITEM = /^(\d{1,2})\.(\d{1,3})(?:[-–—~〜～](?:\1\.)?(\d{1,3}))?$/
const ALL_TRACKS = /^(?:全曲|全て|すべて|全部|all(?:\s*tracks)?)$/i
const BRACKETS: Record<string, string> = { '（': '）', '(': ')', '［': '］', '[': ']', '【': '】' }
/** Quotes around one name, "《ESTIMATE, LLC.》": nothing inside is split, and they are taken off the name. */
const QUOTES: Record<string, string> = { '《': '》', '「': '」', '『': '』', '〈': '〉', '“': '”' }
/** Brackets and quotes: no name is split inside either. */
const GROUPS: Record<string, string> = { ...BRACKETS, ...QUOTES }

/** "《A》" → "A", when the quotes wrap the whole name. */
function unquote(name: string): string {
  const close = QUOTES[name[0] ?? '']
  if (!close || !name.endsWith(close) || name.length < 3) return name
  const inner = name.slice(1, -1)
  return inner.includes(name[0]!) || inner.includes(close) ? name : inner.trim()
}
/**
 * The word before a 客串: "A feat. B", "A ft. B", "A featuring B", also "A feat.B" as booklets sometimes print it, and
 * "黒魔feat.B" with no space after a Japanese name or a closing bracket. Latin letters need the space: "Swift.B".
 */
const FEATURING_WORD = /(?:\s+|(?<=[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}ー々〆）)］\]】》」』〉”]))(?:(?:feat|ft)\.\s*|(?:feat|featuring)\s+)/giu
/** A bracket that holds the 客串 instead of a detail: "A (feat. B)". */
const FEATURING_BRACKET = /^(?:(?:feat|ft)\.\s*|(?:feat|featuring)\s+)(.+)$/i
/**
 * Between two people of one written name: "A & B", "A × B", "A x B", "A vs. B" with spaces, "A×B", or "つぐ&るる" between
 * Japanese names. "A&B" in Latin letters stays one name, as names like that are common (M&M).
 */
const COLLAB_WORD = /\s+(?:[&＆×xX]|vs\.?|VS\.?)\s+|×|(?<=[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}ー])[&＆](?=[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}])/gu

/**
 * A bracket that holds a voice actor: "CV.A", "CV:A", "CV A", "C.V. A", or "CV遠藤" with nothing between before a
 * Japanese name. Several people (with a separator) stay a detail.
 */
const VOICE_BRACKET = /^(?:CV|ＣＶ|C\.V|Ｃ．Ｖ)(?:[.．:：]\s*|\s+|(?=[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}]))([^、，,／/;；]+)$/iu

/** How a voice actor's credit is printed: 紅葉谷希美(CV:遠藤ゆりか). */
export const voiceCredit = (character: string, actor: string) => `${character}(CV:${actor})`

/** "M1, M3–M5" as track numbers on the disc; null when it is no track list. */
function parseTracks(text: string, disc: number): TrackRef[] | 'all' | null {
  const value = text.trim()
  if (ALL_TRACKS.test(value)) return 'all'
  const items = value.split(/\s*[,，、;；/／]\s*|\s+/).filter(Boolean)
  if (!items.length) return null
  const refs: TrackRef[] = []
  const padded = items.some(item => PADDED_DISC_TRACK_ITEM.test(item))
  for (const item of items) {
    const discTrack = padded ? item.match(DISC_TRACK_ITEM) : null
    if (discTrack) {
      refs.push({ disc: Number(discTrack[1]), number: Number(discTrack[2]) })
      continue
    }
    const dotted = item.match(DISC_DOT_ITEM)
    if (dotted) {
      const first = Number(dotted[2])
      const last = dotted[3] ? Number(dotted[3]) : first
      if (!first || last < first || last - first > 200) return null
      for (let number = first; number <= last; number++) refs.push({ disc: Number(dotted[1]), number })
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

/** What follows a comma in a company's name rather than another name: "ESTIMATE, LLC.", "Foo Co., Ltd." */
const COMPANY_SUFFIX = /^(?:LLC|L\.L\.C|LLP|Inc|Ltd|Limited|Co|Corp|Corporation|PLC|GmbH|AG|S\.?A|S\.?L|B\.?V|Pty|K\.?K)\.?(?=$|[\s（(［[【])/i

/** Splits at the separators outside brackets: "A（M1、M2）、B" is two names, "ESTIMATE, LLC." one. */
function splitNames(text: string): string[] {
  const parts: string[] = []
  const closing: string[] = []
  let current = ''
  for (const char of text) {
    if (GROUPS[char]) closing.push(GROUPS[char]!)
    else if (char === closing[closing.length - 1]) closing.pop()
    if (!closing.length && /[、，,／/;；]/.test(char)) {
      parts.push(current)
      current = ''
    }
    else current += char
  }
  parts.push(current)
  return parts.map(part => part.trim()).filter(Boolean).reduce<string[]>((names, part) => {
    if (names.length && COMPANY_SUFFIX.test(part)) names[names.length - 1] += `, ${part}`
    else names.push(part)
    return names
  }, [])
}

/**
 * A name with its brackets taken off the end: track lists become tracks, "(feat. B)" the 客串 in `featured`,
 * "(CV.B)" the voice actor in `voice`, anything else the detail.
 */
function parseName(text: string, disc: number): ParsedCreditName & { featured: string[], voice?: string } {
  let name = text
  const details: string[] = []
  const featured: string[] = []
  let voice: string | undefined
  let tracks: ParsedCreditName['tracks'] = null
  for (;;) {
    const match = name.match(/[（(［[【]([^（(［[【）)］\]】]*)[）)］\]】]\s*$/)
    if (!match || match.index === undefined || match.index === 0) break
    const inside = match[1]!.trim()
    const asTracks = parseTracks(inside, disc)
    const asFeaturing = inside.match(FEATURING_BRACKET)
    const asVoice = inside.match(VOICE_BRACKET)
    if (asTracks && tracks === null) tracks = asTracks
    else if (asFeaturing) featured.unshift(asFeaturing[1]!.trim())
    else if (asVoice && !voice) voice = unquote(asVoice[1]!.trim())
    else if (inside) details.unshift(inside)
    name = name.slice(0, match.index).trim()
  }
  return { name, detail: details.join(' ') || null, tracks, featured, voice }
}

/** Splits at the matches outside brackets. */
function splitAt(text: string, pattern: RegExp): string[] {
  const pieces: string[] = []
  let start = 0
  for (const match of text.matchAll(pattern)) {
    let depth = 0
    for (const char of text.slice(0, match.index)) {
      if (GROUPS[char]) depth++
      else if (depth && Object.values(GROUPS).includes(char)) depth--
    }
    if (depth) continue
    pieces.push(text.slice(start, match.index).trim())
    start = match.index + match[0].length
  }
  pieces.push(text.slice(start).trim())
  return pieces.filter(Boolean)
}

/**
 * One written name, the people in it and the 客串 it brings: "A × B feat. C（M2）" is A and B, then C as B's 客串.
 * A 客串 belongs to the name right before its feat.; "A feat. X & B feat. Y" is A with X, B with Y (a name just before
 * a later feat. leads again), "A (feat. X)" is A with X. `host` counts from `offset`, the names of the line before
 * this one. The tracks are written at the end, so a name without its own takes the last ones given; each detail
 * stays with the name it follows.
 */
function parseNames(text: string, disc: number, offset = 0): ParsedCreditName[] {
  const names: ParsedCreditName[] = []
  const parts = splitAt(text, FEATURING_WORD)
  let host: number | undefined
  parts.forEach((part, partIndex) => {
    const { featured, voice, ...parsed } = parseName(part, disc)
    // With a voice actor the person is the actor, and all that was written before the bracket is the character.
    const people = voice ? [voice] : splitAt(parsed.name, COLLAB_WORD).map(unquote)
    const guests = featured.flatMap(other => splitAt(other, COLLAB_WORD)).map(unquote)
    people.forEach((person, index) => {
      const last = index === people.length - 1
      const leads = partIndex === 0 || (last && partIndex < parts.length - 1)
      names.push({
        name: person,
        detail: last ? parsed.detail : null,
        tracks: parsed.tracks,
        ...(voice ? { character: unquote(parsed.name) } : {}),
        ...(leads ? {} : { featuring: true, host }),
        ...(index === 0 && people.length > 1 ? { unit: { name: unquote(parsed.name), size: people.length } } : {}),
      })
      if (leads) host = offset + names.length - 1
    })
    // "(feat. X)" belongs to the name the bracket follows, else to who leads
    const before = names.at(-1)?.featuring ? host : offset + names.length - 1
    guests.forEach(guest => names.push({ name: guest, detail: null, tracks: null, featuring: true, host: before }))
  })
  const tracks = names.findLast(name => name.tracks !== null)?.tracks ?? null
  return names.map(name => ({ ...name, tracks: name.tracks ?? tracks }))
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

/** A line without its indent and list bullet. */
const bare = (raw: string) => raw.trim().replace(/^[-*•·]\s*/, '')

/** How a wrapped name list carries on from the line before: at a separator, a track bracket or a feat. */
function startsAsTail(line: string): boolean {
  if (/^[、，,／/;；]/.test(line) || /^(?:feat|ft)\./i.test(line)) return true
  const bracket = line.match(/^[（(［[【]([^）)］\]】]*)[）)］\]】]/)
  return !!bracket && parseTracks(bracket[1]!, 1) !== null
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
  /** One role and a job title for it. A role whose own name has a hyphen (Co-Producer) stays that role. */
  const labelled = (left: string) => {
    const [, word, roleLabel] = lookup(left).length ? [] : left.match(ROLE_AND_LABEL) ?? []
    if (!word || !roleLabel) return null
    const roles = foldRoleWord(word) === CUSTOM_WORD ? [CUSTOM_ROLE] : lookup(word)
    return roles.length === 1 ? { roles, roleLabel } : null
  }
  const rolesIn = (line: string) => {
    const colon = roleColon(line)
    const left = colon > 0 ? line.slice(0, colon).trim() : ''
    const label = labelled(left)
    if (label) return { colon, left, ...label, unknown: [] as string[] }
    const words = left ? left.split(/\s*[・/／&＆,，、+＋]\s*|\s+(?:and|&)\s+/i).map(word => word.trim()).filter(Boolean) : []
    return { colon, left, roles: [...new Set(words.flatMap(lookup))], roleLabel: null, unknown: words.filter(word => !lookup(word).length) }
  }
  const lines: ParsedCreditLine[] = []
  const skipped: number[] = []
  let disc = 1
  let track: number | null = null
  // A list that wrapped is put back on one line, numbered as its first
  const rows: { raw: string, number: number }[] = []
  text.split(/\r?\n/).forEach((raw, index) => {
    const before = rows.at(-1)
    const previous = before ? bare(before.raw) : ''
    const line = bare(raw)
    const wraps = line && roleColon(previous) > 0 && !DISC_LINE.test(line) && !rolesIn(line).roles.length
      && (/(?:[、，,／/;；]|\b(?:feat|ft)\.)$/i.test(previous) || startsAsTail(line))
    if (wraps) before!.raw = before!.raw.trimEnd() + raw.trim()
    else rows.push({ raw, number: index + 1 })
  })
  // Text copied with a blank line after every line (no two lines next to each other) ends a block only at a longer
  // gap than that.
  const gaps: number[] = []
  let run = -1
  for (const { raw } of rows) {
    if (raw.trim()) {
      if (run >= 0) gaps.push(run)
      run = 0
    }
    else if (run >= 0) run++
  }
  const spacing = gaps.length && gaps.every(gap => gap > 0) ? Math.min(...gaps) : 0
  let blanks = 0
  // How far the open track's heading is indented; lines indented further stay in its block.
  let headingIndent = 0
  const indentOf = (raw: string) => raw.match(/^[ \t\u3000]*/)![0].replace(/\t/g, '    ').length

  rows.forEach(({ raw, number }) => {
    const line = bare(raw)
    if (!line) {
      blanks++
      return
    }
    // A blank line ends a track's block: the whole album's staff usually follows the tracks.
    if (blanks > spacing && indentOf(raw) <= headingIndent) track = null
    blanks = 0
    const discHeading = line.match(DISC_LINE)
    const { colon, left, roles, roleLabel, unknown } = rolesIn(line)

    // A line naming no known role may be a disc or a track heading: "Disc 2", "01. Title", "M1 Title: Subtitle".
    if (!roles.length) {
      if (discHeading && (colon < 0 || !unknown.length)) {
        disc = Number(discHeading[1])
        track = null
        headingIndent = 0
        return
      }
      const heading = line.match(TRACK_LINE)
      if (heading && (colon < 0 || unknown.length)) {
        track = Number(heading[1])
        headingIndent = indentOf(raw)
        return
      }
    }
    if (colon <= 0 || left.length > 40) {
      skipped.push(number)
      return
    }
    // Every name parseNames gives has text, so the hosts' indexes hold across the line
    const names = splitNames(line.slice(colon + 1)).reduce<ParsedCreditName[]>((all, part) => [...all, ...parseNames(part, disc, all.length)], [])
      .map(name => ({ ...name, tracks: name.tracks ?? (track === null ? null : [{ disc, number: track }]) }))
    if (!names.length) {
      skipped.push(number)
      return
    }
    lines.push({ line: number, roleText: left, roles, roleLabel, unknown, names })
  })
  return { lines, skipped }
}
