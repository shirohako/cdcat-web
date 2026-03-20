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

// Full class strings written out so Tailwind's scanner can detect them
const COLOR_CLASSES = {
  default: {
    solid:   'bg-[#2F333C] !text-white hover:bg-[#3d4249]',
    outline: 'border border-[#2F333C] !text-[#2F333C] hover:bg-[#2F333C] hover:!text-white',
  },
  blue: {
    solid:   'bg-blue-600 !text-white hover:bg-blue-700',
    outline: 'border border-blue-600 !text-blue-600 hover:bg-blue-600 hover:!text-white',
  },
  pink: {
    solid:   'bg-pink-500 !text-white hover:bg-pink-600',
    outline: 'border border-pink-500 !text-pink-500 hover:bg-pink-500 hover:!text-white',
  },
  red: {
    solid:   'bg-red-600 !text-white hover:bg-red-700',
    outline: 'border border-red-600 !text-red-600 hover:bg-red-600 hover:!text-white',
  },
  purple: {
    solid:   'bg-purple-700 !text-white hover:bg-purple-800',
    outline: 'border border-purple-700 !text-purple-700 hover:bg-purple-700 hover:!text-white',
  },
  orange: {
    solid:   'bg-orange-500 !text-white hover:bg-orange-600',
    outline: 'border border-orange-500 !text-orange-500 hover:bg-orange-500 hover:!text-white',
  },
  green: {
    solid:   'bg-green-600 !text-white hover:bg-green-700',
    outline: 'border border-green-600 !text-green-600 hover:bg-green-600 hover:!text-white',
  },
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
  const { solid, outline: outlineCls } = COLOR_CLASSES[color] ?? COLOR_CLASSES.default
  const colorCls = outline ? outlineCls : solid
  const sizeCls = larger ? 'px-5 py-2 text-sm' : 'px-4 py-1.5 text-sm'
  const blockCls = block ? 'w-full justify-center' : 'inline-flex'
  const baseCls = `btn-tag ${blockCls} items-center gap-1.5 rounded-md font-medium transition-colors no-underline ${sizeCls} ${colorCls}`

  const iconHtml = icon ? `<i class="${e(icon)}"></i>` : ''
  const btn = `<a href="${e(url)}" class="${baseCls}" target="_blank" rel="noopener noreferrer">${iconHtml}${e(text)}</a>`

  if (pos === 'center') return `<div class="flex justify-center my-3">${btn}</div>`
  if (pos === 'right')  return `<div class="flex justify-end my-3">${btn}</div>`
  return btn
}

function e(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
