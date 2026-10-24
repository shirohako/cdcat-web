<script setup lang="ts">
import type { Component } from 'vue'

/**
 * A cover or thumbnail. The picture fades in once loaded, a quiet icon stands in when there is none, and the `overlay`
 * slot sits on top (badges, a play button). Size it with a class on the component, e.g. `class="size-12"`.
 */
withDefaults(defineProps<{
  src?: string | null
  alt?: string
  aspect?: 'square' | 'video' | 'poster' | 'none'
  icon?: string | Component
  rounded?: 'md' | 'lg' | 'xl' | '2xl'
}>(), { src: undefined, alt: '', aspect: 'square', icon: 'lucide:disc-3', rounded: 'lg' })

const ASPECTS = { square: 'aspect-square', video: 'aspect-video', poster: 'aspect-[3/4]', none: '' }
const ROUNDED = { 'md': 'rounded-md', 'lg': 'rounded-lg', 'xl': 'rounded-xl', '2xl': 'rounded-2xl' }
</script>

<template>
  <div class="relative grid shrink-0 place-items-center overflow-hidden bg-sunken text-faint" :class="[ASPECTS[aspect], ROUNDED[rounded]]">
    <img v-if="src" v-img-fade :src="src" :alt="alt" class="absolute inset-0 size-full object-cover" loading="lazy">
    <UiIcon v-else :icon="icon" class="size-1/3 max-h-10 max-w-10" />
    <slot name="overlay" />
  </div>
</template>
