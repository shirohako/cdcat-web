/** Meta description lengths: Latin script fits about 160 characters in a result snippet, CJK about 120. */
export const descriptionLength = (locale: string) => (locale === 'en' ? 160 : 120)

/**
 * Markdown as one line of plain text for meta descriptions: no markup, links and spans as their text, no
 * images, code blocks or database tokens. Spoilers become `spoiler` (nothing by default).
 */
export function plainText(markdown: string | null | undefined, { spoiler = '' } = {}) {
  if (!markdown) return ''
  return markdown
    .replace(/:::+\s*spoiler[\s\S]*?:::+/g, spoiler)
    .replace(/\|\|.+?\|\|/g, spoiler)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[\[[a-z]+:\d+\]\]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\{[^}]*\}/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*:::+.*$/gm, ' ')
    .replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~`=|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Plain text (no Markdown in it) as one line for meta descriptions. */
export const oneLine = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim()

/**
 * Cuts text to `max` characters and adds "…", so as not to split a word or name: Latin-script text at a space near
 * the end, CJK text at a 、 or 。 a few characters back. CJK runs on without spaces; going back to the last one (in a
 * romanized name) would throw away a good part of a description.
 */
export function truncateText(text: string, max: number) {
  const chars = [...text]
  if (chars.length <= max) return text
  let cut = chars.slice(0, max - 1).join('')
  if (textLanguage(cut) === 'en') {
    const space = cut.lastIndexOf(' ')
    if (space > cut.length * 0.7) cut = cut.slice(0, space)
  } else {
    const stop = Math.max(...['、', '。', '，', '；'].map(mark => cut.lastIndexOf(mark)))
    if (stop > cut.length - 6 && stop > cut.length * 0.7) cut = cut.slice(0, stop)
  }
  return `${cut.replace(/[\s,.;:，、。；：]+$/u, '')}…`
}

/** Two sentences as one text: no space after a CJK full stop, one otherwise. */
const joinSentences = (first: string, second: string) => (first && second ? `${first}${/[。！？]$/u.test(first) ? '' : ' '}${second}` : first || second)

/** The generated sentence, then as much of the user's text as fits. */
export function composeDescription(lead: string, text: string, max: number) {
  return truncateText(joinSentences(lead, text), max)
}

/**
 * One part of a description built by `fillDescription`:
 * - a string: a sentence that goes in whole or not at all;
 * - `{ cut: text }`: a member's text, whole when it fits, else cut with "…" to fill the room left, which then
 *   ends the description (given at least `MIN_CUT` characters: a few words of it say nothing);
 * - a function: given the characters left, writes what fits in them (a list of titles, see `fitList`);
 * - nothing (`''`, `0`, `false`, null): skipped.
 */
export type DescriptionPart = string | { cut: string } | ((room: number) => string) | 0 | false | null | undefined

/** The fewest characters of a member's text worth cutting it to. */
export const MIN_CUT = 16

const charLength = (text: string) => [...text].length

/**
 * A meta description from parts in order of importance, filled up to `max` characters. Search engines flag short
 * descriptions (Bing asks for about a line), so a page says what it can about the subject instead of stopping at
 * the first sentence. The first part always goes in, cut if it must be; a later sentence that doesn't fit is left
 * out and the next ones still get their chance, so the description ends on a full stop where it can.
 */
export function fillDescription(parts: DescriptionPart[], max: number) {
  let text = ''
  for (const part of parts) {
    if (!part) continue
    const gap = !text || /[。！？]$/u.test(text) ? 0 : 1
    const room = max - charLength(text) - gap
    if (room <= 0) break
    if (typeof part === 'object') {
      if (!part.cut) continue
      if (charLength(part.cut) <= room) text = joinSentences(text, part.cut)
      else if (room >= MIN_CUT || !text) return truncateText(joinSentences(text, part.cut), max)
      continue
    }
    const sentence = typeof part === 'function' ? part(room) : part
    if (!sentence) continue
    if (charLength(sentence) <= room) text = joinSentences(text, sentence)
    else if (!text) return truncateText(sentence, max)
  }
  return text
}

/**
 * The longest `format(names)` that fits in `room` characters, with the names in order: as many as fit, at most
 * `limit`. `format` gets them joined and whether any were left out (to say "and more"). Empty when not even the
 * first one fits.
 */
export function fitList(
  names: Array<string | null | undefined>,
  room: number,
  format: (joined: string, more: boolean) => string,
  separator: string,
  limit = Infinity,
) {
  const unique = [...new Set(names.filter((name): name is string => !!name))]
  for (let n = Math.min(unique.length, limit); n > 0; n--) {
    const text = format(unique.slice(0, n).join(separator), n < unique.length)
    if (charLength(text) <= room) return text
  }
  return ''
}

/** A shown name with the original in the locale's brackets when they differ. */
export function nameWithOriginal(shown: string, original: string | null | undefined, format: (name: string, original: string) => string) {
  return original && original !== shown ? format(shown, original) : shown
}

/**
 * The language a text is written in, judged by its script: hiragana means Japanese, hangul Korean, Chinese
 * characters without them Chinese, Latin letters English. A script counts only when a fair share of the text is in
 * it, so a title quoted in another script doesn't tip the answer. Null when there is nothing to go by (digits, symbols).
 */
export function textLanguage(text: string): 'ja' | 'ko' | 'zh' | 'en' | null {
  const count = (pattern: RegExp) => text.match(pattern)?.length ?? 0
  const hiragana = count(/[\u3041-\u309f]/g)
  const katakana = count(/[\u30a0-\u30ff]/g)
  const hangul = count(/[\uac00-\ud7af]/g)
  const han = count(/[\u4e00-\u9fff]/g)
  const latin = count(/[A-Za-z]/g)
  const cjk = hiragana + katakana + hangul + han
  if (!cjk) return latin ? 'en' : null
  // English that names a work or two in their own script: letters well outnumber the characters (a character
  // carries about as much as three letters).
  if (latin > cjk * 3) return 'en'
  if (hangul > cjk * 0.3) return 'ko'
  // Japanese prose can't do without hiragana; katakana alone is often a title quoted in a Chinese sentence, and
  // counts only when it is most of the text.
  if (hiragana > cjk * 0.1 || katakana > cjk * 0.5) return 'ja'
  return 'zh'
}

/**
 * Whether a text reads as written in the interface language (zh-Hans and zh-Hant are both Chinese). A description
 * shown to search engines in one language shouldn't trail off into another, so members' text joins the generated
 * sentence only when this holds. Text with no telling script passes.
 */
export function writtenIn(text: string, locale: string) {
  const language = textLanguage(text)
  return !language || language === locale.slice(0, 2)
}


/**
 * A track that is another version of one already listed (an instrumental, off vocal or karaoke take): left out
 * of a description's track list, where it would only repeat a title.
 */
export const isAlternateTake = (title: string) => /\b(?:inst(?:rumental)?|off[\s-]?vocal|karaoke)\b|カラオケ|オフボーカル|伴奏/iu.test(title)

/**
 * The names credited, as printed (credited_as, else the artist's name), most credits first and in the order they
 * first appear among equals, without the names in `skip` (the album's byline, already said).
 */
export function creditedNames(credits: Array<{ credited_as: string | null, artist: { name: string } | null }>, skip: Iterable<string> = []) {
  const left = new Set(skip)
  const counts = new Map<string, number>()
  for (const credit of credits) {
    const name = credit.credited_as || credit.artist?.name
    if (name && !left.has(name)) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  // Map keeps first appearance order and the sort is stable, so equals stay in it.
  return [...counts].sort((a, b) => b[1] - a[1]).map(([name]) => name)
}
