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
 * With `tip` (the tracklist, 参与创作的人) a name with no artist page, or printed other than the artist's own name, always
 * has a tooltip with the whole of it (useCreditTip). It sits on the plain text only: the link keeps its hover card, so
 * the two never show at once; a name linked whole gets it only when there is no card.
 */
// Classes from the parent (paddings in tags) go to the name, not to a tooltip's bubble when that is the root
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  name: string
  artistId: number | null
  artistName?: string | null
  card?: boolean
  linkClass?: string
  truncate?: boolean
  tip?: boolean
}>()

const parts = computed(() => (props.artistId ? nameParts(props.name, props.artistName) : null))
const creditTip = useCreditTip()
const tipText = computed(() => (props.tip ? creditTip(props.name, props.artistId, props.artistName) : ''))
// The default look underlines on hover, except in the dotted style, which draws its own solid line (main.css).
const { style: linkStyle } = useCreditLinks()
const linkClasses = computed(() => props.linkClass ?? ['decoration-faint underline-offset-[3px] transition-colors hover:text-primary', linkStyle.value !== 'dotted' && 'hover:underline'])
</script>

<template>
  <span v-if="parts" v-bind="$attrs" :class="truncate && 'truncate'"><UiTooltip v-if="parts[0] && tipText" :text="tipText" class="whitespace-pre-line leading-5!"><span class="credit-plain">{{ parts[0] }}</span></UiTooltip><span v-else-if="parts[0]" class="credit-plain">{{ parts[0] }}</span><NuxtLink
    :to="`/artists/${artistId}`"
    :data-artist-card="card ? artistId : undefined"
    class="credit-link"
    :class="linkClasses"
  >{{ parts[1] }}</NuxtLink><UiTooltip v-if="parts[2] && tipText" :text="tipText" class="whitespace-pre-line leading-5!"><span class="credit-plain">{{ parts[2] }}</span></UiTooltip><span v-else-if="parts[2]" class="credit-plain">{{ parts[2] }}</span><slot /></span>
  <UiTooltip v-else-if="tipText && (!artistId || !card)" :text="tipText" class="whitespace-pre-line leading-5!">
    <component
      :is="artistId ? NuxtLink : 'span'"
      v-bind="$attrs"
      :to="artistId ? `/artists/${artistId}` : undefined"
      :class="[artistId ? ['credit-link', linkClasses] : 'credit-plain', truncate && 'truncate']"
    >{{ name }}<slot /></component>
  </UiTooltip>
  <UiTruncate v-else-if="truncate && !artistId" v-bind="$attrs" :text="name" class="credit-plain" />
  <component
    :is="artistId ? NuxtLink : 'span'"
    v-else
    v-bind="$attrs"
    :to="artistId ? `/artists/${artistId}` : undefined"
    :data-artist-card="card && artistId ? artistId : undefined"
    :class="[artistId ? ['credit-link', linkClasses] : 'credit-plain', truncate && 'truncate']"
  >{{ name }}<slot /></component>
</template>
