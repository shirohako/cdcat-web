/**
 * A page asked for as Markdown (`/albums/18.md`, or `Accept: text/markdown`) leaves its text on the request
 * (app/composables/useMarkdownResponse.ts); this sends that text instead of the rendered HTML.
 *
 * A browser opening the address gets `text/plain`, which every browser shows in the tab; `text/markdown` makes some
 * of them download a file. Everything else gets `text/markdown`. Search engines are told not to index the text and
 * where the page it stands for is.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const markdown = event.context.markdown as { text: string, canonical: string } | undefined
    if (!markdown || (response.statusCode ?? 200) >= 300) return
    const browser = (getRequestHeader(event, 'accept') ?? '').includes('text/html')
    response.body = markdown.text
    response.headers = {
      ...response.headers,
      'content-type': `${browser ? 'text/plain' : 'text/markdown'}; charset=utf-8`,
      'x-robots-tag': 'noindex',
      'link': `<${markdown.canonical}>; rel="canonical"`,
    }
  })
})
