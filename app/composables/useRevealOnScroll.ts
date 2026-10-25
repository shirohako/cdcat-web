import type { Ref } from 'vue'

/**
 * Fades the elements marked `data-reveal` inside `root` in as they scroll into view, once each: the attribute turns
 * "out" while waiting and "in" when it's time, and assets/css/ui.css animates between the two. Elements already on
 * screen when the page mounts are left alone, so nothing that was server-rendered visible blinks out; with reduced
 * motion or without IntersectionObserver nothing is hidden at all.
 */
export function useRevealOnScroll(root: Readonly<Ref<HTMLElement | null>>) {
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    if (!root.value || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const waiting = [...root.value.querySelectorAll<HTMLElement>('[data-reveal]')]
      .filter(element => element.getBoundingClientRect().top > window.innerHeight)
    if (!waiting.length) return

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute('data-reveal', 'in')
        observer?.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px' })
    for (const element of waiting) {
      element.setAttribute('data-reveal', 'out')
      observer.observe(element)
    }
  })

  onBeforeUnmount(() => observer?.disconnect())
}
