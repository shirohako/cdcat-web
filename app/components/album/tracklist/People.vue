<script setup lang="ts">
import type { TracklistPerson } from '~/utils/tracklistView'
import { NuxtLink } from '#components'
import { joinKind, joinText, nameParts } from '~/utils/artistLine'

/**
 * The people of one credit, each a grey tag at the role tags' height (the 制作人员 card's look), a note (detail) as an ⓘ
 * inside it, 4px after the name (notePull); a name's hover patch stops short of it. The 客串 that belong to a credit share its tag, "Xeno feat. eili", and so do the artists joined to it by a printed
 * word, "awfuless meets PODA", each name its own link and artist hover card (while it is on). A credited name holding
 * the artist's own name links only that part ("void (Mournfinale)": void).
 * A tag holding several names (joined, or with 客串) flows as text when it can wrap (not `inline`): its grey is a
 * highlight broken with the lines, each line's piece hugging its names, the breaks falling between names ("Asatsumei,
 * Asayami &" / "Mei Naganowa" / "feat. L4hee"), never inside one, nor between "feat." and the 客串 after it.
 * No joiners: the tags simply follow one another. They wrap with a small gap, stack one per line with `stack` (to the
 * right with `end`), or sit in the text around them with `inline`, for a line cut with ….
 * A name with no artist page, or printed other than the artist's own name, shows whole in a tooltip (CatalogArtistName `tip`).
 */
const props = defineProps<{
  people: TracklistPerson[]
  stack?: boolean
  inline?: boolean
  end?: boolean
}>()

const { prefs } = useTracklist()
const creditTip = useCreditTip()

const layout = computed(() => {
  if (props.inline) return '[&>*:not(:last-child)]:mr-1'
  if (props.stack) return ['flex flex-col gap-1', props.end ? 'items-end' : 'items-start']
  return ['flex flex-wrap items-center gap-1', props.end && 'justify-end']
})

/** A tag that is one link, the whole of it darkening on hover: one name, linked whole, with no 客串 */
const whole = (person: TracklistPerson) => person.artistId !== null && !person.detail && !person.guests.length && !person.joined?.length && !nameParts(person.name, person.artistName)
/** Everyone in the tag that has their own name, the word, and 客串 */
const members = (person: TracklistPerson) => [person, ...(person.joined ?? [])]
/**
 * A word joining two names, pulled into their 5px patches: about 2px of air on each side of them. A comma sits 1px
 * after the name's text, right after its patch (which ends there, `glued`), as full-width punctuation (、) does, which
 * also has the next name close.
 */
const joinClass = (word: string) => ({ word: '-mx-0.75', comma: '-ml-1 -mr-0.5', full: '-ml-1 -mr-2' })[joinKind(word)]
/** The names of a tag a comma or 、 follows: a 客串 before another, a name before an artist joined by such a phrase */
const gluedNames = (person: TracklistPerson) => {
  const glued = new Set<TracklistPerson['creditId']>()
  const list = members(person)
  list.forEach((member, index) => {
    const next = list[index + 1]?.joinPhrase
    const punctuation = next !== undefined && joinKind(next) !== 'word'
    const names = [member, ...member.guests]
    names.forEach((name, at) => {
      if (at < names.length - 1 ? at > 0 : punctuation) glued.add(name.creditId)
    })
  })
  return glued
}
/** A tag that flows as text: several names in it, on lines that can wrap */
const flows = (person: TracklistPerson) => !props.inline && Boolean(person.guests.length || person.joined?.length)
interface FlowName { person: TracklistPerson, gap: string, prefix: string, suffix: string }
/**
 * The names of a flowing tag in order, each kept on one line with what is glued to it: "feat. " before a 客串, a comma
 * or 、 after the name before the next ("Asatsumei,"). The `gap` before a name is where a line may break: a space, a
 * word between spaces (" & "), or nothing visible after 、.
 */
