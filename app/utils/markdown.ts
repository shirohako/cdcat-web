import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import mark from 'markdown-it-mark'
import taskLists from 'markdown-it-task-lists'
import { mdT } from './markdownI18n'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type Token from 'markdown-it/lib/token.mjs'

export type MarkdownContainerName =
  | 'details'
  | 'info'
  | 'tip'
  | 'warning'
  | 'danger'
  | 'checklist'
  | 'steps'
  | 'spoiler'

export interface MarkdownContainerDefinition {
  name: MarkdownContainerName
  labelKey: string
  descriptionKey: string
  snippet: string
}

/** A user named by `@username`, as the API's `references.users` lists it (keyed by lowercase username). */
export interface MarkdownReferenceUser {
  id: number
  username: string
  nickname: string | null
  avatar_url: string | null
}

/** A post named by `::: quote post:ID`. */
export interface MarkdownReferencePost {
  id: number
  topic_id: number
  topic_title: string
  floor: number | null
  parent_floor: number | null
  user: { username: string, nickname: string | null } | null
  status: 'visible' | 'hidden' | 'deleted'
}

/** A database object named by `[[type:id]]`. Fields beyond `title` depend on the type. */
export interface MarkdownReferenceObject {
  type: MarkdownRefType
  id: number
  title: string
  image_url?: string | null
  date?: string | null
  kind?: string | null
  slug?: string | null
  album_id?: number
  album_title?: string | null
  event_series_id?: number | null
  replies_count?: number
  category?: { name: string } | null
  author?: { username: string, nickname: string | null } | null
}

export const MARKDOWN_REF_TYPES = ['album', 'artist', 'entry', 'franchise', 'event', 'track', 'topic', 'article'] as const
export type MarkdownRefType = typeof MARKDOWN_REF_TYPES[number]

/** The plural keys `references` groups objects under. */
export const MARKDOWN_REF_GROUPS: Record<MarkdownRefType, string> = {
  album: 'albums', artist: 'artists', entry: 'entries', franchise: 'franchises', event: 'events', track: 'tracks', topic: 'topics', article: 'articles',
}

export interface MarkdownReferences {
  users: Record<string, MarkdownReferenceUser>
  posts: Record<string, MarkdownReferencePost>
  [group: string]: Record<string, MarkdownReferenceUser | MarkdownReferencePost | MarkdownReferenceObject>
}

/**
 * The render context: summaries for the mentions, quotes and database tokens in the
 * source. Without it those render as plain text, a quote without its author line,
 * and grey "unavailable" tokens.
 */
export interface MarkdownEnv {
  references?: Partial<MarkdownReferences> | null
}

export const MARKDOWN_TEXT_COLORS = {
  slate: 'text-slate-600',
  red: 'text-rose-600',
  orange: 'text-orange-600',
  yellow: 'text-amber-600',
  green: 'text-emerald-600',
  blue: 'text-sky-600',
  purple: 'text-violet-600',
  pink: 'text-pink-600',
} as const

export const MARKDOWN_TEXT_SIZES = {
  small: 'text-xs',
  large: 'text-lg',
  xlarge: 'text-xl',
} as const

export const MARKDOWN_UNDERLINE_COLORS = {
  slate: 'markdown-underline-slate',
  red: 'markdown-underline-red',
  orange: 'markdown-underline-orange',
  yellow: 'markdown-underline-yellow',
  green: 'markdown-underline-green',
  blue: 'markdown-underline-blue',
  purple: 'markdown-underline-purple',
  pink: 'markdown-underline-pink',
} as const

export type MarkdownTextColor = keyof typeof MARKDOWN_TEXT_COLORS
export type MarkdownTextSize = keyof typeof MARKDOWN_TEXT_SIZES
export type MarkdownUnderlineColor = keyof typeof MARKDOWN_UNDERLINE_COLORS

/**
 * The authoring catalogue is shared by the renderer, CodeMirror completion and
 * the help page. Adding a container here makes every surface discover it.
 */
