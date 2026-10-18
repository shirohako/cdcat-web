import type { Ref } from 'vue'

// Timings follow NuxtLoadingIndicator's defaults.
/** Waits this long before showing, so quick loads never flash the bar. */
const SHOW_DELAY = 200
/** A request ending while another is about to start doesn't finish the bar in between. */
const IDLE_GRACE = 80
/** Time scale of the estimated progress: about 70% after this long, approaching but never reaching 100. */
const DURATION = 2000
/** How long the bar stays full before it fades out. */
const FULL_HOLD = 500
/** Matches the fade in AppProgressBar. */
const FADE = 400

/** NuxtLoadingIndicator's default curve: quick at first, slowing down as it goes. */
const estimate = (elapsed: number) => 2 / Math.PI * 100 * Math.atan(elapsed / DURATION * 100 / 50)

interface ProgressBar {
  /** 0–100 */
  progress: Readonly<Ref<number>>
  visible: Readonly<Ref<boolean>>
  /** True for one frame while the bar jumps back to 0, so that jump isn't animated. */
  instant: Readonly<Ref<boolean>>
  /** Marks one request as running; call the returned function when it ends (extra calls are ignored). */
  track: () => () => void
}

let bar: ProgressBar | undefined

/**
 * The page-top progress bar (AppProgressBar): shown while a page loads and while API requests
 * run. Navigation and requests overlap freely; the bar only finishes once all of them have, and
 * a load that starts while it is running carries on from where it is. Client-side only.
 */
export const useProgressBar = (): ProgressBar => {
  if (bar) return bar
  const progress = ref(0)
  const visible = ref(false)
  const instant = ref(false)
  if (import.meta.server) return { progress, visible, instant, track: () => () => {} }

  const nuxtApp = useNuxtApp()
  let requests = 0
  let navigating = false
  let running = false
  let showTimer: ReturnType<typeof setTimeout> | undefined
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let frame = 0
  let hideTimer: ReturnType<typeof setTimeout> | undefined
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  /** Moves without animating, then lets the next change animate again. */
  const jumpTo = (value: number) => {
    instant.value = true
    progress.value = value
    requestAnimationFrame(() => requestAnimationFrame(() => { instant.value = false }))
  }

  /** Advances along the curve every frame until finished; later loads keep the same clock. */
  const advance = () => {
    let startedAt: number | undefined
    const step = (now: number) => {
      startedAt ??= now
      progress.value = Math.min(99, estimate(now - startedAt))
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  const reveal = () => {
    visible.value = true
    jumpTo(0)
    advance()
  }

  const start = () => {
    clearTimeout(idleTimer)
    if (running) return
    running = true
    clearTimeout(hideTimer)
    clearTimeout(resetTimer)
    // Still on screen from the last load (full or fading): start over from the left edge.
    if (visible.value) reveal()
    else showTimer = setTimeout(reveal, SHOW_DELAY)
  }

  const finish = () => {
    if (!running) return
    running = false
    clearTimeout(showTimer)
    cancelAnimationFrame(frame)
    if (!visible.value) return
    progress.value = 100
    hideTimer = setTimeout(() => {
      visible.value = false
      resetTimer = setTimeout(() => jumpTo(0), FADE)
    }, FULL_HOLD)
  }

  const update = () => {
    if (requests > 0 || navigating) start()
    else {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(finish, IDLE_GRACE)
    }
  }

  // The first render after the server's HTML isn't a page load anyone waits for.
  nuxtApp.hook('page:loading:start', () => {
    if (nuxtApp.isHydrating) return
    navigating = true
    update()
  })
  nuxtApp.hook('page:loading:end', () => {
    navigating = false
    update()
  })
  nuxtApp.hook('vue:error', () => {
    navigating = false
    update()
  })

  const track = () => {
    requests++
    update()
    let ended = false
    return () => {
      if (ended) return
      ended = true
      requests--
      update()
    }
  }

  bar = { progress: readonly(progress), visible: readonly(visible), instant: readonly(instant), track }
  return bar
}
