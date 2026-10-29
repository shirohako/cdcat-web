import type { MaybeRefOrGetter, Ref } from 'vue'

/** How long the pointer rests before a card opens, and the shorter wait once a card was just open. */
const OPEN_DELAY = 350
const QUICK_DELAY = 100
const WARM_WINDOW = 300
const CLOSE_DELAY = 140

// One hover card open on the whole page: opening one closes another, and right after one closed the next opens
// quickly, so moving down a list of names swaps cards instead of waiting each time.
let closeOpen: (() => void) | null = null
let lastClosedAt = 0

/**
 * One hover card for a whole region: any element matching `selector` inside `root` opens it after the pointer rests
 * on it. Listeners are delegated on the root, so a long list costs two listeners rather than a component per row.
 * Only for a mouse or pen on a device that can hover; touch taps go to the link as usual.
 *
 * `anchor` is the element the card shows for (null when closed), `current` the last one, kept while the card fades
 * out. The card calls `enter` and `leave` as the pointer moves in and out of it, and `close` when it closes itself
 * (Escape, a press elsewhere, leaving the page). Render the card with UiHoverCard.
 */
export const useHoverCard = (root: Ref<HTMLElement | null>, selector: string, options: { enabled?: MaybeRefOrGetter<boolean>, delay?: number } = {}) => {
  const anchor = shallowRef<HTMLElement | null>(null)
  const current = shallowRef<HTMLElement | null>(null)
  let pending: HTMLElement | null = null
  let showTimer: ReturnType<typeof setTimeout> | undefined
  let hideTimer: ReturnType<typeof setTimeout> | undefined

  const enabled = () => toValue(options.enabled ?? true)
  const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

  const close = () => {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    pending = null
    if (!anchor.value) return
    anchor.value = null
    lastClosedAt = Date.now()
    if (closeOpen === close) closeOpen = null
  }

  const show = (element: HTMLElement) => {
    if (closeOpen && closeOpen !== close) closeOpen()
    closeOpen = close
    current.value = element
    anchor.value = element
  }

  const onPointerOver = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || !enabled() || !canHover()) return
    const target = (event.target as Element | null)?.closest?.<HTMLElement>(selector)
    if (!target || !root.value?.contains(target)) return
    clearTimeout(hideTimer)
    if (target === anchor.value || target === pending) return
    pending = target
    clearTimeout(showTimer)
    const quick = anchor.value || Date.now() - lastClosedAt < WARM_WINDOW
    showTimer = setTimeout(() => {
      pending = null
      show(target)
    }, quick ? QUICK_DELAY : options.delay ?? OPEN_DELAY)
  }

  const leave = () => {
    clearTimeout(hideTimer)
    hideTimer = setTimeout(close, CLOSE_DELAY)
  }
  const enter = () => clearTimeout(hideTimer)

  const onPointerOut = (event: PointerEvent) => {
    const target = (event.target as Element | null)?.closest?.<HTMLElement>(selector)
    if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return
    if (target === pending) {
      clearTimeout(showTimer)
      pending = null
    }
    if (anchor.value) leave()
  }

  watch(root, (element, previous) => {
    previous?.removeEventListener('pointerover', onPointerOver)
    previous?.removeEventListener('pointerout', onPointerOut)
    element?.addEventListener('pointerover', onPointerOver)
    element?.addEventListener('pointerout', onPointerOut)
  }, { immediate: true, flush: 'post' })
  watch(enabled, (on) => {
    if (!on) close()
  })
  onBeforeUnmount(() => {
    close()
    root.value?.removeEventListener('pointerover', onPointerOver)
    root.value?.removeEventListener('pointerout', onPointerOut)
  })

  return { anchor, current, enter, leave, close }
}