const flowNames = (person: TracklistPerson): FlowName[] => {
  const names: FlowName[] = []
  const join = (phrase: string, glued: boolean) => {
    const last = names.at(-1)
    const kind = joinKind(phrase)
    if (kind === 'word' || !last) return glued ? ' ' : joinText(phrase)
    last.suffix += phrase.trim()
    return kind === 'full' ? '\u200B' : ' '
  }
  for (const member of members(person)) {
    names.push({ person: member, gap: names.length ? join(member.joinPhrase ?? '', false) : '', prefix: '', suffix: '' })
    member.guests.forEach((guest, at) => names.push({ person: guest, gap: at ? join(',', false) : ' ', prefix: at ? '' : 'feat.\u00A0', suffix: '' }))
  }
  return names
}
/**
 * A name's hover patch in a flowing tag: 16px tall like the tag's, 3px wider than the text on each side but pulled back
 * by as much, so the text flows as plain text. The spaces around the names are 2px wider (word-spacing on the gaps and
 * "feat. "), so the patch stays about 2px clear of a word joined to it.
 */
const FLOW_LINK = 'inline-block max-w-full whitespace-normal -mx-0.75 rounded-[0.1875rem] px-0.75 leading-4 wrap-anywhere transition-colors duration-150 hover:bg-black/[0.08] hover:text-primary dark:hover:bg-white/[0.12]'
/** The same patch ending 1px after the text when a comma follows the name, so the comma stays out of it */
const FLOW_LINK_BEFORE_COMMA = FLOW_LINK.replace('-mx-0.75', '-ml-0.75 -mr-px').replace('px-0.75', 'pl-0.75 pr-px')
const flowLinkClass = (name: FlowName) => (name.suffix && !name.person.detail && linkEnds(name.person) ? FLOW_LINK_BEFORE_COMMA : FLOW_LINK)
/**
 * A name inside a tag that holds more: its own darker patch on hover, 16px tall in the 18px tag and 5px wider than the
 * text on each side, so it sits 1px in from the tag's edges (such a tag has 1px padding, not 6px, and the text stays
 * where a plain tag has it). Plain parts of such a tag get the same 5px.
 */
const NAME_LINK = 'inline-block h-4 rounded-[0.1875rem] px-1.25 leading-4 transition-colors duration-150 hover:bg-black/[0.08] hover:text-primary dark:hover:bg-white/[0.12]'
/** The same patch ending 3px after the text, when the note's ⓘ follows it, so the patch doesn't run under the ⓘ */
const NAME_LINK_BEFORE_NOTE = NAME_LINK.replace('px-1.25', 'pl-1.25 pr-0.75')
/** Ending 1px after the text, when a comma follows it (`glued`), so the comma stays out of the patch */
const NAME_LINK_BEFORE_COMMA = NAME_LINK.replace('px-1.25', 'pl-1.25 pr-px')
/** The link is the last of the name, right before its note (not "habi (Silence)", where plain text follows it) */
const linkEnds = (person: TracklistPerson) => person.artistId !== null && !nameParts(person.name, person.artistName)?.[2]
const linkClass = (person: TracklistPerson, glued: boolean) => {
  if (!linkEnds(person)) return NAME_LINK
  if (person.detail) return NAME_LINK_BEFORE_NOTE
  return glued ? NAME_LINK_BEFORE_COMMA : NAME_LINK
}
/**
 * The ⓘ 4px after what comes before it: in the tag, past its 4px gap and the 5px padding of plain text (or the 3px
 * end of a patch); among the 客串, which have no gap, the same less 4px.
 */
const notePull = (person: TracklistPerson, inTag: boolean) => {
  if (linkEnds(person)) return inTag ? '-ml-0.75' : 'ml-px'
  return inTag ? '-ml-1.25' : '-ml-px'
}
/** Plain text in a tag gets the patches' 5px, but only 1px before a comma, as a patch does */
const namePad = (person: TracklistPerson, glued: boolean) => {
  const end = glued && !person.detail ? 'pr-px' : 'pr-1.25'
  if (person.artistId === null) return ['pl-1.25', end]
  const parts = nameParts(person.name, person.artistName)
  return parts ? [parts[0] && 'pl-1.25', parts[2] && end] : ''
}
</script>

