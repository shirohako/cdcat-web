<script setup lang="ts">
import { NuxtLink } from '#components'

/**
 * A credited name: a link to the artist when there is one, plain text when only the printed name is known. With
 * `card`, it is marked for the artist hover card of the region around it (useHoverCard with `[data-artist-card]`).
 * The default slot follows the name, e.g. for a detail note.
 */
defineProps<{
  name: string
  artistId: number | null
  card?: boolean
}>()
</script>

<template>
  <component
    :is="artistId ? NuxtLink : 'span'"
    :to="artistId ? `/artists/${artistId}` : undefined"
    :data-artist-card="card && artistId ? artistId : undefined"
    :class="artistId && 'decoration-faint underline-offset-[3px] transition-colors hover:text-primary hover:underline'"
  >{{ name }}<slot /></component>
</template>
