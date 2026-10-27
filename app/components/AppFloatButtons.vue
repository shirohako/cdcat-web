<template>
  <!-- Slides in from the right once the page is scrolled down, and back out at the top. -->
  <div
    class="fixed bottom-4 right-4 z-40 flex flex-col gap-1.5 transition-[translate,opacity] duration-300 ease-out sm:bottom-6 sm:right-6 print:hidden"
    :class="shown ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-[calc(100%+2rem)] opacity-0'"
    :inert="!shown"
  >
    <!-- How far down the page is read; hovered, the number gives way to an arrow up, and a click goes back to the top. -->
    <UiFloatButton :label="t('site.back_to_top')" :tooltip="`${t('site.read_percent', { percent })} · ${t('site.back_to_top')}`" class="group/top relative overflow-hidden" @click="toTop">
      <span class="text-xs font-bold leading-none tabular-nums transition-[translate,opacity] duration-200 ease-out group-hover/top:-translate-y-2 group-hover/top:opacity-0">{{ percent }}<span class="text-[9px]">%</span></span>
      <ArrowUp :size="20" class="absolute translate-y-2 opacity-0 transition-[translate,opacity] duration-200 ease-out group-hover/top:translate-y-0 group-hover/top:opacity-100" aria-hidden="true" />
    </UiFloatButton>
  </div>
</template>

<script setup lang="ts">
import { ArrowUp } from '@lucide/vue'

/** The page's floating button, bottom right: how far down the page is read, and back to the top on a click. */
const { t } = useI18n()

/** Scrolled this far (px), the buttons come in. */
const SHOW_AFTER = 120

const percent = ref(0)
const shown = ref(false)

let frame = 0
const measure = () => {
  frame = 0
  const max = document.documentElement.scrollHeight - window.innerHeight
  const top = window.scrollY
  percent.value = max > 0 ? Math.min(100, Math.max(0, Math.round((top / max) * 100))) : 0
  shown.value = max > 0 && top > SHOW_AFTER
}
// One measurement per frame, however often the page scrolls or grows.
const schedule = () => {
  if (!frame) frame = requestAnimationFrame(measure)
}

// html has scroll-behavior: smooth (instant under reduced motion), so this glides.
const toTop = () => window.scrollTo({ top: 0 })

// Content that loads after the page shows changes its height without a scroll.
let observer: ResizeObserver | null = null
onMounted(() => {
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  observer = new ResizeObserver(schedule)
  observer.observe(document.body)
  measure()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  observer?.disconnect()
  if (frame) cancelAnimationFrame(frame)
})
</script>