export const markdownContainers: readonly MarkdownContainerDefinition[] = [
  {
    name: 'details',
    labelKey: 'markdown.blocks.details.title',
    descriptionKey: 'markdown.blocks.details.description',
    snippet: '::: details ${title}\n${content}\n:::',
  },
  {
    name: 'info',
    labelKey: 'markdown.blocks.info.title',
    descriptionKey: 'markdown.blocks.info.description',
    snippet: '::: info ${title}\n${content}\n:::',
  },
  {
    name: 'tip',
    labelKey: 'markdown.blocks.tip.title',
    descriptionKey: 'markdown.blocks.tip.description',
    snippet: '::: tip ${title}\n${content}\n:::',
  },
  {
    name: 'warning',
    labelKey: 'markdown.blocks.warning.title',
    descriptionKey: 'markdown.blocks.warning.description',
    snippet: '::: warning ${title}\n${content}\n:::',
  },
  {
    name: 'danger',
    labelKey: 'markdown.blocks.danger.title',
    descriptionKey: 'markdown.blocks.danger.description',
    snippet: '::: danger ${title}\n${content}\n:::',
  },
  {
    name: 'checklist',
    labelKey: 'markdown.blocks.checklist.title',
    descriptionKey: 'markdown.blocks.checklist.description',
    snippet: '::: checklist ${title}\n- [x] ${completedTask}\n- [ ] ${pendingTask}\n:::',
  },
  {
    name: 'steps',
    labelKey: 'markdown.blocks.steps.title',
    descriptionKey: 'markdown.blocks.steps.description',
    snippet: '::: steps\n1. ${firstStep}\n2. ${secondStep}\n:::',
  },
  {
    name: 'spoiler',
    labelKey: 'markdown.blocks.spoiler.title',
    descriptionKey: 'markdown.blocks.spoiler.description',
    snippet: '::: spoiler ${title}\n${content}\n:::',
  },
] as const

const CALLOUTS = {
  info: { icon: 'i', classes: 'border-sky-200 bg-sky-50/80 text-sky-950', iconClasses: 'bg-sky-500 text-white' },
  tip: { icon: '✓', classes: 'border-emerald-200 bg-emerald-50/80 text-emerald-950', iconClasses: 'bg-emerald-500 text-white' },
  warning: { icon: '!', classes: 'border-amber-200 bg-amber-50/80 text-amber-950', iconClasses: 'bg-amber-500 text-white' },
  danger: { icon: '!', classes: 'border-rose-200 bg-rose-50/80 text-rose-950', iconClasses: 'bg-rose-500 text-white' },
} as const

function titleFrom(info: string, name: MarkdownContainerName) {
  return info.trim().slice(name.length).trim()
}

function fallbackTitle(name: MarkdownContainerName) {
  return mdT(`markdown.blocks.${name}.defaultTitle`)
}

/**
 * Shared safe Markdown renderer for published content and live previews. Not
 * exported: Nuxt auto-imports every export of `utils/`, and callers go through
 * `renderMarkdown` / `markdownHeadings` instead.
 */
const md = new MarkdownIt({
  // Community content must never be able to inject arbitrary elements or
  // attributes. Site-owned containers below emit the only custom HTML.
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
})

md.use(taskLists, { enabled: true, label: true, labelAfter: true })
md.use(mark)

/**
 * markdown-it-task-lists' `labelAfter` mode assumes an item has a single text
 * token. For nested Markdown it leaves the already-rendered tokens in place
 * and appends the complete source again as a raw label, duplicating content
 * (and bypassing Markdown escaping inside that label). Rebuild the label from
 * parsed inline tokens while retaining the plugin's checkbox/id structure.
 */
