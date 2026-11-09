<script setup lang="ts">
import { NuxtLink } from '#components'
import { nameParts } from '~/utils/artistLine'

/**
 * A credited name: a link to the artist when there is one, plain text when only the printed name is known. Given the
 * artist's own name, a credited name holding it links only that part ("void (Mournfinale)": void, utils/artistLine);
 * one that doesn't links whole. With `card`, the link is marked for the artist hover card of the region around it
 * (useHoverCard with `[data-artist-card]`). `linkClass` replaces the link's underline look. The default slot follows
 * the name, e.g. for a detail note. The linked part is `.credit-link`, the rest `.credit-plain`, for the reader's
 * chosen way of telling them apart (useCreditLinks, main.css). With `truncate` it stays on one line, cut with …; a plain
 * name cut that way shows whole in a tooltip (a tap on touch screens), as a linked one does in its artist card.
 */
const props = defineProps<{
  name: string
  artistId: number | null
  artistName?: string | null
  card?: boolean
  linkClass?: string
  truncate?: boolean
}>()

const parts = computed(() => (props.artistId ? nameParts(props.name, props.artistName) : null))
// The default look underlines on hover, except in the dotted style, which draws its own solid line (main.css).
const { style: linkStyle } = useCreditLinks()
const linkClasses = computed(() => props.linkClass ?? ['decoration-faint underline-offset-[3px] transition-colors hover:text-primary', linkStyle.value !== 'dotted' && 'hover:underline'])
</script>

<template>
  <span v-if="parts" :class="truncate && 'truncate'"><span v-if="parts[0]" class="credit-plain">{{ parts[0] }}</span><NuxtLink
    :to="`/artists/${artistId}`"
    :data-artist-card="card ? artistId : undefined"
    class="credit-link"
    :class="linkClasses"
  >{{ parts[1] }}</NuxtLink><span v-if="parts[2]" class="credit-plain">{{ parts[2] }}</span><slot /></span>
  <UiTruncate v-else-if="truncate && !artistId" :text="name" class="credit-plain" />
  <component
    :is="artistId ? NuxtLink : 'span'"
    v-else
    :to="artistId ? `/artists/${artistId}` : undefined"
    :data-artist-card="card && artistId ? artistId : undefined"
    :class="[artistId ? ['credit-link', linkClasses] : 'credit-plain', truncate && 'truncate']"
  >{{ name }}<slot /></component>
</template>
