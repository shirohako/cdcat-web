/**
 * The body faces' @font-face rules are a stylesheet of their own (app/assets/css/fonts.css): a third of a megabyte
 * that says nothing about how the page looks, so the page must not wait for it. Nuxt already writes a preload for
 * the file, under the name the browser's build gave it; this adds the stylesheet itself beside that preload, as
 * `media="print"` so that it holds up neither the first paint nor the scripts, switched on once it has loaded
 * (and linked the plain way for readers without scripts). `crossorigin` matches the preload, or the browser would
 * fetch the file twice.
 *
 * Under `nuxt dev` there is no such preload and composables/useAppHead.ts links the file instead.
 */
const PRELOAD = /<link\b(?=[^>]*\brel="preload")[^>]*\bhref="([^"]*\/fonts\.[\w-]+\.css)"[^>]*>/

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    const href = html.head.join('').match(PRELOAD)?.[1]
    if (!href) return
    html.head.push(
      `<link rel="stylesheet" href="${href}" crossorigin media="print" onload="this.media='all'" data-font-faces>`
      + `<noscript><link rel="stylesheet" href="${href}" crossorigin></noscript>`,
    )
  })
})
