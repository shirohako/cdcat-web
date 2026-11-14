/**
 * Whether this request wants the page as Markdown (docs/seo in the API repo): its address ends in `.md`
 * (`suffixed`), or the client asks for `text/markdown` and not for HTML, as tools reading for a language model do.
 * Only the server answers that way; in the browser this is false and the page shows as usual.
 */
export function useMarkdownRequest(suffixed: boolean) {
  if (!import.meta.server) return false
  if (suffixed) return true
  const accept = useRequestHeader('accept') ?? ''
  return accept.includes('text/markdown') && !accept.includes('text/html')
}

/**
 * Answers this request with `text` in place of the rendered page (server/plugins/markdown.ts does the swap).
 * `canonical` is the page the text stands for: search engines are pointed there and never index the text itself.
 */
export function sendMarkdown(text: string, canonical: string) {
  const event = useRequestEvent()
  if (event) event.context.markdown = { text, canonical }
}
