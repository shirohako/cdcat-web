<script setup lang="ts">
import type { Component } from 'vue'

/**
 * A cover or thumbnail on a tile: UiImage (a sweep while the picture loads, then a fade) in the tile's shape, a quiet
 * icon when there is none or it fails to load, and the `overlay` slot on top (badges, a play button). Size it with a
 * class on the component, e.g. `class="size-12"`.
 */
withDefaults(defineProps<{
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
</script>

<template>
  <div
    class="relative grid shrink-0 place-items-center overflow-hidden"
    :class="[ASPECTS[aspect], ROUNDED[rounded], dark ? 'bg-on-media/10 text-on-media/30' : 'bg-sunken text-faint']"
  >
    <UiImage v-if="src" :src="src" :alt="alt" :eager="eager" :dark="dark" class="absolute inset-0">
      <template #fallback><UiIcon :icon="icon" class="size-1/3 max-h-10 max-w-10" /></template>
    </UiImage>
    <UiIcon v-else :icon="icon" class="size-1/3 max-h-10 max-w-10" />
    <slot name="overlay" />
  </div>
</template>
