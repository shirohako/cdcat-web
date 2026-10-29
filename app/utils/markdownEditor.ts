import type { MarkdownContainerName, MarkdownTextColor, MarkdownTextSize, MarkdownUnderlineColor } from './markdown'
import { mdT } from './markdownI18n'

/** The syntax guide the editor's help banner links to. */
export const MARKDOWN_GUIDE_URL = '/docs/markdown'

/** One completion offered after `@` or `[[`; `apply` is the text that replaces the typed query. */
export interface MarkdownCompletionItem {
  label: string
  detail?: string | null
  apply: string
  image?: string | null
}

/** Supplies completions: `mention` after `@`, `ref` after `[[` (the query may start with `type:`). */
export type MarkdownCompleter = (kind: 'mention' | 'ref', query: string) => Promise<MarkdownCompletionItem[]>

/** Site paths that paste as database tokens, by their first path segment. */
const SITE_PATHS: Record<string, string> = {
  albums: 'album', artists: 'artist', entries: 'entry', franchises: 'franchise', discussions: 'topic', articles: 'article',
}

/** Hosts whose page addresses count as the site's own, besides the current one. */
export const MARKDOWN_SITE_HOSTS = ['cdcat.net', 'www.cdcat.net', 'dev.cdcat.net']

/**
 * A pasted address of an album, artist, entry, series, topic or article page becomes
 * `[[type:id]]`. Relative paths and the site's own hosts qualify; anything else
 * returns null and pastes as usual.
 */
