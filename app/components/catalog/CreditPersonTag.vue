<script setup lang="ts">
import { NuxtLink } from '#components'
import { nameParts } from '~/utils/artistLine'

/**
 * One name in the 参与创作的人 card, as the tracklist's tags do it (album/tracklist/People.vue). A name with an artist
 * page is a grey tag: linked whole when the printed name doesn't hold the artist's own name, the whole tag darkening
 * on hover; when it does ("Silence Akarin", "Akarin / Silence", "Akarin (Silence)"), only that part is a link, its own
 * darker patch on hover. Either way the link opens the artist hover card of the region around it (`[data-artist-card]`,
 * useHoverCard). A name with no artist page is a grey tag too, not a link; which part links is shown by the reader's
 * chosen style (useCreditLinks: faded or dotted). A note (detail) is
 * an ⓘ inside the tag; with one, the name is a patch too, so the ⓘ isn't inside the link.
 * `size` sm is the bold name of the by-person list, xs the small tags elsewhere.
 */
const props = withDefaults(defineProps<{
  name: string
  artistId: number | null
  artistName?: string | null
  detail?: string | null
  size?: 'xs' | 'sm'
}>(), { artistName: null, detail: null, size: 'xs' })

/** The printed name around the artist's own name, null when it holds none, or nothing else (a different case, "LBG" for lbg) */
const parts = computed(() => {
  const found = props.artistId ? nameParts(props.name, props.artistName) : null
  return found && (found[0] || found[2]) ? found : null
})
/** The tag is one link: a linked name held whole, no note */
const whole = computed(() => props.artistId !== null && !parts.value && !props.detail)

const SIZES = {
  xs: { tag: 'h-5 text-xs leading-5', patch: 'h-4.5 leading-4.5 rounded-[0.3125rem]' },
  sm: { tag: 'h-6 text-sm font-semibold leading-6', patch: 'h-5.5 leading-5.5 rounded-[0.3125rem]' },
}
/**
 * A name inside a tag that holds more: 5px wider than the text on each side and 1px in from the tag's edges (such a
 * tag has 1px padding, not 6px, so the text stays where a plain tag has it).
 */
const patch = computed(() => [
  'inline-block pl-1.25 transition-colors duration-150 hover:bg-black/[0.08] hover:text-primary dark:hover:bg-white/[0.12]',
  linkEnds.value ? 'pr-0.75' : 'pr-1.25',
  SIZES[props.size].patch,
])
/**
 * A note right after the link (no plain text between): the patch ends 3px after the text, so it doesn't run under the
 * ⓘ, and the ⓘ sits 1px after it; after plain text (5px padding) it is pulled back 1px. Either way, 4px from the text.
 */
const linkEnds = computed(() => Boolean(props.detail) && props.artistId !== null && !parts.value?.[2])
const notePull = computed(() => {
  if (props.artistId === null) return '-mr-0.5'
  return linkEnds.value ? 'ml-px pr-0.75' : '-ml-px pr-0.75'
})
const namePad = computed(() => {
  if (props.artistId === null) return ''
  return parts.value ? [parts.value[0] && 'pl-1.25', parts.value[2] && 'pr-1.25'] : ''
})
</script>

<template>
  <component
    :is="whole ? NuxtLink : 'span'"
    :to="whole ? `/artists/${artistId}` : undefined"
    :data-artist-card="whole ? artistId : undefined"
    class="inline-flex min-w-0 max-w-full items-center rounded-md text-title"
    :class="[
      SIZES[size].tag,
      'bg-black/[0.05] dark:bg-white/[0.08]',
      artistId === null ? 'gap-1 px-1.5' : whole ? 'px-1.5 transition-colors duration-150 hover:bg-black/[0.1] hover:text-primary dark:hover:bg-white/[0.14]' : 'px-px',
    ]"
  >
    <span v-if="whole" class="credit-link truncate">{{ name }}</span>
    <CatalogArtistName v-else :name="name" :artist-id="artistId" :artist-name="artistName" card :link-class="patch.join(' ')" class="truncate" :class="namePad" />
    <span v-if="detail" class="inline-flex shrink-0" :class="notePull"><CatalogCreditNote :note="detail" /></span>
  </component>
</template>
