<script setup lang="ts">
import type { Component } from 'vue'

/**
 * A cover or thumbnail. A shimmer stands in while the picture loads and the picture fades in once loaded; a quiet icon
 * stands in when there is none or it fails to load, and the `overlay` slot sits on top (badges, a play button). Size it
 * with a class on the component, e.g. `class="size-12"`.
 *
 * Each address gets an <img> of its own: browsers keep painting the old picture until a changed src has loaded, so a
 * cover shown for one item after another (a hover card) would show the previous item's picture meanwhile.
 */
const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  aspect?: 'square' | 'video' | 'poster' | 'none'
  icon?: string | Component
  rounded?: 'md' | 'lg' | 'xl' | '2xl'
  /** Load straight away and ahead of other images, for a picture that is on screen as soon as it is shown (a hover card) */
  eager?: boolean
  /** On an always-dark surface (`bg-hero`) */
  dark?: boolean
}>(), { src: undefined, alt: '', aspect: 'square', icon: 'lucide:disc-3', rounded: 'lg' })

const ASPECTS = { square: 'aspect-square', video: 'aspect-video', poster: 'aspect-[3/4]', none: '' }
const ROUNDED = { 'md': 'rounded-md', 'lg': 'rounded-lg', 'xl': 'rounded-xl', '2xl': 'rounded-2xl' }

// The address that has loaded and the one that failed. An <img> that was replaced can still report on its own address
// afterwards; that is ignored.
const image = ref<HTMLImageElement | null>(null)
const loaded = ref<string | null>(null)
const failed = ref<string | null>(null)
const settle = (el: HTMLImageElement, ok: boolean) => {
  const src = el.getAttribute('src')
  if (src !== props.src) return
  if (ok) loaded.value = src
  else failed.value = src
}
const onLoad = (event: Event) => settle(event.target as HTMLImageElement, true)
const onError = (event: Event) => settle(event.target as HTMLImageElement, false)
// A server-rendered picture can finish before the page hydrates, while nothing listens yet. Only a picture with a size
// counts: a lazy one that has not started can also look complete.
onMounted(() => {
  if (image.value?.complete && image.value.naturalWidth > 0) settle(image.value, true)
})
</script>

<template>
  <div
    class="relative grid shrink-0 place-items-center overflow-hidden"
    :class="[ASPECTS[aspect], ROUNDED[rounded], dark ? 'bg-on-media/10 text-on-media/30' : 'bg-sunken text-faint']"
  >
    <template v-if="src && src !== failed">
      <!-- Under the picture, so a picture the browser already has covers it at once -->
      <Transition name="cover-shimmer">
        <span v-if="src !== loaded" class="skeleton absolute inset-0" :class="{ 'skeleton-dark': dark }" />
      </Transition>
      <img
        ref="image"
        :key="src"
        v-img-fade
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : undefined"
        :src="src"
        :alt="alt"
        class="absolute inset-0 size-full object-cover"
        @load="onLoad"
        @error="onError"
      >
    </template>
    <UiIcon v-else :icon="icon" class="size-1/3 max-h-10 max-w-10" />
    <slot name="overlay" />
  </div>
</template>

<style scoped>
/* The shimmer fades out while the picture fades in (.img-fade-in in assets/css/main.css). */
.cover-shimmer-leave-active {
  transition: opacity 300ms ease-out;
}
.cover-shimmer-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .cover-shimmer-leave-active {
    transition: none;
  }
}
</style>
