/**
 * Visitors that state no language at all, which includes Googlebot, see the Japanese site, so Japanese is the
 * language search engines index. A cookie or `?lang=` still wins, and a browser language we don't offer still
 * falls back to English (the i18n `defaultLocale`).
 */
export default defineEventHandler((event) => {
  if (!event.node.req.headers['accept-language']) event.node.req.headers['accept-language'] = 'ja'
})