export function siteUrlToToken(text: string | null | undefined, currentHost = ''): string | null {
  const value = (text ?? '').trim()
  if (!value || /\s/.test(value)) return null
  let path = value
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      if (url.host !== currentHost && !MARKDOWN_SITE_HOSTS.includes(url.host)) return null
      path = url.pathname
    }
    catch {
      return null
    }
  }
  else if (!value.startsWith('/')) {
    return null
  }
  const match = /^\/(albums|artists|entries|series|discussions|articles)\/(\d+)(?:\/[^/?#]*)?(?:[?#].*)?$/.exec(path)
  return match ? `[[${SITE_PATHS[match[1]!]}:${match[2]}]]` : null
}

/**
 * The text "quote" inserts: the quoted post (or the selected part of it) without
 * the quotes nested inside, trimmed to `maxLength`, in a `::: quote post:ID` block.
 * The fence grows past any `:::` run in the text so inner blocks cannot close it.
 */
export function markdownQuote(postId: number, raw: string, maxLength = 1000) {
  const lines: string[] = []
  const stack: number[] = []
  let quoteDepth = 0
  for (const line of raw.replace(/\r\n/g, '\n').split('\n')) {
    const opening = /^ {0,3}(:{3,})\s*([a-z]+)/i.exec(line)
    const closing = /^ {0,3}(:{3,})\s*$/.exec(line)
    if (opening) {
      stack.push(opening[1]!.length)
      if (opening[2]!.toLowerCase() === 'quote' || quoteDepth > 0) quoteDepth += 1
      if (quoteDepth > 0) continue
    }
    else if (closing && stack.length && closing[1]!.length >= stack[stack.length - 1]!) {
      stack.pop()
      if (quoteDepth > 0) {
        quoteDepth -= 1
        continue
      }
    }
    else if (quoteDepth > 0) {
      continue
    }
    lines.push(line)
  }
  let text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (Array.from(text).length > maxLength) text = `${Array.from(text).slice(0, maxLength).join('').trimEnd()}…`
  const longest = Math.max(2, ...[...text.matchAll(/^ {0,3}(:{3,})/gm)].map(match => match[1]!.length))
  const fence = ':'.repeat(longest + 1)
  return `${fence} quote post:${postId}\n${text}\n${fence}\n\n`
}

export type MarkdownEditAction =
  | 'heading'
  | 'bold'
  | 'italic'
  | 'strike'
  | 'mark'
  | 'inlineSpoiler'
  | 'quote'
  | 'link'
  | 'image'
  | 'bulletList'
  | 'taskList'
  | 'code'

export interface MarkdownEditResult {
  text: string
  selectionFrom: number
  selectionTo: number
}

function replaceRange(source: string, from: number, to: number, replacement: string, selectionStart: number, selectionLength: number): MarkdownEditResult {
  return {
    text: source.slice(0, from) + replacement + source.slice(to),
    selectionFrom: from + selectionStart,
    selectionTo: from + selectionStart + selectionLength,
  }
}

function selectedOr(value: string, fallback: string) {
  return value || fallback
}

/** Pure text transforms used by the toolbar and covered without a DOM. */
export function applyMarkdownEdit(source: string, from: number, to: number, action: MarkdownEditAction): MarkdownEditResult {
  const selected = source.slice(from, to)

  const wrap = (before: string, after: string, fallback: string) => {
    const body = selectedOr(selected, fallback)
    return replaceRange(source, from, to, `${before}${body}${after}`, before.length, body.length)
  }

  switch (action) {
    case 'bold': return wrap('**', '**', mdT('markdown.editor.placeholders.text'))
    case 'italic': return wrap('*', '*', mdT('markdown.editor.placeholders.text'))
    case 'strike': return wrap('~~', '~~', mdT('markdown.editor.placeholders.text'))
    case 'mark': return wrap('==', '==', mdT('markdown.editor.placeholders.text'))
    case 'inlineSpoiler': return wrap('||', '||', mdT('markdown.editor.placeholders.text'))
    case 'link': {
      const label = selectedOr(selected, mdT('markdown.editor.placeholders.linkText'))
      const url = 'https://'
      return replaceRange(source, from, to, `[${label}](${url})`, label.length + 3, url.length)
    }
    case 'image': {
      const alt = selectedOr(selected, mdT('markdown.editor.placeholders.imageAlt'))
      const url = 'https://'
      return replaceRange(source, from, to, `![${alt}](${url})`, alt.length + 4, url.length)
    }
    case 'code': {
      if (selected.includes('\n')) return wrap('```\n', '\n```', mdT('markdown.editor.placeholders.code'))
      return wrap('`', '`', mdT('markdown.editor.placeholders.code'))
    }
    case 'heading':
    case 'quote':
    case 'bulletList':
    case 'taskList': {
      const prefix = {
        heading: '## ',
        quote: '> ',
        bulletList: '- ',
        taskList: '- [ ] ',
      }[action]
      const body = selectedOr(selected, mdT('markdown.editor.placeholders.text'))
      const replacement = body.split('\n').map(line => `${prefix}${line}`).join('\n')
      return replaceRange(source, from, to, replacement, prefix.length, body.length)
    }
  }
}

/** Wrap selected inline text in a safe, allow-listed Pandoc-style span. */
export function applyMarkdownTextStyle(
  source: string,
  from: number,
  to: number,
  kind: 'color' | 'size' | 'underline',
  value: MarkdownTextColor | MarkdownTextSize | MarkdownUnderlineColor,
): MarkdownEditResult {
  const selected = selectedOr(source.slice(from, to), mdT('markdown.editor.placeholders.text'))
  const replacement = selected
    .split('\n')
    .map(line => line ? `[${line}]{${kind}=${value}}` : line)
    .join('\n')
  return replaceRange(source, from, to, replacement, 1, selected.length)
}

export function markdownContainerSnippet(name: MarkdownContainerName, content = '') {
  const title = mdT('markdown.editor.placeholders.title')
  const body = content || mdT('markdown.editor.placeholders.content')
  if (name === 'steps') {
    return `::: steps\n1. ${mdT('markdown.editor.placeholders.firstStep')}\n2. ${mdT('markdown.editor.placeholders.secondStep')}\n:::`
  }
  if (name === 'checklist') {
    const items = content
      ? content.split('\n').map(line => /^\s*- \[[ xX]\]\s/.test(line) ? line : `- [ ] ${line}`).join('\n')
      : `- [x] ${mdT('markdown.editor.placeholders.completedTask')}\n- [ ] ${mdT('markdown.editor.placeholders.pendingTask')}`
    return `::: checklist ${title}\n${items}\n:::`
  }
  return `::: ${name} ${title}\n${body}\n:::`
}
