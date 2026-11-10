<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'
import { Heart } from '@lucide/vue'

/**
 * A track's heart. Unfavourited ones appear when the pointer is over the row (always on touch screens and for the
 * keyboard), or always with `always` (the table's heart column); favourited ones always show, and pop when they become
 * favourited. Albums awaiting review have none.
 */
const props = defineProps<{ row: TracklistRow, always?: boolean }>()

const { t } = useI18n()
const { locked, favoriting, toggleFavorite } = useTracklist()
const popping = ref(false)
watch(() => props.row.favorited, (on, was) => {
  if (on && !was) popping.value = true
})
</script>

<template>
  <button
    v-if="!locked"
    type="button"
    class="inline-flex size-5 shrink-0 items-center justify-center rounded-md transition-[color,background-color,opacity,scale] duration-150 disabled:cursor-wait"
    :class="[
      row.favorited
        ? 'text-red-500 dark:text-red-400'
        : ['text-black/25 hover:bg-red-500/10 hover:text-red-400 dark:text-white/25 dark:hover:bg-red-400/15 dark:hover:text-red-300', !always && 'pointer-fine:scale-85 pointer-fine:opacity-0 pointer-fine:group-hover:scale-100 pointer-fine:group-hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100'],
      popping && 'is-popping',
    ]"
    :aria-pressed="row.favorited"
    :aria-label="t(row.favorited ? 'content_display.unfavorite' : 'content_display.favorite')"
    :disabled="favoriting.has(row.id)"
    @click="toggleFavorite(row)"
    @animationend="popping = false"
  >
    <Heart :size="13" :fill="row.favorited ? 'currentColor' : 'none'" class="heart" />
  </button>
</template>

<style scoped>
.is-popping .heart {
  animation: heart-pop 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes heart-pop {
  40% { scale: 1.25; }
}

@media (prefers-reduced-motion: reduce) {
  .is-popping .heart {
    animation: none;
  }
}
</style>
