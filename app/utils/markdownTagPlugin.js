// Hexo-style custom tag plugin for markdown-it
// Each tag is a separate file in ./markdownTags/
// To add a new tag: create a file that exports `name` (string) and `render(argsStr)` (fn → html string)
//
// Uses an inline rule (not a core rule) so it fires before linkify,
// preventing URLs inside {% %} from being split into link tokens.

const tagModules = import.meta.glob('./markdownTags/*.js', { eager: true })

const tagHandlers = {}
for (const mod of Object.values(tagModules)) {
  if (mod.name && typeof mod.render === 'function') {
    tagHandlers[mod.name] = mod.render
  }
}

export default function hexoTagPlugin(md) {
  md.inline.ruler.push('hexo_tags', (state, silent) => {
    const src = state.src
    const pos = state.pos

    // Must start with {%
    if (src.charCodeAt(pos) !== 0x7B /* { */ || src.charCodeAt(pos + 1) !== 0x25 /* % */) {
      return false
    }

    // Find closing %}
    const end = src.indexOf('%}', pos + 2)
    if (end === -1) return false

    // Parse tag name and args
    const inner = src.slice(pos + 2, end).trim()
    const spaceIdx = inner.search(/\s/)
    if (spaceIdx === -1) return false

    const tagName = inner.slice(0, spaceIdx)
    const argsStr = inner.slice(spaceIdx + 1).trim()

    const handler = tagHandlers[tagName]
    if (!handler) return false

    if (!silent) {
      const token = state.push('html_inline', '', 0)
      token.content = handler(argsStr)
    }

    state.pos = end + 2
    return true
  })
}
