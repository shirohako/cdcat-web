/** The IndexNow key (server/utils/indexnow.ts), where the engines look for it. No key, no file. */
export default defineEventHandler((event) => {
  const key = String(useRuntimeConfig(event).indexnowKey || '')
  if (!key) throw createError({ statusCode: 404 })
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return key
})
