<template>
  <CatalogSection v-if="groups.length || people.length" :title="$t('album.section.credits')" :icon="Users" size="sm" clip>
    <!-- 专辑参与人员: the album's own credits, open from the start. By person, in two columns from sm, so everyone appears
         once with all their jobs and short rows don't leave the card's right half empty. -->
    <div class="px-5 pb-5 pt-2">
      <div v-if="albumPeople.length">
        <div class="-mx-5 flex px-3">
          <AlbumCreditsFold :open="albumOpen" :title="$t('album.album_people.title')" :count="albumPeopleCount" @click="albumOpen = !albumOpen" />
        </div>
        <UiCollapse :open="albumOpen">
          <div class="grid gap-x-6 pt-1 sm:grid-cols-2">
            <div v-for="person in albumPeople" :key="person.key" class="min-w-0 border-line py-2.5 max-sm:[&:nth-child(n+2)]:border-t sm:[&:nth-child(n+3)]:border-t">
              <component
                :is="person.artistId ? NuxtLink : 'span'"
                :to="person.artistId ? `/artists/${person.artistId}` : undefined"
                class="text-sm font-semibold leading-5 text-title"
                :class="person.artistId && 'transition-colors duration-150 hover:text-primary'"
              >{{ person.name }}</component>
              <div class="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <template v-for="role in person.roles" :key="role.key">
                  <UiTooltip :text="roleName(role.role)" :disabled="!role.role_label">
                    <span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="getAlbumRolePalette(role.category).badge">{{ role.role_label || roleName(role.role) }}</span>
                  </UiTooltip>
                  <span v-if="role.details.length" class="mr-1 text-[11px] text-meta">{{ role.details.join(' / ') }}</span>
                </template>
              </div>
            </div>
            <!-- An empty last cell in the second column, so the line above the last row runs across both. -->
            <div v-if="albumPeople.length > 1 && albumPeople.length % 2" aria-hidden="true" class="border-t border-line max-sm:hidden" />
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
                  <component
                    :is="person.artistId ? NuxtLink : 'span'"
                    :to="person.artistId ? `/artists/${person.artistId}` : undefined"
                    class="inline-flex shrink-0 items-center gap-1 rounded-md bg-black/[0.05] px-1.5 py-0.5 text-xs leading-4 text-title transition-colors duration-150 dark:bg-white/[0.08]"
                    :class="person.artistId && 'hover:bg-black/[0.1] hover:text-primary dark:hover:bg-white/[0.14]'"
                  >
                    {{ person.name }}
                    <span v-if="person.detail" class="text-[11px] text-meta">{{ person.detail }}</span>
                  </component>
                  <span class="min-w-0 text-xs tabular-nums text-meta">{{ person.tracks ?? $t('album.track_people.all') }}</span>
                </span>
              </span>
            </CatalogInfoRow>
          </CatalogInfoTable>
          <CatalogInfoTable v-else variant="lines" class="pt-1">
            <CatalogInfoRow v-for="person in people" :key="person.key">
              <template #label>
                <component
                  :is="person.artistId ? NuxtLink : 'span'"
                  :to="person.artistId ? `/artists/${person.artistId}` : undefined"
                  class="inline-flex max-w-full items-center rounded-md bg-black/[0.05] px-1.5 py-0.5 text-xs leading-4 text-title transition-colors duration-150 dark:bg-white/[0.08]"
                  :class="person.artistId && 'hover:bg-black/[0.1] hover:text-primary dark:hover:bg-white/[0.14]'"
                ><span class="truncate">{{ person.name }}</span></component>
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
                  <UiTooltip :text="roleName(role.role)" :disabled="!role.role_label">
                    <span class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="getAlbumRolePalette(role.category ?? roleCategory(role.role)).badge">{{ role.role_label || roleName(role.role) }}</span>
                  </UiTooltip>
                  <span class="min-w-0 text-xs tabular-nums text-meta">
                    <span v-if="role.detail" class="text-body">{{ role.detail }} · </span>{{ role.tracks ?? $t('album.track_people.all') }}
                  </span>
                </span>
              </span>
            </CatalogInfoRow>
          </CatalogInfoTable>
          <AlbumFoldPill v-if="peopleLong" :label="$t('album.track_people.collapse')" @click="togglePeople" />
        </UiCollapse>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { AlbumDisc } from '~/types/album'
import type { CatalogCredit } from '~/types/catalog'
import { Users } from '@lucide/vue'
import { NuxtLink } from '#components'
import { RELEASE_ROLES } from '~/types/album'
import { getAlbumRolePalette } from '~/utils/albumRolePalette'
import { albumCreditPeople } from '~/utils/albumCreditPeople'
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
  const map = new Map<string, { key: string, role: string, role_label: string | null, category: string, people: Array<{ name: string, artistId: number | null, detail: string | null }> }>()
  const seen = new Set<string>()
  for (const credit of credits) {
    const person = { name: credit.credited_as || credit.artist?.name || '', artistId: credit.artist?.id ?? null, detail: credit.detail }
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
const peopleViews = computed(() => [
  { value: 'roles' as const, label: t('album.track_people.view_roles') },
  { value: 'tracks' as const, label: t('album.track_people.view_tracks') },
  { value: 'role_groups' as const, label: t('album.track_people.view_role_groups') },
])
</script>
