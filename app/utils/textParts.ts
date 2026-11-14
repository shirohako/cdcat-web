import { LinkifyIt } from 'linkify-it'

// Plain text cut at the addresses in it. Apart from utils/markdown.ts on purpose: that module brings the whole
// Markdown renderer with it, and a page that only shows a description as plain text (an album) has no use for one.

export interface TextPart {
  text: string
  href?: string
}

/** The finder the Markdown renderer has for bare addresses (markdown-it's `linkify`), set up as it is there. */
const linkify = new LinkifyIt()

/** Plain text cut at the addresses in it, found the way Markdown finds bare ones, for text that isn't Markdown. */
export function textParts(text: string): TextPart[] {
  const parts: TextPart[] = []
  let from = 0
  for (const match of linkify.match(text) ?? []) {
    if (match.index > from) parts.push({ text: text.slice(from, match.index) })
    parts.push({ text: match.text, href: match.url })
    from = match.lastIndex
  }
  if (from < text.length) parts.push({ text: text.slice(from) })
  return parts
}
