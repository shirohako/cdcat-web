<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

/**
 * vivia's card: a flat, borderless surface (the .card primitive). With `to` the whole card is a link; it, and an
 * `interactive` card, light up on hover.
 */
withDefaults(defineProps<{
  as?: string
  to?: RouteLocationRaw
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}>(), { as: 'div', to: undefined, padding: 'md', interactive: false })

const PADDINGS = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6 sm:p-8' }
</script>

<template>
  <component
    :is="to ? NuxtLink : as"
    :to="to"
    class="card"
    :class="[
      PADDINGS[padding],
      { 'block transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active': to || interactive },
    ]"
  >
    <slot />
  </component>
</template>
