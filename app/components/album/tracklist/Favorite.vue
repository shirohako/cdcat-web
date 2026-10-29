<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'
import { Heart } from '@lucide/vue'

/**
 * A track's heart. Unfavourited ones appear when the pointer is over the row (always on touch screens and for the
 * keyboard); favourited ones always show, and pop when they become favourited. With `count` it also shows how many
 * have it and stays visible. `chip` is the filled small-button look of the lyrics buttons, with the count, for the
 * track hover card. Albums awaiting review have none.
 */
const props = defineProps<{ row: TracklistRow, count?: boolean, chip?: boolean }>()

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
    class="inline-flex shrink-0 items-center justify-center transition-[color,background-color,opacity,scale] duration-150 disabled:cursor-wait"
    :class="[
      chip
        ? ['h-[1.375rem] gap-[3px] rounded-[5px] px-1.5 text-[11.5px] font-semibold leading-none tabular-nums', row.favorited
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/15 dark:bg-red-400/15 dark:text-red-300 dark:hover:bg-red-400/20'
          : 'bg-black/[0.05] text-body hover:bg-red-500/10 hover:text-red-500 dark:bg-white/[0.08] dark:hover:bg-red-400/15 dark:hover:text-red-300 [&_svg]:text-meta hover:[&_svg]:text-current']
        : ['h-5 gap-1 rounded-md', count ? 'min-w-5 px-1' : 'w-5', row.favorited
          ? 'text-red-400 dark:text-red-300'
          : 'text-black/25 hover:bg-red-500/10 hover:text-red-400 dark:text-white/25 dark:hover:bg-red-400/15 dark:hover:text-red-300'],
      !row.favorited && !count && !chip && 'pointer-fine:scale-85 pointer-fine:opacity-0 pointer-fine:group-hover:scale-100 pointer-fine:group-hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100',
      popping && 'is-popping',
    ]"
    :aria-pressed="row.favorited"
    :aria-label="t(row.favorited ? 'content_display.unfavorite' : 'content_display.favorite')"
    :disabled="favoriting.has(row.id)"
    @click="toggleFavorite(row)"
    @animationend="popping = false"
  >
    <Heart :size="13" :fill="row.favorited ? 'currentColor' : 'none'" class="heart" />
    <span v-if="(count || chip) && row.favorites" class="tabular-nums" :class="!chip && 'text-xs'">{{ row.favorites }}</span>
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
