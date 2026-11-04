<template>
  <CatalogSection v-if="groups.length || people.length" :title="$t('album.section.credits')" :icon="Users" size="sm" clip>
    <!-- One row per role, the role as its coloured tag; a hairline list, as a single role looks lost in the 简介 card's
         booklet layout. -->
    <div class="px-5 pb-5 pt-2">
      <CatalogInfoTable v-if="groups.length" variant="lines">
        <CatalogInfoRow v-for="group in groups" :key="group.key">
          <template #label>
            <UiTooltip :text="roleName(group.role)" :disabled="!group.role_label">
              <span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="getAlbumRolePalette(group.category).badge">{{ group.role_label || roleName(group.role) }}</span>
            </UiTooltip>
          </template>
          <!-- Each person a grey tag (a link darkens and takes the theme colour on hover), the note inside it -->
          <span class="flex flex-wrap gap-1.5">
            <component
              :is="person.artistId ? NuxtLink : 'span'"
              v-for="(person, index) in group.people"
              :key="index"
              :to="person.artistId ? `/artists/${person.artistId}` : undefined"
              class="inline-flex items-center gap-1 rounded-md bg-black/[0.05] px-1.5 py-0.5 text-xs leading-4 text-title transition-colors duration-150 dark:bg-white/[0.08]"
              :class="person.artistId && 'hover:bg-black/[0.1] hover:text-primary dark:hover:bg-white/[0.14]'"
            >
              {{ person.name }}
              <span v-if="person.detail" class="text-[11px] text-meta">{{ person.detail }}</span>
            </component>
          </span>
        </CatalogInfoRow>
      </CatalogInfoTable>

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
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[13px] font-semibold text-title transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
            :aria-expanded="peopleOpen"
            @click="togglePeople"
          >
            <ChevronRight :size="15" class="shrink-0 text-meta transition-transform duration-200" :class="peopleOpen && 'rotate-90'" />
            {{ $t('album.track_people.title') }}
            <span class="font-normal text-meta">{{ $t('album.track_people.count', { count: people.length }) }}</span>
          </button>
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
          <!-- Floats at the bottom of the screen while the list is in view and settles at its end; only the pill takes clicks.
               In the inverted theme like the tooltips, so it reads as a control above the page; a light shadow; on hover a slightly lighter fill and the arrow below. -->
          <div v-if="peopleLong" class="pointer-events-none sticky bottom-5 z-10 flex justify-center pt-4">
            <UiButton
              :data-theme="pillTheme"
              class="group/fold pointer-events-auto h-7 min-h-7 gap-1 rounded-md border-0 bg-popover pl-2 pr-2.5 text-[11.5px] font-semibold text-title shadow-[0_2px_8px_-2px_oklch(0_0_0/0.25)] ring-1 ring-line transition-colors duration-150 hover:bg-card-hover"
              @click="togglePeople"
            >
              <!-- On hover the arrow slides up out of its slot and a second one rises in from below, once, like the list
                   folding upwards; reduced motion keeps the arrow still. -->
              <span class="relative size-[13px] shrink-0 overflow-hidden" aria-hidden="true">
                <ChevronUp :size="13" class="absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/fold:-translate-y-full motion-reduce:transition-none motion-reduce:group-hover/fold:translate-y-0" />
                <ChevronUp :size="13" class="absolute inset-0 translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/fold:translate-y-0 motion-reduce:hidden" />
              </span>
              {{ $t('album.track_people.collapse') }}
            </UiButton>
          </div>
        </UiCollapse>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { AlbumDisc } from '~/types/album'
import type { CatalogCredit } from '~/types/catalog'
import { ChevronRight, ChevronUp, Users } from '@lucide/vue'
import { NuxtLink } from '#components'
import { RELEASE_ROLES } from '~/types/album'
import { getAlbumRolePalette } from '~/utils/albumRolePalette'
import { trackPeople, trackRoleGroups } from '~/utils/trackPeople'

const props = defineProps<{ credits: CatalogCredit[], discs?: AlbumDisc[] }>()

const { roleName, roleCategory, roleOrder } = useCatalogSchema()

/**
 * The album's own credits, one row per role and printed job title (shown instead of the role's name); a person credited under another name shows that name. The 署名与发行
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
/** Past this many rows the list also has the floating 收起 button, in the theme opposite the page's. */
const { theme } = useAppearance()
const pillTheme = computed(() => theme.value === 'dark' ? 'light' : 'dark')
const LONG_LIST = 8
const peopleLong = computed(() => (peopleView.value === 'role_groups' ? roleGroups.value.length : people.value.length) > LONG_LIST)
/** Whether the header is stuck under the navbar: the empty line above it has scrolled up behind the navbar. */
const peopleStuck = ref(false)
let stuckObserver: IntersectionObserver | null = null
onMounted(() => {
  if (!peopleSentinel.value) return
  stuckObserver = new IntersectionObserver(([entry]) => {
    peopleStuck.value = !!entry && !entry.isIntersecting && entry.boundingClientRect.top < 57
  }, { rootMargin: '-57px 0px 0px 0px' })
  stuckObserver.observe(peopleSentinel.value)
})
onBeforeUnmount(() => stuckObserver?.disconnect())

const VIEW_KEY = 'cdcat:album:track-people-view'
const { t } = useI18n()
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
