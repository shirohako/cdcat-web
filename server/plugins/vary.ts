/**
 * A page's HTML follows the language cookie and Accept-Language (and the session), and a page that has a Markdown
 * form answers with it when `Accept` asks (server/plugins/markdown.ts), so caches must keep these apart.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    const vary = String(response.headers?.vary ?? '')
    const names = new Set(vary.split(',').map(name => name.trim()).filter(Boolean))
    names.add('Accept')
    names.add('Accept-Language')
    names.add('Cookie')
    response.headers = { ...response.headers, vary: [...names].join(', ') }
  })
})
