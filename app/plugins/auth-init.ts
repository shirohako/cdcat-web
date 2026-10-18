/**
 * Checks the session when the app starts. The server does it while rendering the page, which also
 * renews the auth cookies (see useAuthCookies). In the browser the page must never wait for the API
 * before it becomes usable, so a page the server did not render checks in the background.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const { fetchUser, token } = useAuth()
  if (!token.value) return

  if (import.meta.server) {
    try {
      await fetchUser()
    } catch (error) {
      // fetchUser clears the session itself when it is invalid; anything else is only logged.
      console.error('Failed to fetch user:', error)
    }
    return
  }
  if (nuxtApp.payload.serverRendered) return
  void fetchUser().catch(error => console.error('Failed to fetch user:', error))
})
