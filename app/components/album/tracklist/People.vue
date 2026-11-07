<script setup lang="ts">
import type { TracklistPerson } from '~/utils/tracklistView'
import { NuxtLink } from '#components'
import { nameParts } from '~/utils/artistLine'

/**
 * The people of one credit, each a grey tag at the role tags' height (the 制作人员 card's look), the detail note inside
 * it. The 客串 that belong to a credit share its tag, "Xeno feat. eili", and so do the artists joined to it by a printed
 * word, "awfuless meets PODA", each name its own link and artist hover card (while it is on). A credited name holding
 * the artist's own name links only that part ("void (Mournfinale)": void).
 * No joiners: the tags simply follow one another. They wrap with a small gap, stack one per line with `stack` (to the
 * right with `end`), or sit in the text around them with `inline`, for a line cut with ….
 */
const props = defineProps<{
  people: TracklistPerson[]
  stack?: boolean
  inline?: boolean
  end?: boolean
}>()

const { prefs } = useTracklist()

const layout = computed(() => {
  if (props.inline) return '[&>*:not(:last-child)]:mr-1'
  if (props.stack) return ['flex flex-col gap-1', props.end ? 'items-end' : 'items-start']
  return ['flex flex-wrap items-center gap-1', props.end && 'justify-end']
})

/** A tag that is one link, the whole of it darkening on hover: one name, linked whole, with no 客串 */
const whole = (person: TracklistPerson) => person.artistId !== null && !person.guests.length && !person.joined?.length && !nameParts(person.name, person.artistName)
/** Everyone in the tag that has their own name, the word, and 客串 */
const members = (person: TracklistPerson) => [person, ...(person.joined ?? [])]
/**
 * A name inside a tag that holds more: its own darker patch on hover, 16px tall in the 18px tag and 5px wider than the
 * text on each side, so it sits 1px in from the tag's edges (such a tag has 1px padding, not 6px, and the text stays
 * where a plain tag has it). Plain parts of such a tag get the same 5px.
 */
const NAME_LINK = 'inline-block h-4 rounded-[3px] px-[5px] leading-4 transition-colors duration-150 hover:bg-black/[0.08] hover:text-primary dark:hover:bg-white/[0.12]'
const namePad = (person: TracklistPerson) => {
  if (person.artistId === null) return 'px-[5px]'
  const parts = nameParts(person.name, person.artistName)
  return parts ? [parts[0] && 'pl-[5px]', parts[2] && 'pr-[5px]'] : ''
}
</script>

<template>
  <span :class="layout">
    <component
      :is="whole(person) ? NuxtLink : 'span'"
      v-for="person in people"
      :key="person.creditId"
      :to="whole(person) ? `/artists/${person.artistId}` : undefined"
      :data-artist-card="whole(person) && prefs.artistCard ? person.artistId : undefined"
      class="inline-flex h-[1.125rem] min-w-0 max-w-full items-center gap-1 rounded-[4px] bg-black/[0.05] text-xs leading-[1.125rem] text-title transition-colors duration-150 dark:bg-white/[0.08]"
      :class="[inline && 'align-middle', whole(person) ? 'px-1.5 hover:bg-black/[0.1] hover:text-primary dark:hover:bg-white/[0.14]' : 'gap-0 px-px']"
    >
      <template v-for="(member, position) in members(person)" :key="member.creditId">
        <!-- The words are pulled into the names' 5px patches, so about 2px of air on each side -->
        <span v-if="position" class="-mx-[3px] shrink-0 text-meta">{{ member.joinPhrase }}</span>
        <span v-if="whole(person)" class="truncate">{{ member.name }}</span>
        <CatalogArtistName v-else :name="member.name" :artist-id="member.artistId" :artist-name="member.artistName" :card="prefs.artistCard" :link-class="NAME_LINK" class="truncate" :class="namePad(member)" />
        <span v-if="member.detail" class="shrink-0 text-[11px] text-meta" :class="!whole(person) && 'px-[3px]'">{{ member.detail }}</span>
        <template v-if="member.guests.length">
          <span class="-mx-[3px] shrink-0 text-meta">feat.</span>
          <span v-for="(guest, index) in member.guests" :key="guest.creditId" class="inline-flex min-w-0 items-center">
            <CatalogArtistName :name="guest.name" :artist-id="guest.artistId" :artist-name="guest.artistName" :card="prefs.artistCard" :link-class="NAME_LINK" class="truncate" :class="namePad(guest)" />
            <span v-if="guest.detail" class="shrink-0 pr-[5px] text-[11px] text-meta">{{ guest.detail }}</span>
            <span v-if="index < member.guests.length - 1" class="-ml-1 mr-0.5 text-meta">,</span>
          </span>
        </template>
      </template>
    </component>
  </span>
</template>