md.core.ruler.after('github-task-lists', 'psray_task_list_labels', (state) => {
  for (const token of state.tokens) {
    if (token.type !== 'inline' || !token.children?.length) continue

    const checkbox = token.children[0]
    const rawLabel = token.children[token.children.length - 1]
    if (
      checkbox?.type !== 'html_inline'
      || !checkbox.content.includes('task-list-item-checkbox')
      || rawLabel?.type !== 'html_inline'
      || !rawLabel.content.startsWith('<label class="task-list-item-label"')
    ) continue

    const id = /\sid="([^"]+)"/.exec(checkbox.content)?.[1]
    if (!id) continue

    const labelOpen = new state.Token('html_inline', '', 0)
    labelOpen.content = `<label class="task-list-item-label" for="${id}">`
    const labelClose = new state.Token('html_inline', '', 0)
    labelClose.content = '</label>'
    const labelChildren: typeof token.children = []
    state.md.inline.parse(token.content, state.md, state.env, labelChildren)
    token.children = [checkbox, labelOpen, ...labelChildren, labelClose]
  }
})

export interface MarkdownHeading {
  id: string
  text: string
  level: number
  /** 0-based source line the heading starts on, for jumping to it in the editor. */
  line: number
}

/** Keeps letters from every script, so Japanese, Korean and Chinese headings stay linkable. */
function slugify(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '')
}

/**
 * Every heading's anchor, numbered `slug-1`, `slug-2` on repeats. Computed from
 * the source alone, so a `#fragment` link works on the server-rendered HTML
 * rather than only after hydration.
 */
function collectHeadings(tokens: Token[]) {
  const used = new Map<string, number>()
  const headings: { token: Token, heading: MarkdownHeading }[] = []
  for (let index = 0; index < tokens.length; index += 1) {
    const opening = tokens[index]!
    if (opening.type !== 'heading_open') continue
    const inline = tokens[index + 1]
    if (inline?.type !== 'inline') continue
    const text = inline.children?.map(child => child.content).join('') || inline.content
    const base = slugify(text)
    if (!base) continue
    const seen = used.get(base) ?? 0
    used.set(base, seen + 1)
    headings.push({
      token: opening,
      heading: { id: seen === 0 ? base : `${base}-${seen}`, text, level: Number(opening.tag.slice(1)), line: opening.map?.[0] ?? 0 },
    })
  }
  return headings
}

md.core.ruler.push('psray_heading_ids', (state) => {
  for (const { token, heading } of collectHeadings(state.tokens)) {
    token.attrSet('id', heading.id)
  }
})

/**
 * A deliberately small, safe subset of Pandoc's bracketed-span attributes:
 *
 *   [text]{color=red}
 *   [text]{size=large}
 *   [**Markdown** text]{color=red size=large}
 *
 * Arbitrary HTML attributes and CSS values are never emitted. Both attribute
 * names and values must be present in the fixed maps above.
 */
function pandocSpanRule(state: StateInline, silent: boolean) {
  if (state.src[state.pos] !== '[') return false

  let squareDepth = 1
  let labelEnd = -1
  for (let index = state.pos + 1; index < state.src.length; index += 1) {
    if (state.src[index - 1] === '\\') continue
    if (state.src[index] === '[') squareDepth += 1
    if (state.src[index] !== ']') continue
    squareDepth -= 1
    if (squareDepth === 0) {
      labelEnd = index
      break
    }
    // Bound pathological nesting while still allowing links inside a span.
    if (squareDepth > 16) return false
  }

  if (labelEnd <= state.pos + 1 || state.src[labelEnd + 1] !== '{') return false
  const attributesEnd = state.src.indexOf('}', labelEnd + 2)
  if (attributesEnd < 0) return false

  const rawAttributes = state.src.slice(labelEnd + 2, attributesEnd)
  if (!rawAttributes || rawAttributes.includes('\n')) return false

  const classes: string[] = []
  const seen = new Set<string>()
  for (const attribute of rawAttributes.trim().split(/\s+/)) {
    const match = /^(color|size|underline)=([a-z]+)$/.exec(attribute)
    if (!match || seen.has(match[1]!)) return false
    const [kind, value] = match.slice(1) as ['color' | 'size' | 'underline', string]
    const className = kind === 'color'
      ? MARKDOWN_TEXT_COLORS[value as MarkdownTextColor]
      : kind === 'size'
        ? MARKDOWN_TEXT_SIZES[value as MarkdownTextSize]
        : MARKDOWN_UNDERLINE_COLORS[value as MarkdownUnderlineColor]
    if (!className) return false
    seen.add(kind)
    classes.push(`markdown-text-${kind}`, className)
  }
  if (classes.length === 0) return false

  if (!silent) {
    const opening = state.push('psray_span_open', 'span', 1)
    opening.attrSet('class', classes.join(' '))
    const innerTokens: StateInline['tokens'] = []
    state.md.inline.parse(
      state.src.slice(state.pos + 1, labelEnd),
      state.md,
      state.env,
      innerTokens,
    )
    state.tokens.push(...innerTokens)
    state.push('psray_span_close', 'span', -1)
  }
  state.pos = attributesEnd + 1
  return true
}

