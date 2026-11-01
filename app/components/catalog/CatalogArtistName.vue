<script setup lang="ts">
import { NuxtLink } from '#components'
import { nameParts } from '~/utils/artistLine'

/**
 * A credited name: a link to the artist when there is one, plain text when only the printed name is known. Given the
 * artist's own name, a credited name holding it links only that part ("void (Mournfinale)": void, utils/artistLine);
 * one that doesn't links whole. With `card`, the link is marked for the artist hover card of the region around it
 * (useHoverCard with `[data-artist-card]`). `linkClass` replaces the link's underline look. The default slot follows
 * the name, e.g. for a detail note.
 */
const props = defineProps<{
  name: string
  artistId: number | null
  artistName?: string | null
  card?: boolean
  linkClass?: string
}>()

const parts = computed(() => (props.artistId ? nameParts(props.name, props.artistName) : null))
const linkClasses = computed(() => props.linkClass ?? 'decoration-faint underline-offset-[3px] transition-colors hover:text-primary hover:underline')
</script>

<template>
  <span v-if="parts">{{ parts[0] }}<NuxtLink
    :to="`/artists/${artistId}`"
    :data-artist-card="card ? artistId : undefined"
    :class="linkClasses"
  >{{ parts[1] }}</NuxtLink>{{ parts[2] }}<slot /></span>
  <component
    :is="artistId ? NuxtLink : 'span'"
    v-else
    :to="artistId ? `/artists/${artistId}` : undefined"
    :data-artist-card="card && artistId ? artistId : undefined"
    :class="artistId && linkClasses"
  >{{ name }}<slot /></component>
</template>
