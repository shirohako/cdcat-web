<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * vivia's text link: the theme colour, with a rounded pill behind it on hover. `muted` keeps the surrounding text
 * colour until hovered; `external` opens it in a new tab.
 */
withDefaults(defineProps<{ to: RouteLocationRaw, external?: boolean, muted?: boolean }>(), { external: false, muted: false })
</script>

<template>
  <NuxtLink
    :to="to"
    :external="external || undefined"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    class="link"
    :class="{ 'link-muted': muted }"
  >
    <slot />
  </NuxtLink>
</template>