md.inline.ruler.before('link', 'psray_pandoc_span', pandocSpanRule)

/** Discord-style inline spoilers. The RichContent component owns reveal
 * interaction so the renderer stays deterministic for previews and SSR. */
function inlineSpoilerRule(state: StateInline, silent: boolean) {
  if (!state.src.startsWith('||', state.pos)) return false
  const end = state.src.indexOf('||', state.pos + 2)
  if (end <= state.pos + 2 || state.src.slice(state.pos + 2, end).includes('\n')) return false

  if (!silent) {
    const opening = state.push('psray_inline_spoiler_open', 'span', 1)
    opening.attrSet('class', 'markdown-inline-spoiler')
    opening.attrSet('role', 'button')
    opening.attrSet('tabindex', '0')
    opening.attrSet('aria-expanded', 'false')
    opening.attrSet('aria-label', mdT('markdown.inlineSpoiler.reveal'))

    const contentOpening = state.push('psray_inline_spoiler_content_open', 'span', 1)
    contentOpening.attrSet('class', 'markdown-inline-spoiler-content')
    const innerTokens: StateInline['tokens'] = []
    state.md.inline.parse(state.src.slice(state.pos + 2, end), state.md, state.env, innerTokens)
    state.tokens.push(...innerTokens)
    state.push('psray_inline_spoiler_content_close', 'span', -1)
    state.push('psray_inline_spoiler_close', 'span', -1)
  }
  state.pos = end + 2
  return true
}

// markdown-it intentionally does not treat `|` as an inline extension
// boundary. Keep its standard terminators and add `|` so the spoiler rule can
// inspect that position instead of having the whole sequence consumed as text.
const INLINE_TEXT_TERMINATORS = '\n!#$%&*+-:<=>@[\\]^_`{|}~'
md.inline.ruler.at('text', (state: StateInline, silent: boolean) => {
  let position = state.pos
  while (position < state.posMax && !INLINE_TEXT_TERMINATORS.includes(state.src[position]!)) position += 1
  if (position === state.pos) return false
  if (!silent) state.pending += state.src.slice(state.pos, position)
  state.pos = position
  return true
})
md.inline.ruler.before('emphasis', 'psray_inline_spoiler', inlineSpoilerRule)

/** Safe Pandoc-style image dimensions. A single dimension preserves the
 * intrinsic aspect ratio; providing both creates an explicit image box. */
