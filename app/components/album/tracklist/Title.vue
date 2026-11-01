<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'

/**
 * A track's title, linking to its page. A title the chosen language has no name for shows the original, in a lighter
 * colour. Size and truncation come from the style. While its row is hovered (or the link focused), a line draws in
 * under the title from left to right, as on /about.
 */
defineProps<{ row: TracklistRow }>()
</script>

<template>
  <NuxtLink
    :to="`/tracks/${row.id}`"
    class="tl-title transition-[color,opacity] duration-150 focus-visible:outline-none"
    :class="row.translated === false ? 'text-meta' : 'text-title'"
  ><span class="tl-line">{{ row.title }}</span></NuxtLink>
</template>

<style scoped>
/* On the text's own box, so the line sits just under it whatever the row's line height; each line of a wrapped
   title (the table) gets its own. */
.tl-line {
  background: linear-gradient(var(--primary), var(--primary)) left 100% / 0 2px no-repeat;
  box-decoration-break: clone;
  transition: background-size 280ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

[data-track-id]:hover .tl-line,
.tl-title:focus-visible .tl-line {
  background-size: 100% 2px;
}

@media (prefers-reduced-motion: reduce) {
  .tl-line {
    transition: none;
  }
}
</style>
