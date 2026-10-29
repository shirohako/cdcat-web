/**
 * Example responses for the API reference (/docs/api), written as values so they are always valid JSON. `$more` marks
 * what an example leaves out, as an object key or as an array item of its own (`{ $more: … }`):
 * - `true`: something more, shown as "…"
 * - a number: that many more items
 * - a model name: the rest is that model, linked to its definition
 */
export type JsonExample = null | boolean | number | string | JsonExample[] | { [key: string]: JsonExample }

export type JsonMore = true | number | string

export interface JsonToken {
  type: 'key' | 'string' | 'number' | 'literal' | 'punct' | 'more'
  text: string
  /** For `more` tokens: what was left out. */
  more?: JsonMore
}

export interface JsonLine {
  depth: number
  tokens: JsonToken[]
}

const MORE = '$more'
/** Objects and arrays of plain values this short stay on one line; a fixed width, so server and browser agree. */
const INLINE_WIDTH = 56

const isPlain = (value: JsonExample): value is null | boolean | number | string => value === null || typeof value !== 'object'
const isMore = (value: JsonExample): value is { $more: JsonMore } =>
  !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 1 && MORE in value

const plainToken = (value: null | boolean | number | string): JsonToken =>
  value === null || typeof value === 'boolean' ? { type: 'literal', text: String(value) }
    : typeof value === 'number' ? { type: 'number', text: String(value) }
      : { type: 'string', text: JSON.stringify(value) }

const punct = (text: string): JsonToken => ({ type: 'punct', text })
const keyTokens = (key: string): JsonToken[] => [{ type: 'key', text: JSON.stringify(key) }, punct(': ')]
const moreToken = (more: JsonMore): JsonToken => ({ type: 'more', text: '…', more })

/**
 * A flat value fits on one line: a plain value, a list of plain values, or an object of plain values and such lists,
 * short enough and without markers.
 */
function inlineTokens(value: JsonExample, nested = false): JsonToken[] | null {
  if (isPlain(value)) return [plainToken(value)]
  const list = Array.isArray(value)
  const entries = list ? value.map(item => [null, item] as const) : Object.entries(value)
  const tokens: JsonToken[] = [punct(list ? '[' : entries.length ? '{ ' : '{')]
  for (const [index, [key, item]] of entries.entries()) {
    if (key === MORE) return null
    // Objects may hold flat lists; lists hold plain values only.
    const inner = isPlain(item) ? [plainToken(item)] : !list && !nested && Array.isArray(item) ? inlineTokens(item, true) : null
    if (!inner) return null
    if (index) tokens.push(punct(', '))
    if (key !== null) tokens.push(...keyTokens(key))
    tokens.push(...inner)
  }
  tokens.push(punct(list ? ']' : entries.length ? ' }' : '}'))
  return tokens.reduce((width, token) => width + token.text.length, 0) <= INLINE_WIDTH ? tokens : null
}

/** The example as indented lines of typed tokens, for a highlighted code block. */
export function jsonExampleLines(value: JsonExample): JsonLine[] {
  const lines: JsonLine[] = []
  const walk = (item: JsonExample, depth: number, prefix: JsonToken[], comma: boolean) => {
    const end = comma ? [punct(',')] : []
    if (isMore(item)) {
      lines.push({ depth, tokens: prefix.length ? [...prefix, punct('{ '), moreToken(item.$more), punct(' }'), ...end] : [moreToken(item.$more)] })
      return
    }
    const inline = inlineTokens(item)
    if (inline) {
      lines.push({ depth, tokens: [...prefix, ...inline, ...end] })
      return
    }
    const list = Array.isArray(item)
    const entries = list ? item.map(child => [null, child] as const) : Object.entries(item as Record<string, JsonExample>)
    lines.push({ depth, tokens: [...prefix, punct(list ? '[' : '{')] })
    entries.forEach(([key, child], index) => {
      if (key === MORE) {
        lines.push({ depth: depth + 1, tokens: [moreToken(child as JsonMore)] })
        return
      }
      // A marker after an item keeps the item's comma: something follows it.
      walk(child, depth + 1, key === null ? [] : keyTokens(key), index < entries.length - 1)
    })
    lines.push({ depth, tokens: [punct(list ? ']' : '}'), ...end] })
  }
  walk(value, 0, [], false)
  return lines
}

/** The example without its markers, as the JSON a reader copies. */
export function jsonExampleText(value: JsonExample): string {
  const clean = (item: JsonExample): JsonExample => {
    if (isPlain(item)) return item
    if (Array.isArray(item)) return item.filter(child => !isMore(child)).map(clean)
    return Object.fromEntries(Object.entries(item).filter(([key]) => key !== MORE).map(([key, child]) => [key, clean(child)]))
  }
  return JSON.stringify(clean(value), null, 2)
}