// Run after task-list labels are rebuilt so images nested in a task item also
// receive their validated dimensions.
md.core.ruler.after('psray_task_list_labels', 'psray_image_dimensions', (state) => {
  for (const blockToken of state.tokens) {
    const children = blockToken.children
    if (!children) continue
    for (let index = 0; index < children.length - 1; index += 1) {
      const image = children[index]!
      const attributes = children[index + 1]!
      if (image.type !== 'image' || attributes.type !== 'text' || !attributes.content.startsWith('{')) continue

      const closing = attributes.content.indexOf('}')
      if (closing < 0) continue
      const declarations = attributes.content.slice(1, closing).trim().split(/\s+/)
      if (declarations.length === 0 || declarations.length > 2) continue

      const dimensions = new Map<'width' | 'height', string>()
      let valid = true
      for (const declaration of declarations) {
        const match = /^(width|height)=(\d{1,4})$/.exec(declaration)
        if (!match || dimensions.has(match[1] as 'width' | 'height')) {
          valid = false
          break
        }
        const value = Number(match[2])
        if (value < 1 || value > 4096) {
          valid = false
          break
        }
        dimensions.set(match[1] as 'width' | 'height', match[2]!)
      }
      if (!valid || dimensions.size === 0) continue

      image.attrJoin('class', 'markdown-sized-image')
      for (const [name, value] of dimensions) image.attrSet(name, value)
      attributes.content = attributes.content.slice(closing + 1)
      if (!attributes.content) children.splice(index + 1, 1)
    }
  }
})

interface ContainerRenderToken {
  nesting: number
  info: string
  type: string
  children?: { type: string, content: string }[] | null
}

function checklistStats(tokens: ContainerRenderToken[], openingIndex: number) {
  let completed = 0
  let total = 0
  const closingType = tokens[openingIndex]!.type.replace(/_open$/, '_close')
  for (let index = openingIndex + 1; index < tokens.length && tokens[index]!.type !== closingType; index += 1) {
    for (const child of tokens[index]!.children ?? []) {
      if (child.type !== 'html_inline' || !child.content.includes('task-list-item-checkbox')) continue
      total += 1
      if (/\schecked(?:="")?/.test(child.content)) completed += 1
    }
  }
  return { completed, total }
}

for (const definition of markdownContainers) {
  const { name } = definition
  md.use(container, name, {
    validate: (params: string) => {
      const token = params.trim().split(/\s+/, 1)[0]
      return token === name
    },
    render: (tokens: ContainerRenderToken[], idx: number) => {
      if (tokens[idx]!.nesting === -1) {
        if (name === 'details' || name === 'spoiler') return '</div></details>\n'
        if (name === 'steps') return '</div>\n'
        if (name === 'checklist') return '</div></div>\n'
        return '</div></div>\n'
      }

      const rawTitle = titleFrom(tokens[idx]!.info, name)
      const title = md.utils.escapeHtml(rawTitle || fallbackTitle(name))

      if (name === 'details' || name === 'spoiler') {
        const kind = name === 'spoiler' ? ' markdown-container-spoiler' : ''
        const icon = name === 'spoiler'
          ? '<span class="markdown-spoiler-icons" aria-hidden="true"><svg class="markdown-spoiler-eye markdown-spoiler-eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.06 12.35a1 1 0 0 1 0-.7C3.73 7.9 7.23 5.5 12 5.5s8.27 2.4 9.94 6.15a1 1 0 0 1 0 .7C20.27 16.1 16.77 18.5 12 18.5s-8.27-2.4-9.94-6.15Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="markdown-spoiler-eye markdown-spoiler-eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M6.7 6.7C4.6 8 3.1 9.8 2.1 12a1 1 0 0 0 0 .7c1.7 3.7 5.2 6.1 9.9 6.1 1.5 0 2.9-.2 4.1-.7"/><path d="M10.7 5.6c.4-.1.9-.1 1.3-.1 4.8 0 8.3 2.4 9.9 6.2a1 1 0 0 1 0 .7 12 12 0 0 1-2.1 3.1"/></svg></span>'
          : ''
        return `<details class="markdown-container markdown-container-details${kind}"><summary>${icon}<span>${title}</span></summary><div class="markdown-container-body">\n`
      }

      if (name === 'steps') {
        return `<div class="markdown-container markdown-container-steps" role="group" aria-label="${title}">\n`
      }

      if (name === 'checklist') {
        const { completed, total } = checklistStats(tokens, idx)
        const completeClass = total > 0 && completed === total ? ' is-complete' : ''
        const progressLabel = md.utils.escapeHtml(mdT('markdown.blocks.checklist.progress', { completed, total }))
        return `<div class="markdown-container markdown-container-checklist${completeClass}" role="group" aria-label="${title}"><div class="markdown-checklist-heading"><svg class="markdown-checklist-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><strong>${title}</strong><span class="markdown-checklist-progress" aria-live="polite" aria-label="${progressLabel}"><span class="markdown-checklist-progress-value">${completed} / ${total}</span></span></div><div class="markdown-checklist-body">\n`
      }

      const callout = CALLOUTS[name]
      return `<div class="markdown-container markdown-container-callout ${callout.classes}" role="note"><div class="markdown-container-heading"><span class="markdown-container-icon ${callout.iconClasses}" aria-hidden="true">${callout.icon}</span><strong>${title}</strong></div><div class="markdown-container-body">\n`
    },
  })
}

