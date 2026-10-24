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
