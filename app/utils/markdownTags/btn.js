// {% btn %} tag
//
// Syntax:
//   {% btn 'url',text,icon,extra_args %}
//
// Parameters:
//   url        (required) link href — may be wrapped in single quotes
//   text       (required) button label
//   icon       (optional) CSS class string for icon element, e.g. "far fa-star"
//   extra_args (optional) space-separated modifiers:
//     color    — default | blue | pink | red | purple | orange | green
//     style    — outline
//     layout   — block
//     position — center | right  (requires block)
//     size     — larger
//
// Examples:
//   {% btn 'https://example.com/',Click me,far fa-star,blue larger %}
//   {% btn 'https://example.com/',Docs,,outline block center %}

export const name = 'btn'

export function render(argsStr) {
  const { url, text, icon, color, outline, block, larger, pos } = parseArgs(argsStr)
  return buildHtml({ url, text, icon, color, outline, block, larger, pos })
}

const COLORS = ['blue', 'pink', 'red', 'purple', 'orange', 'green']

const COLOR_MAP = {
  default: 'btn-primary',
  blue: 'btn-info',
  pink: 'btn-pink',
  red: 'btn-error',
  purple: 'btn-secondary',
  orange: 'btn-warning',
  green: 'btn-success',
}

function parseArgs(argsStr) {
  const parts = argsStr.split(',')
  const url = (parts[0] ?? '').trim().replace(/^'|'$/g, '')
  const text = (parts[1] ?? '').trim()
  const icon = (parts[2] ?? '').trim()
  const extra = parts.slice(3).join(',').trim().split(/\s+/).filter(Boolean)

  const color = extra.find(x => COLORS.includes(x)) ?? 'default'
  const outline = extra.includes('outline')
  const block = extra.includes('block')
  const larger = extra.includes('larger')
  const pos = extra.includes('center') ? 'center' : extra.includes('right') ? 'right' : null

  return { url, text, icon, color, outline, block, larger, pos }
}

function buildHtml({ url, text, icon, color, outline, block, larger, pos }) {
  const classes = ['btn', COLOR_MAP[color] ?? 'btn-primary']
  if (outline) classes.push('btn-outline')
  if (larger) classes.push('btn-lg')
  if (block) classes.push('btn-block')

  const iconHtml = icon ? `<i class="${e(icon)}"></i> ` : ''
  const btn = `<a href="${e(url)}" class="${classes.join(' ')}" target="_blank" rel="noopener noreferrer">${iconHtml}${e(text)}</a>`

  if (pos === 'center') return `<div class="flex justify-center my-2">${btn}</div>`
  if (pos === 'right') return `<div class="flex justify-end my-2">${btn}</div>`
  return btn
}

function e(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