/*
 * Discussion syntax: `@username`, `::: quote post:ID` and `[[type:id]]`. The text
 * they show comes from the render context (`env.references`) the API returns with
 * every post, so server and browser render the same thing without extra requests.
 * markdown-it keeps link definitions in `env.references`, so the site's summaries
 * travel under a key of their own.
 */
interface RenderContext {
  cdcatReferences?: Partial<MarkdownReferences> | null
}

const escapeHtml = (value: unknown) => md.utils.escapeHtml(String(value ?? ''))
const referencesOf = (env: unknown) => (env as RenderContext | undefined)?.cdcatReferences ?? null

// A mention follows the start of the text, whitespace or punctuation, but not the
// punctuation inside URLs and e-mail addresses. The backend uses the same rule.
const MENTION_SKIP_AFTER = '/\\.:@#&=?%+~_-'
const MENTION = /^@([A-Za-z0-9_-]{1,32})(?![A-Za-z0-9_-])/

function mentionRule(state: StateInline, silent: boolean) {
  // `linkLevel` counts open links; the type definitions lack it. No mentions inside link text.
  if (state.src.charCodeAt(state.pos) !== 0x40 || (state as StateInline & { linkLevel: number }).linkLevel > 0) return false
  const previous = state.pos > 0 ? state.src[state.pos - 1]! : ''
  if (previous && (!/[\s\p{P}]/u.test(previous) || MENTION_SKIP_AFTER.includes(previous))) return false
  const match = MENTION.exec(state.src.slice(state.pos))
  if (!match) return false
  // Unknown users stay plain text.
  const user = referencesOf(state.env)?.users?.[match[1]!.toLowerCase()]
  if (!user) return false
  if (!silent) {
    const token = state.push('cdcat_mention', 'a', 0)
    token.meta = { user, written: match[1] }
  }
  state.pos += match[0].length
  return true
}

md.inline.ruler.before('emphasis', 'cdcat_mention', mentionRule)
md.renderer.rules.cdcat_mention = (tokens, idx) => {
  const { user, written } = tokens[idx]!.meta as { user: MarkdownReferenceUser, written: string }
  return `<a class="markdown-mention" href="/profile/${encodeURIComponent(user.username)}" title="${escapeHtml(user.nickname || user.username)}">@${escapeHtml(written)}</a>`
}

const REF = /^\[\[(album|artist|entry|series|event|track|topic|article):(\d{1,18})\]\]/

function refRule(state: StateInline, silent: boolean) {
  if (state.src.charCodeAt(state.pos) !== 0x5B || state.src.charCodeAt(state.pos + 1) !== 0x5B) return false
  const match = REF.exec(state.src.slice(state.pos))
  if (!match) return false
  if (!silent) {
    const token = state.push('cdcat_ref', 'a', 0)
    token.meta = { type: match[1], id: Number(match[2]) }
  }
  state.pos += match[0].length
  return true
}

md.inline.ruler.before('psray_pandoc_span', 'cdcat_ref', refRule)

