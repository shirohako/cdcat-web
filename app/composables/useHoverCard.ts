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
 * A mouse or pen on a device that can hover opens it by resting; a tap (touch, or any press on a device that can't
 * hover) opens it instead of following the link, and a second tap on the same name, or the name in the card, goes to
 * the page. Keyboard presses follow the link as usual.
 *
 * `anchor` is the element the card shows for (null when closed), `current` the last one, kept while the card fades
 * out. The card calls `enter` and `leave` as the pointer moves in and out of it, and `close` when it closes itself
 * (Escape, a press elsewhere, leaving the page). `open` shows it for an element right away, for a button that also
 * opens it when pressed (a mouse click or the keyboard). Render the card with UiHoverCard.
 *
 * With `ownClicks`, the elements are buttons that handle their clicks themselves by calling `toggle`: a click, tap or
 * key opens the card there, and again closes it (the tracklist's people button, user ask 2026-11-11). Taps then
 * aren't handled here, or one tap would open the card and toggle it shut. A card closed that way doesn't come back
 * under a pointer still resting on its button; it can once the pointer has left it.
 */
export const useHoverCard = (
  root: Ref<HTMLElement | null>,
  selector: string,
  options: { enabled?: MaybeRefOrGetter<boolean>, delay?: number, ownClicks?: boolean } = {},
) => {
  const anchor = shallowRef<HTMLElement | null>(null)
  const current = shallowRef<HTMLElement | null>(null)
  let pending: HTMLElement | null = null
  /** The button whose card a click just closed (ownClicks): no reopening on hover until the pointer leaves it */
  let dismissed: HTMLElement | null = null
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
    if (!target || !root.value?.contains(target) || target === dismissed) return
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
    // A finger "leaves" after every tap; a card opened by a tap stays until a press elsewhere
    if (event.pointerType === 'touch') return
    const target = (event.target as Element | null)?.closest?.<HTMLElement>(selector)
    if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return
    if (target === dismissed) dismissed = null
    if (target === pending) {
      clearTimeout(showTimer)
      pending = null
    }
    if (anchor.value) leave()
  }

  // Taps: the pointer type of the press, as a click event doesn't carry it everywhere (Safari before 17).
  let pressType = ''
  const onPointerDown = (event: PointerEvent) => {
    pressType = event.pointerType
  }
  /** In the capture phase, so the link's own handler sees the click already prevented and doesn't navigate. */
  const onClick = (event: MouseEvent) => {
    if (!enabled() || event.detail === 0 || options.ownClicks) return
    if (pressType !== 'touch' && canHover()) return
    const target = (event.target as Element | null)?.closest?.<HTMLElement>(selector)
    if (!target || !root.value?.contains(target) || target === anchor.value) return
    event.preventDefault()
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    pending = null
    show(target)
  }

  const listen = (element: HTMLElement | null | undefined, on: boolean) => {
    const method = on ? 'addEventListener' : 'removeEventListener'
    element?.[method]('pointerover', onPointerOver as EventListener)
    element?.[method]('pointerout', onPointerOut as EventListener)
    element?.[method]('pointerdown', onPointerDown as EventListener, true)
    element?.[method]('click', onClick as EventListener, true)
  }
  watch(root, (element, previous) => {
    listen(previous, false)
    listen(element, true)
  }, { immediate: true, flush: 'post' })
  watch(enabled, (on) => {
    if (!on) close()
  })
  onBeforeUnmount(() => {
    close()
    listen(root.value, false)
  })

  const open = (element: HTMLElement) => {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    pending = null
    if (element !== anchor.value) show(element)
  }

  /** Opens the card for the element, or closes it when it is already open there */
  const toggle = (element: HTMLElement) => {
    if (element !== anchor.value) {
      dismissed = null
      open(element)
      return
    }
    close()
    dismissed = element
  }

  return { anchor, current, enter, leave, close, open, toggle }
}
