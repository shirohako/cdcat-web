import type { Ref } from 'vue'

/** The fixed navbar's height (h-14). */
const NAVBAR_REM = 3.5

/**
 * Whether a sticky header sits stuck under the navbar. `sentinel` is an empty element right above the header: once it
 * has scrolled up behind the navbar, the header has left its place in the page.
 */
export const useStuckHeader = (sentinel: Ref<HTMLElement | null>) => {
  const stuck = ref(false)
  let observer: IntersectionObserver | null = null
  onMounted(() => {
    if (!sentinel.value) return
    // A pixel past the navbar, so a header resting exactly under it counts as stuck.
    const line = Math.round(remToPx(NAVBAR_REM)) + 1
    observer = new IntersectionObserver(([entry]) => {
      stuck.value = !!entry && !entry.isIntersecting && entry.boundingClientRect.top < line
    }, { rootMargin: `-${line}px 0px 0px 0px` })
    observer.observe(sentinel.value)
  })
  onBeforeUnmount(() => observer?.disconnect())
  return stuck
}