// A token alone in its paragraph becomes a card. Paragraphs inside tight lists
// stay inline, so a list of tokens stays a list.
md.core.ruler.push('cdcat_ref_cards', (state) => {
  for (let index = state.tokens.length - 3; index >= 0; index -= 1) {
    const [opening, inline, closing] = [state.tokens[index]!, state.tokens[index + 1]!, state.tokens[index + 2]!]
    if (opening.type !== 'paragraph_open' || opening.hidden || inline.type !== 'inline' || closing.type !== 'paragraph_close') continue
    const content = (inline.children ?? []).filter(child => !(child.type === 'text' && !child.content.trim()) && child.type !== 'softbreak')
    if (content.length !== 1 || content[0]!.type !== 'cdcat_ref') continue
    const card = new state.Token('cdcat_ref_card', 'a', 0)
    card.block = true
    card.meta = content[0]!.meta
    card.map = opening.map
    state.tokens.splice(index, 3, card)
  }
})

const REF_ICONS: Record<MarkdownRefType, string> = {
  album: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/>',
  artist: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  entry: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
  franchise: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  event: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  track: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  topic: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  article: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
}

const refIcon = (type: MarkdownRefType, className: string) =>
  `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${REF_ICONS[type]}</svg>`

/** Where a database token links. Events have no page of their own; they open their series. */
export function markdownRefHref(type: MarkdownRefType, item: MarkdownReferenceObject): string {
  switch (type) {
    case 'album': return `/albums/${item.id}`
    case 'artist': return `/artists/${item.id}`
    case 'entry': return `/entries/${item.id}`
    case 'franchise': return `/franchises/${item.id}`
    case 'event': return item.event_series_id ? `/event-series/${item.event_series_id}` : '/events'
    case 'track': return item.album_id ? `/albums/${item.album_id}` : '/albums'
    case 'topic': return `/discussions/${item.id}`
    case 'article': return `/articles/${item.id}${item.slug ? `/${encodeURIComponent(item.slug)}` : ''}`
  }
}

function refItem(env: unknown, type: MarkdownRefType, id: number) {
  return referencesOf(env)?.[MARKDOWN_REF_GROUPS[type]]?.[String(id)] as MarkdownReferenceObject | undefined
}

const refTypeLabel = (type: MarkdownRefType) => mdT(`markdown.refs.types.${type}`)

function refMeta(type: MarkdownRefType, item: MarkdownReferenceObject) {
  if (type === 'track') return item.album_title ?? ''
  if (type === 'topic') return [item.category?.name, item.replies_count !== undefined ? mdT('markdown.refs.replies', { count: item.replies_count }) : ''].filter(Boolean).join(' · ')
  if (type === 'article') return [item.author?.nickname || item.author?.username, item.date].filter(Boolean).join(' · ')
  return item.date ?? ''
}

const httpsImage = (url: unknown): url is string => typeof url === 'string' && url.startsWith('https://')

