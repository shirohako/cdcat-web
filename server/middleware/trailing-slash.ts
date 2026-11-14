/**
 * `/albums/` shows the same page as `/albums`. A page has one address (docs/seo in the API repo), so the slashed
 * form moves to the bare one for good, query and all. Build and dev-tool paths (`/_nuxt/`, `/__nuxt…`) are left alone.
 */
export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const [path = '', ...query] = (event.node.req.url ?? '').split('?')
  if (path.length < 2 || !path.endsWith('/') || path.startsWith('/_')) return
  // One leading slash only: `//host/` would otherwise redirect off the site.
  const bare = path.replace(/\/+$/, '').replace(/^\/+/, '/') || '/'
  return sendRedirect(event, `${bare}${query.length ? `?${query.join('?')}` : ''}`, 301)
})
