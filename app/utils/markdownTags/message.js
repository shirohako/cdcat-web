// {% message %} tag — Bulma-style message box
// 
// https://bulma.io/documentation/components/message/
// 
//
// Syntax:
//   {% message [color],[title],[body] %}
//
// Parameters:
//   color  (optional) default | info | success | warning | danger | dark
//   title  (optional) header text — omit for body-only style
//   body   (required) message content (commas are fine — everything after the 2nd comma is body)
//
// Examples:
//   {% message info,Note,This is an informational message %}
//   {% message success,Done!,Your changes have been saved successfully %}
//   {% message warning,Warning,Please read the documentation before proceeding %}
//   {% message danger,Error,Something went wrong. Check the logs %}
//   {% message dark,,A message without a title %}
//   {% message ,Note,Color defaults to dark %}

export const name = 'message'

const COLORS = ['default', 'info', 'success', 'warning', 'danger', 'dark']

// Tailwind class pairs per color variant.
// Full class names are written out so the Tailwind scanner can detect them.
const COLOR_CLASSES = {
  default: { header: 'bg-violet-600', body: 'bg-violet-50' },
  info:    { header: 'bg-blue-500',   body: 'bg-blue-50' },
  success: { header: 'bg-green-500',  body: 'bg-green-50' },
  warning: { header: 'bg-amber-500',  body: 'bg-amber-50' },
  danger:  { header: 'bg-red-500',    body: 'bg-red-50' },
  dark:    { header: 'bg-[#2F333C]',  body: 'bg-gray-50' },
}

export function render(argsStr) {
  const parts = argsStr.split(',')
  const rawColor = (parts[0] ?? '').trim().toLowerCase()
  const title = (parts[1] ?? '').trim()
  const body = parts.slice(2).join(',').trim()

  const color = COLORS.includes(rawColor) ? rawColor : 'dark'
  const { header: headerBg, body: bodyBg } = COLOR_CLASSES[color]

  const headerHtml = title
    ? `<div class="flex items-center px-4 py-3 font-semibold text-sm text-white ${headerBg}">${e(title)}</div>`
    : ''

  return `<div class="not-prose rounded-lg my-5 overflow-hidden text-sm">${headerHtml}<div class="px-5 py-4 leading-7 text-gray-700 ${bodyBg}">${e(body)}</div></div>`
}

function e(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