function renderRef(tokens: Token[], idx: number, card: boolean, env: unknown) {
  const { type, id } = tokens[idx]!.meta as { type: MarkdownRefType, id: number }
  const item = refItem(env, type, id)
  if (!item) {
    const label = escapeHtml(mdT('markdown.refs.unavailable', { type: refTypeLabel(type), id }))
    return card ? `<p><span class="markdown-ref markdown-ref-missing">${label}</span></p>\n` : `<span class="markdown-ref markdown-ref-missing">${label}</span>`
  }
  const href = escapeHtml(markdownRefHref(type, item))
  if (!card) {
    return `<a class="markdown-ref markdown-ref-${type}" href="${href}">${refIcon(type, 'markdown-ref-icon')}${escapeHtml(item.title)}</a>`
  }
  const media = httpsImage(item.image_url)
    ? `<img src="${escapeHtml(item.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : refIcon(type, 'markdown-ref-card-icon')
  const meta = refMeta(type, item)
  return `<a class="markdown-ref-card markdown-ref-card-${type}" href="${href}"><span class="markdown-ref-card-media">${media}</span>`
    + `<span class="markdown-ref-card-body"><span class="markdown-ref-card-type">${escapeHtml(refTypeLabel(type))}</span>`
    + `<span class="markdown-ref-card-title">${escapeHtml(item.title)}</span>${meta ? `<span class="markdown-ref-card-meta">${escapeHtml(meta)}</span>` : ''}</span></a>\n`
}

md.renderer.rules.cdcat_ref = (tokens, idx, _options, env) => renderRef(tokens, idx, false, env)
md.renderer.rules.cdcat_ref_card = (tokens, idx, _options, env) => renderRef(tokens, idx, true, env)

// Quotes of other posts: the header names the author and floor and links to the
// post. The quoted text itself lives in the quoting post, so later edits or
// deletion of the original never change it.
md.use(container, 'quote', {
  validate: (params: string) => /^quote\s+post:\d{1,18}\s*$/.test(params.trim()),
  render: (tokens: ContainerRenderToken[], idx: number, _options: unknown, env: unknown) => {
    if (tokens[idx]!.nesting === -1) return '</div></blockquote>\n'
    const id = /post:(\d+)/.exec(tokens[idx]!.info)![1]!
    const post = referencesOf(env)?.posts?.[id]
    let header: string
    if (!post) {
      header = `<span class="markdown-quote-missing">${escapeHtml(mdT('markdown.quote.unavailable'))}</span>`
    }
    else if (post.status === 'deleted') {
      header = `<span class="markdown-quote-missing">${escapeHtml(mdT('markdown.quote.deleted'))}</span>`
    }
    else {
      const author = escapeHtml(post.user?.nickname || post.user?.username || mdT('markdown.quote.someone'))
      const where = post.floor ? `#${post.floor}` : post.parent_floor ? escapeHtml(mdT('markdown.quote.reply', { floor: post.parent_floor })) : ''
      header = `<a class="markdown-quote-source" href="/discussions/${post.topic_id}?post=${post.id}"><strong>${author}</strong>${where ? ` <span class="markdown-quote-floor">${where}</span>` : ''}</a>`
    }
    return `<blockquote class="markdown-quote" data-post="${id}"><div class="markdown-quote-header">${header}</div><div class="markdown-quote-body">\n`
  },
})

// External links open in a new tab and carry no endorsement; links within the
// site stay in the tab. markdown-it's built-in validateLink rejects javascript:,
// vbscript:, file: and unsafe data: URLs before this runs.
const isSiteLink = (href: string) => href.startsWith('/') && !href.startsWith('//')
const defaultLinkOpen = md.renderer.rules.link_open
  ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!
  if (!isSiteLink(token.attrGet('href') ?? '')) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'nofollow ugc noopener noreferrer')
  }
  return defaultLinkOpen(tokens, idx, options, env, self)
}

// Images load lazily and never tell the host which page shows them. Only https
// and site-relative addresses are shown; anything else stays as its alt text.
md.core.ruler.push('cdcat_image_policy', (state) => {
  for (const blockToken of state.tokens) {
    for (const [index, child] of (blockToken.children ?? []).entries()) {
      if (child.type !== 'image') continue
      const src = child.attrGet('src') ?? ''
      if (src.startsWith('https://') || isSiteLink(src)) continue
      const text = new state.Token('text', '', 0)
      text.content = child.content || src
      blockToken.children!.splice(index, 1, text)
    }
  }
})
const defaultImage = md.renderer.rules.image
  ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx]!.attrSet('loading', 'lazy')
  tokens[idx]!.attrSet('referrerpolicy', 'no-referrer')
  return defaultImage(tokens, idx, options, env, self)
}

/** Renders site Markdown; `env` supplies what mentions, quotes and database tokens point to. */
export const renderMarkdown = (src: string, env?: MarkdownEnv | null) =>
  md.render(src ?? '', { cdcatReferences: env?.references ?? null } satisfies RenderContext)

/**
 * The headings `renderMarkdown` gives ids to. Build a contents list from this
 * rather than a second parser, so every entry links to an anchor that exists.
 */
export function markdownHeadings(src: string): MarkdownHeading[] {
  return collectHeadings(md.parse(src ?? '', {})).map(entry => entry.heading)
}