<template>
  <span :class="layout">
    <template v-for="person in people" :key="person.creditId">
      <!-- The highlight is the text's own box (1.45em in Noto Sans) padded to the tags' 1.125rem; 1.375rem lines leave
           the 4px gap of wrapped tags between them, and the first one is pulled up level with the role tag -->
      <span v-if="flows(person)" class="-mb-0.5 -mt-[0.09rem] block min-w-0 max-w-full text-xs leading-[1.375rem] text-title" :class="end && 'text-right'">
        <span class="rounded-sm bg-black/[0.05] px-1.5 py-[0.03em] box-decoration-clone dark:bg-white/[0.08]">
          <template v-for="name in flowNames(person)" :key="name.person.creditId">
            <span v-if="name.gap" class="text-meta [word-spacing:0.125rem]">{{ name.gap }}</span>
            <span class="whitespace-nowrap">
              <span v-if="name.prefix" class="text-meta [word-spacing:0.125rem]">{{ name.prefix }}</span>
              <CatalogArtistName tip :name="name.person.name" :artist-id="name.person.artistId" :artist-name="name.person.artistName" :card="prefs.artistCard" :link-class="flowLinkClass(name)" />
              <span v-if="name.person.detail" class="ml-1 inline-flex"><CatalogCreditNote :note="name.person.detail" /></span>
              <span v-if="name.suffix" class="ml-px text-meta">{{ name.suffix }}</span>
            </span>
          </template>
        </span>
      </span>
      <component
        :is="whole(person) ? NuxtLink : 'span'"
        v-else
        :to="whole(person) ? `/artists/${person.artistId}` : undefined"
        :data-artist-card="whole(person) && prefs.artistCard ? person.artistId : undefined"
        class="inline-flex h-[1.125rem] min-w-0 max-w-full items-center gap-1 rounded-sm bg-black/[0.05] text-xs leading-[1.125rem] text-title transition-colors duration-150 dark:bg-white/[0.08]"
        :class="[inline && 'align-middle', whole(person) ? 'px-1.5 hover:bg-black/[0.1] hover:text-primary dark:hover:bg-white/[0.14]' : 'px-px']"
      >
        <template v-for="(member, position) in members(person)" :key="member.creditId">
          <!-- The words are pulled into the names' 5px patches (joinClass) -->
          <span v-if="position" class="shrink-0 text-meta" :class="joinClass(member.joinPhrase ?? '')">{{ member.joinPhrase }}</span>
          <!-- A tag linked whole has the artist card; with the card off, a printed name other than the artist's own is
               spelled out in a tooltip, as CatalogArtistName does -->
          <UiTooltip v-if="whole(person) && !prefs.artistCard && creditTip(member.name, member.artistId, member.artistName)" :text="creditTip(member.name, member.artistId, member.artistName)" class="whitespace-pre-line leading-5!">
            <span class="credit-link truncate">{{ member.name }}</span>
          </UiTooltip>
          <span v-else-if="whole(person)" class="credit-link truncate">{{ member.name }}</span>
          <CatalogArtistName v-else tip :name="member.name" :artist-id="member.artistId" :artist-name="member.artistName" :card="prefs.artistCard" :link-class="linkClass(member, gluedNames(person).has(member.creditId))" truncate :class="namePad(member, gluedNames(person).has(member.creditId))" />
          <span v-if="member.detail" class="inline-flex shrink-0 pr-0.75" :class="notePull(member, true)"><CatalogCreditNote :note="member.detail" /></span>
          <template v-if="member.guests.length">
            <span class="-mx-0.75 shrink-0 text-meta">feat.</span>
            <span v-for="(guest, index) in member.guests" :key="guest.creditId" class="inline-flex min-w-0 items-center">
              <CatalogArtistName tip :name="guest.name" :artist-id="guest.artistId" :artist-name="guest.artistName" :card="prefs.artistCard" :link-class="linkClass(guest, gluedNames(person).has(guest.creditId))" truncate :class="namePad(guest, gluedNames(person).has(guest.creditId))" />
              <span v-if="guest.detail" class="inline-flex shrink-0 pr-0.75" :class="notePull(guest, false)"><CatalogCreditNote :note="guest.detail" /></span>
              <span v-if="index < member.guests.length - 1" class="mr-0.5 text-meta">,</span>
            </span>
          </template>
        </template>
      </component>
    </template>
  </span>
</template>
