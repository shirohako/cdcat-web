<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'

/**
 * A track's title, linking to its page and marked for the track hover card while that card is on. A title the chosen
 * language has no name for shows the original, in a lighter colour. Size and truncation come from the style.
 */
defineProps<{ row: TracklistRow }>()

const { prefs } = useTracklist()
</script>

<template>
  <NuxtLink
    :to="`/tracks/${row.id}`"
    :data-track-card="prefs.trackCard ? row.id : undefined"
    class="tl-title decoration-faint underline-offset-[3px] transition-[color,opacity] duration-150 hover:underline"
    :class="row.translated === false ? 'text-meta' : 'text-title'"
  >{{ row.title }}</NuxtLink>
</template>
