export interface ShareCardState {
  status: 'waiting' | 'ready' | 'failed'
  /** The drawn card, to show. */
  image_url?: string
  /** The API address that sends it as an attachment. */
  download_url?: string
}

/** How often a card being drawn is asked for again, and when to give up on it. */
const POLL_MS = 1500
const GIVE_UP_MS = 60_000

/**
 * Share card downloads (docs/share-cards in the API repo): the backend draws a style the first time it is asked for,
 * so the request is repeated until the card is ready. One state per style; a new request supersedes the one running.
 */
export function useShareCardDownload(url: (style: string) => string) {
  const { $api } = useNuxtApp()
  const states = reactive<Record<string, ShareCardState>>({})

  let run = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let wake: (() => void) | null = null

  const stop = () => {
    run++
    if (timer) clearTimeout(timer)
    timer = null
    wake?.()
    wake = null
  }

  /** Asks until the style is drawn (or failed, or superseded); resolves with its state. */
  async function request(style = ''): Promise<ShareCardState | undefined> {
    stop()
    const mine = run
    const started = Date.now()
    if (states[style]?.status !== 'ready') states[style] = { status: 'waiting' }
    while (mine === run) {
      try {
        const result = await $api<ShareCardState>(url(style), { method: 'POST', progress: false })
        if (mine !== run) break
        if (result.status !== 'waiting') {
          states[style] = result
          break
        }
        if (Date.now() - started >= GIVE_UP_MS) {
          states[style] = { status: 'failed' }
          break
        }
      } catch {
        if (mine === run) states[style] = { status: 'failed' }
        break
      }
      await new Promise<void>((resolve) => {
        wake = resolve
        timer = setTimeout(resolve, POLL_MS)
      })
    }
    return states[style]
  }

  onBeforeUnmount(stop)

  return { states, request, stop }
}
