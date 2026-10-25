const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * One hover highlight for a list that glides from item to item under the pointer (the sidebar, the user menu).
 * Coming in from outside the list it appears in place, only fading in, so it never slides over from wherever it was
 * last.
 *
 * The highlight is an `absolute top-0` element (with its own inset and background) inside the list's positioned
 * box, before the items; the items need `relative` to stay above it. Call `enter` with an item from its mouseenter,
 * and `leave` from the list's mouseleave (or from anything in the list that isn't an item).
 */
export const useGlideHighlight = () => {
  const highlight = reactive({ top: 0, height: 0, visible: false, glide: false })

  const reducedMotion = ref(false)
  onMounted(() => { reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches })

  const enter = (item: EventTarget | null) => {
    if (!(item instanceof HTMLElement)) return
    highlight.glide = highlight.visible
    highlight.top = item.offsetTop
    highlight.height = item.offsetHeight
    highlight.visible = true
  }

  const leave = () => {
    highlight.visible = false
  }

  const style = computed(() => ({
    height: `${highlight.height}px`,
    transform: `translateY(${highlight.top}px)`,
    opacity: highlight.visible ? 1 : 0,
    transition: reducedMotion.value
      ? 'none'
      : highlight.glide
        ? `transform 280ms ${EASE}, height 280ms ${EASE}, opacity 150ms ease-out`
        : 'opacity 150ms ease-out',
  }))

  return { enter, leave, style }
}
