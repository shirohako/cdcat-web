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

/** Cuts text to `max` characters, at a space when one is near the end, and adds "…". */
export function truncateText(text: string, max: number) {
  const chars = [...text]
  if (chars.length <= max) return text
  let cut = chars.slice(0, max - 1).join('')
  const space = cut.lastIndexOf(' ')
  if (space > cut.length * 0.7) cut = cut.slice(0, space)
  return `${cut.replace(/[\s,.;:，、。；：]+$/u, '')}…`
}

/** The generated sentence, then as much of the user's text as fits. */
export function composeDescription(lead: string, text: string, max: number) {
  const gap = /[。！？]$/u.test(lead) ? '' : ' '
  return truncateText([lead, text].filter(Boolean).join(gap), max)
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

