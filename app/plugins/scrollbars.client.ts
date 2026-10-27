/**
 * Scrollbars show only while their box scrolls (main.css): every scroll, of the page or of anything in it, marks the
 * scrolling element with data-scrolling, taken off again once it has been still for HIDE_AFTER.
 */
const HIDE_AFTER = 800

export default defineNuxtPlugin(() => {
  const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>()

  // Scroll events don't bubble, so one listener in the capture phase hears them all.
  document.addEventListener('scroll', (event) => {
    const target = event.target === document ? document.documentElement : event.target
    if (!(target instanceof Element)) return
    if (!target.hasAttribute('data-scrolling')) target.setAttribute('data-scrolling', '')
    clearTimeout(timers.get(target))
    timers.set(target, setTimeout(() => target.removeAttribute('data-scrolling'), HIDE_AFTER))
  }, { capture: true, passive: true })
})
