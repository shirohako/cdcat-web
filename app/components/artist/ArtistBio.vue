<template>
  <!-- Up to about fifteen lines the text shows whole; longer, it folds there and fades out until expanded. The server
       sends it already clipped, so a long text doesn't jump; once measured, text that fits is let out. -->
  <div class="max-w-3xl">
    <div class="relative" :class="!expanded && (folds || !measured) && 'max-h-90 overflow-hidden'">
      <p ref="body" class="whitespace-pre-line text-sm leading-6 text-body">{{ text }}</p>
      <div v-if="folds && !expanded" class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card" />
    </div>
    <UiButton v-if="folds" size="xs" class="mt-2" :icon-right="expanded ? ChevronUp : ChevronDown" @click="toggle">
      {{ $t(expanded ? 'artists.detail.bio_collapse' : 'artists.detail.bio_expand') }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronUp } from '@lucide/vue'

/** An artist's 简介 on their page, folded when it runs long. */
const props = defineProps<{ text: string }>()

/** max-h-90: fifteen 24px lines. Up to two lines more still show whole, as folding would hide next to nothing. */
const COLLAPSED_HEIGHT = 360
const SLACK = 48
const body = ref<HTMLElement | null>(null)
const measured = ref(false)
const folds = ref(false)
const expanded = ref(false)
let observer: ResizeObserver | null = null
onMounted(() => {
  if (!body.value) return
  observer = new ResizeObserver(() => {
    folds.value = (body.value?.offsetHeight ?? 0) > COLLAPSED_HEIGHT + SLACK
    measured.value = true
  })
  observer.observe(body.value)
})
onBeforeUnmount(() => observer?.disconnect())
// Another artist's text starts folded again.
watch(() => props.text, () => { expanded.value = false })

/** Folding back from far down brings the text's top into view, so the page doesn't seem to jump away. */
const toggle = () => {
  expanded.value = !expanded.value
  if (!expanded.value && (body.value?.getBoundingClientRect().top ?? 0) < 0) {
    body.value?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
}
</script>
