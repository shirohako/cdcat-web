import type { Ref } from 'vue'

/** The fixed navbar's height: rows under it count as off screen. */
const NAVBAR = 56

/**
 * Keeps what the reader is looking at in place while a list changes height above or around it (a density switch, a
 * style change, a folded disc): `hold(ms, element?)` notes where the element, or the first row of `root` below the
 * navbar, is on screen and scrolls the page frame by frame for `ms` so it stays there. Rows are found again by their
 * `data-track-id` when a style change replaces them.
 *
 * The page scrolls smoothly (`scroll-behavior` on <html>), so corrections are 'instant'; the browser's own scroll
 * anchoring is off meanwhile so the two don't both correct. Wheel, touch or keys hand the page back at once.
 */
export const useScrollAnchor = (root: Ref<HTMLElement | null>) => {
  let frame = 0

  const stop = () => {
    cancelAnimationFrame(frame)
    frame = 0
    document.documentElement.style.overflowAnchor = ''
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
    window.removeEventListener('keydown', stop)
  }

  const hold = (ms = 480, element?: HTMLElement | null) => {
    const list = root.value
    if (!import.meta.client || !list) return
    stop()
    const box = list.getBoundingClientRect()
    if (box.bottom < NAVBAR || box.top > window.innerHeight) return
    let target = element ?? [...list.querySelectorAll<HTMLElement>('[data-track-id]')].find(row => row.getBoundingClientRect().bottom > NAVBAR) ?? null
    if (!target) return
    const id = target.dataset.trackId
    const top = target.getBoundingClientRect().top
    const until = performance.now() + ms
    document.documentElement.style.overflowAnchor = 'none'
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', stop)
    const step = () => {
      if (!target?.isConnected && id) target = list.querySelector<HTMLElement>(`[data-track-id="${id}"]`)
      if (target?.isConnected) {
        const delta = target.getBoundingClientRect().top - top
        if (Math.abs(delta) >= 1) window.scrollBy({ top: delta, behavior: 'instant' })
      }
      if (performance.now() < until) frame = requestAnimationFrame(step)
      else stop()
    }
    frame = requestAnimationFrame(step)
  }

  onBeforeUnmount(stop)
  return { hold }
}
