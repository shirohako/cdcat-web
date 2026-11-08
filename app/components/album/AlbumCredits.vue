<template>
  <CatalogSection v-if="groups.length || people.length" :title="$t('album.section.credits')" :icon="Users" size="sm" clip>
    <!-- 专辑参与人员: the album's own credits, open from the start. By person (the default), in two columns, phones too, so
         everyone appears once with all their jobs and short rows don't leave the card's right half empty; or by role, one
         row per role, roles held by exactly the same people on one row. A name with an artist page is a grey tag (only the
         artist's own name in it linked) that opens the artist hover card; on touch screens a tap opens it. -->
    <div ref="region" class="px-5 pb-5 pt-2">
      <div v-if="albumPeople.length">
        <div class="-mx-5 flex items-center gap-2 px-3">
          <AlbumCreditsFold :open="albumOpen" :title="$t('album.album_people.title')" :count="albumPeopleCount" @click="albumOpen = !albumOpen" />
          <UiSegmented v-if="albumOpen" v-model="albumView" :items="albumViews" :label="$t('album.track_people.view_label')" size="sm" class="mr-2 shrink-0" />
        </div>
        <UiCollapse :open="albumOpen">
          <CatalogInfoTable v-if="albumView === 'roles'" variant="lines" class="pt-1">
            <CatalogInfoRow v-for="row in albumRoleRows" :key="row.key">
              <template #label>
                <span class="flex flex-wrap gap-1">
                  <UiTooltip v-for="group in row.roles" :key="group.key" :text="roleName(group.role)" :disabled="!group.role_label">
                    <span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="getAlbumRolePalette(group.category).badge">{{ group.role_label || roleName(group.role) }}</span>
                  </UiTooltip>
                </span>
              </template>
              <!-- A person with an artist page is a grey tag, anyone else plain text; the note inside (CatalogCreditPersonTag) -->
              <span class="flex flex-wrap gap-1.5">
                <CatalogCreditPersonTag v-for="(person, index) in row.people" :key="index" :name="person.name" :artist-id="person.artistId" :artist-name="person.artistName" :detail="person.detail" />
              </span>
            </CatalogInfoRow>
          </CatalogInfoTable>
          <div v-else class="grid grid-cols-2 gap-x-4 pt-1 sm:gap-x-6">
            <div v-for="person in albumPeople" :key="person.key" class="min-w-0 border-line py-2.5 [&:nth-child(n+3)]:border-t">
              <CatalogCreditPersonTag :name="person.name" :artist-id="person.artistId" :artist-name="person.artistName" size="sm" />
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                <template v-for="role in person.roles" :key="role.key">
                  <!-- A note is an ⓘ inside its role's tag, in the tag's colour, so it reads as that role's note -->
                  <span class="inline-flex items-center gap-[3px] rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="[getAlbumRolePalette(role.category).badge, role.details.length && 'pr-[5px]']">
                    <UiTooltip :text="roleName(role.role)" :disabled="!role.role_label">
                      <span>{{ role.role_label || roleName(role.role) }}</span>
                    </UiTooltip>
                    <CatalogCreditNote v-if="role.details.length" :note="role.details.join('\n')" tinted />
                  </span>
                </template>
              </div>
            </div>
            <!-- An empty last cell in the second column, so the line above the last row runs across both. -->
            <div v-if="albumPeople.length > 1 && albumPeople.length % 2" aria-hidden="true" class="border-t border-line" />
          </div>
        </UiCollapse>
      </div>

      <!-- 曲目参与人员: the tracks' credits, folded under the album's own; open from the start when the album has none of
           its own. By person, each shows their roles (with the tracks of each) or their tracks (with the roles on each in
           a tooltip); by role, each role shows its people with their tracks. The choice is kept in this browser.
           Open, the header sticks under the navbar (a hairline under it once it is stuck) so it can be folded from
           anywhere in a long list, and a long list has a 收起 pill floating at the bottom of the screen too; folding keeps
           the header where it is. -->
      <div v-if="people.length" ref="peopleBlock" :class="groups.length && 'mt-3 border-t border-line pt-2'">
        <span ref="peopleSentinel" class="block h-0" aria-hidden="true" />
        <div
          ref="peopleHeader"
          class="-mx-5 flex items-center gap-2 px-3 transition-shadow duration-150"
          :class="peopleOpen && ['sticky top-14 z-10 bg-card', peopleStuck && 'shadow-[0_1px_0_0_var(--color-line)]']"
        >
          <AlbumCreditsFold :open="peopleOpen" :title="$t('album.track_people.title')" :count="people.length" @click="togglePeople" />
          <UiSegmented v-if="peopleOpen" v-model="peopleView" :items="peopleViews" :label="$t('album.track_people.view_label')" size="sm" class="mr-2 shrink-0" />
        </div>
        <UiCollapse :open="peopleOpen" lazy>
          <!-- By role: one row per role as in the album's own credits, each person a tag with their tracks after it -->
          <CatalogInfoTable v-if="peopleView === 'role_groups'" variant="lines" class="pt-1">
            <CatalogInfoRow v-for="group in roleGroups" :key="group.key">
              <template #label>
                <UiTooltip :text="roleName(group.role)" :disabled="!group.role_label">
                  <span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="getAlbumRolePalette(group.category ?? roleCategory(group.role)).badge">{{ group.role_label || roleName(group.role) }}</span>
                </UiTooltip>
              </template>
              <span class="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                <span v-for="person in group.people" :key="person.key" class="inline-flex min-w-0 items-center gap-1.5">
                  <CatalogCreditPersonTag :name="person.name" :artist-id="person.artistId" :artist-name="person.artistName" :detail="person.detail" class="shrink-0" />
                  <span class="min-w-0 text-xs tabular-nums text-meta">{{ person.tracks ?? $t('album.track_people.all') }}</span>
                </span>
              </span>
            </CatalogInfoRow>
          </CatalogInfoTable>
          <CatalogInfoTable v-else variant="lines" class="pt-1">
            <CatalogInfoRow v-for="person in people" :key="person.key">
              <template #label>
                <CatalogCreditPersonTag :name="person.name" :artist-id="person.artistId" :artist-name="person.artistName" />
              </template>
              <!-- By track: the track numbers as small grey tags, per disc when there are several; the tooltip names the
                   track and what the person did on it -->
              <span v-if="peopleView === 'tracks'" class="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                <span v-if="!person.tracks" class="text-xs text-meta">{{ $t('album.track_people.all') }}</span>
                <span v-for="part in person.tracks ?? []" v-else :key="part.disc ?? 0" class="inline-flex flex-wrap items-center gap-1">
                  <span v-if="part.disc" class="mr-0.5 text-[11px] text-meta">Disc {{ part.disc }}</span>
                  <UiTooltip v-for="track in part.tracks" :key="track.id" group="track-people">
                    <span tabindex="0" class="inline-flex min-w-6 cursor-default justify-center rounded-md bg-black/[0.05] px-1.5 py-0.5 text-xs leading-4 tabular-nums text-title dark:bg-white/[0.08]">{{ track.label }}</span>
                    <template #content>
                      <p class="font-semibold">{{ track.label }}. {{ track.title }}</p>
                      <p class="mt-0.5 text-meta">{{ track.roles.map(role => role.detail ? `${role.role_label || roleName(role.role)} · ${role.detail}` : role.role_label || roleName(role.role)).join(' / ') }}</p>
                    </template>
                  </UiTooltip>
                </span>
              </span>
              <!-- By role: each role as its tag, the tracks after it -->
              <span v-else class="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                <span v-for="role in person.roles" :key="`${role.role}:${role.role_label}:${role.detail}`" class="inline-flex min-w-0 items-center gap-1.5">
                  <span class="inline-flex shrink-0 items-center gap-[3px] rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="[getAlbumRolePalette(role.category ?? roleCategory(role.role)).badge, role.detail && 'pr-[5px]']">
                    <UiTooltip :text="roleName(role.role)" :disabled="!role.role_label">
                      <span>{{ role.role_label || roleName(role.role) }}</span>
                    </UiTooltip>
                    <CatalogCreditNote v-if="role.detail" :note="role.detail" tinted />
                  </span>
                  <span class="min-w-0 text-xs tabular-nums text-meta">{{ role.tracks ?? $t('album.track_people.all') }}</span>
                </span>
              </span>
            </CatalogInfoRow>
          </CatalogInfoTable>
          <AlbumFoldPill v-if="peopleLong" :label="$t('album.track_people.collapse')" @click="togglePeople" />
        </UiCollapse>
      </div>
    </div>
  </CatalogSection>

  <UiHoverCard :anchor="artistCard.anchor.value" :label="hoverArtist?.name" :text-inset="16" class="w-76 p-0!" @enter="artistCard.enter" @leave="artistCard.leave" @close="artistCard.close">
    <ArtistHoverCard v-if="hoverArtist" :artist="hoverArtist" :roles="hoverRoles" />
  </UiHoverCard>
</template>

<script setup lang="ts">
import type { AlbumDisc } from '~/types/album'
import type { CatalogCredit } from '~/types/catalog'
import type { CreditRowPerson } from '~/utils/albumCreditPeople'
import type { TracklistArtist, TracklistArtistRole } from '~/utils/tracklistView'
import { Users } from '@lucide/vue'
import { RELEASE_ROLES } from '~/types/album'
import { getAlbumRolePalette } from '~/utils/albumRolePalette'
import { albumCreditPeople } from '~/utils/albumCreditPeople'
import { mergeCreditRoles } from '~/utils/creditMerge'
import { trackPeople, trackRoleGroups } from '~/utils/trackPeople'

const props = defineProps<{ credits: CatalogCredit[], discs?: AlbumDisc[] }>()

const { roleName, roleCategory, roleOrder } = useCatalogSchema()

/**
 * The album's own credits by role and printed job title (shown instead of the role's name); a person credited under another name shows that name. The 署名与发行
 * roles are left to the hero, 专辑信息 and the tracklist. The tracks' credits go to 曲目参与人员, by person.
 */
const groups = computed(() => {
  const isWork = (credit: CatalogCredit) => !(RELEASE_ROLES as readonly string[]).includes(credit.role)
  const credits = props.credits.filter(isWork)
  const map = new Map<string, { key: string, role: string, role_label: string | null, category: string, people: CreditRowPerson[] }>()
  const seen = new Set<string>()
  for (const credit of credits) {
    const person = { name: credit.credited_as || credit.artist?.name || '', artistId: credit.artist?.id ?? null, artistName: credit.artist?.name ?? null, detail: credit.detail }
    const roleLabel = credit.role_label || null
    const groupKey = JSON.stringify([credit.role, roleLabel])
    const key = JSON.stringify([groupKey, person.artistId ?? person.name, person.detail])
    if (seen.has(key)) continue
    seen.add(key)
    const group = map.get(groupKey) ?? { key: groupKey, role: credit.role, role_label: roleLabel, category: credit.category ?? roleCategory(credit.role), people: [] }
    group.people.push(person)
    map.set(groupKey, group)
  }
  return [...map.values()].sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
})

const { t } = useI18n()
const albumPeople = computed(() => albumCreditPeople(groups.value))
const albumRoleRows = computed(() => mergeCreditRoles(groups.value))


/** 按人员 (default) or 按角色. In a cookie, so the server already renders the reader's choice. */
const albumView = useCookie<'people' | 'roles'>('album_credits_view', { default: () => 'people', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
if (albumView.value !== 'people' && albumView.value !== 'roles') albumView.value = 'people'
const albumViews = computed(() => [
  { value: 'people' as const, label: t('album.track_people.view_roles') },
  { value: 'roles' as const, label: t('album.track_people.view_role_groups') },
])

/** The album's own list starts open; it is folded by hand, per visit. */
const albumOpen = ref(true)
const albumPeopleCount = computed(() => new Set(groups.value.flatMap(group => group.people.map(person => person.artistId ?? person.name))).size)

const people = computed(() => trackPeople(props.discs ?? [], roleOrder))
const roleGroups = computed(() => trackRoleGroups(people.value, roleOrder))
const peopleOpen = ref(!groups.value.length)

const peopleBlock = ref<HTMLElement | null>(null)
const peopleHeader = ref<HTMLElement | null>(null)
const peopleSentinel = ref<HTMLElement | null>(null)
const { hold } = useScrollAnchor(peopleBlock)
/** Folds or opens the list, keeping the header where it is on screen (folding from far down would otherwise jump). */
const togglePeople = () => {
  hold(520, peopleHeader.value)
  peopleOpen.value = !peopleOpen.value
}
/** Past this many rows the list also has the floating 收起 button. */
const LONG_LIST = 8
const peopleLong = computed(() => (peopleView.value === 'role_groups' ? roleGroups.value.length : people.value.length) > LONG_LIST)
const peopleStuck = useStuckHeader(peopleSentinel)

const VIEW_KEY = 'cdcat:album:track-people-view'
// The page is rendered on the server too, so the stored choice is read once mounted.
type PeopleView = 'roles' | 'tracks' | 'role_groups'
const peopleView = ref<PeopleView>('roles')
onMounted(() => {
  try {
    const stored = localStorage.getItem(VIEW_KEY)
    if (stored === 'tracks' || stored === 'role_groups') peopleView.value = stored
  }
  catch { /* the choice is a convenience */ }
})
watch(peopleView, (value) => {
  try {
    localStorage.setItem(VIEW_KEY, value)
  }
  catch { /* the choice is a convenience */ }
})
// ── The artist hover card, one for the whole card, as in the tracklist: the artist's roles on this album, a track
// role counted per track, an album-wide one as 0.
const region = ref<HTMLElement | null>(null)
const artistCard = useHoverCard(region, '[data-artist-card]')
const cardArtists = computed(() => {
  const artists = new Map<number, TracklistArtist>()
  const roles = new Map<number, Map<string, number>>()
  const count = (credit: CatalogCredit, tracks: number) => {
    if (!credit.artist) return
    artists.set(credit.artist.id, credit.artist)
    const held = roles.get(credit.artist.id) ?? new Map<string, number>()
    held.set(credit.role, (held.get(credit.role) ?? 0) + tracks)
    roles.set(credit.artist.id, held)
  }
  for (const credit of props.credits) count(credit, 0)
  for (const disc of props.discs ?? []) {
    for (const track of disc.tracks) {
      const seen = new Set<string>()
      for (const credit of track.credits) {
        const key = `${credit.artist?.id}:${credit.role}`
        if (seen.has(key)) continue
        seen.add(key)
        count(credit, 1)
      }
    }
  }
  return { artists, roles }
})
const hoverArtist = computed(() => cardArtists.value.artists.get(Number(artistCard.current.value?.dataset.artistCard)) ?? null)
const hoverRoles = computed<TracklistArtistRole[]>(() => [...(cardArtists.value.roles.get(hoverArtist.value?.id ?? -1) ?? new Map<string, number>()).entries()]
  .sort(([a], [b]) => roleOrder(a) - roleOrder(b))
  .map(([role, tracks]) => ({ role, label: roleName(role), category: roleCategory(role), count: tracks })))

const peopleViews = computed(() => [
  { value: 'roles' as const, label: t('album.track_people.view_roles') },
  { value: 'tracks' as const, label: t('album.track_people.view_tracks') },
  { value: 'role_groups' as const, label: t('album.track_people.view_role_groups') },
])
</script>
