<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

/**
 * A name that isn't an artist (another name of an album, an entry, a series) as a grey tag, the look of the people's
 * tags (CatalogCreditPersonTag xs): 20px, one line high. With `to` it is a link like theirs: the whole tag darkening on
 * hover, the name marked as the reader chose for links (.credit-link, useCreditLinks) and cut with … when too long.
 * Without, a long name wraps inside the tag rather than being cut.
 */
defineProps<{ to?: RouteLocationRaw }>()
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="inline-flex h-5 min-w-0 max-w-full items-center rounded-md bg-black/[0.05] px-1.5 text-xs leading-5 text-title transition-colors duration-150 hover:bg-black/[0.1] hover:text-primary dark:bg-white/[0.08] dark:hover:bg-white/[0.14]"
  >
    <span class="credit-link truncate"><slot /></span>
  </NuxtLink>
  <span v-else class="inline-block min-w-0 max-w-full rounded-md bg-black/[0.05] px-1.5 text-xs leading-5 text-title wrap-break-word dark:bg-white/[0.08]">
    <slot />
  </span>
</template>
