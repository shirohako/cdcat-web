import type { Ref } from 'vue'

/**
 * Follows the reading position through a page of numbered sections (the legal documents, the guides) for both of its
 * tables of contents: `active` is the last section whose top has passed the reading line (just under the navbar, and
 * under the mobile contents bar below lg), `progress` how far through the whole text (`content`) the reader is, for
 * the mobile bar's progress line.
 *
 * `navigate` scrolls smoothly to a section and writes the #hash with history.replaceState (router.replace would make
 * router.options.ts jump there instead); while that scroll runs, the current section stays the picked one, and
 * `flashId` names it for a moment so its badge can light up. `followLink` is a click handler for the page: RichContent
 * renders plain <a> elements, so without it a #section link would jump and a link to another page would reload the
 * whole site.
 */
export function useDocReading(content: Readonly<Ref<HTMLElement | null>>, sectionIds: () => string[]) {
  const active = ref(0)
  const progress = ref(0)
  const flashId = ref<string | null>(null)

  // The reading line: the fixed navbar, a little air, and below lg the sticky contents bar.
  const NAVBAR = 64
  const AIR = 16
  const BAR = 60
  let wide: MediaQueryList | undefined
  const readingLine = () => NAVBAR + AIR + (wide?.matches ? 0 : BAR)
  const clamp = (value: number) => Math.min(1, Math.max(0, value))

  let frame = 0
  let locked = false
  let unlockTimer: ReturnType<typeof setTimeout> | undefined
  let flashTimer: ReturnType<typeof setTimeout> | undefined

  function track() {
    frame = 0
    const box = content.value
    const elements = sectionIds().map(id => document.getElementById(id))
    if (!box || elements.some(element => !element)) return
    const line = readingLine()
    const tops = elements.map(element => element!.getBoundingClientRect().top)
    const bounds = box.getBoundingClientRect()
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2

    if (!locked) {
      let index = 0
      tops.forEach((top, at) => { if (top - line <= 1) index = at })
      active.value = atBottom ? elements.length - 1 : index
    }
    progress.value = atBottom ? 1 : clamp((line - bounds.top) / Math.max(1, bounds.height - (window.innerHeight - line)))
  }
  const scheduleTrack = () => { frame ||= requestAnimationFrame(track) }

  function unlockWhenSettled() {
    clearTimeout(unlockTimer)
    const unlock = () => {
      locked = false
      clearTimeout(unlockTimer)
      window.removeEventListener('scrollend', unlock)
      scheduleTrack()
    }
    window.addEventListener('scrollend', unlock, { once: true })
    // No scrollend when the target is already in place, or in browsers without the event.
    unlockTimer = setTimeout(unlock, 1000)
  }

  function navigate(id: string) {
    const target = document.getElementById(id)
    if (!target) return
    const index = sectionIds().indexOf(id)
    if (index !== -1) {
      active.value = index
      locked = true
      unlockWhenSettled()
      flashId.value = id
      clearTimeout(flashTimer)
      flashTimer = setTimeout(() => { flashId.value = null }, 900)
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - readingLine() + 1, behavior: reduced ? 'auto' : 'smooth' })
    history.replaceState(history.state, '', `#${encodeURIComponent(id)}`)
  }

  /** Links that handled their own click (the contents, NuxtLinks) are left alone. */
  function followLink(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = (event.target as Element).closest('a')
    const href = link?.getAttribute('href')
    if (!link || !href || link.target === '_blank') return
    if (href.startsWith('#')) {
      event.preventDefault()
      navigate(decodeURIComponent(href.slice(1)))
    }
    else if (href.startsWith('/') && !href.startsWith('//')) {
      event.preventDefault()
      void navigateTo(href)
    }
  }

  onMounted(() => {
    wide = window.matchMedia('(min-width: 1024px)')
    window.addEventListener('scroll', scheduleTrack, { passive: true })
    window.addEventListener('resize', scheduleTrack, { passive: true })
    track()
  })
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', scheduleTrack)
    window.removeEventListener('resize', scheduleTrack)
    cancelAnimationFrame(frame)
    clearTimeout(unlockTimer)
    clearTimeout(flashTimer)
  })
  // New text (another language) moves every section.
  watch(sectionIds, () => nextTick(track))

  return { active, progress, flashId, navigate, followLink }
}
