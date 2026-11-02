<template>
  <CatalogSection v-if="groups.length || people.length" :title="$t('album.section.credits')" :icon="Users" size="sm">
    <!-- One row per role, the role as its coloured tag; a hairline list, as a single role looks lost in the 简介 card's
         booklet layout. -->
    <div class="px-5 pb-5 pt-2">
      <CatalogInfoTable v-if="groups.length" variant="lines">
        <CatalogInfoRow v-for="group in groups" :key="group.role">
          <template #label>
            <span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="getAlbumRolePalette(group.category).badge">{{ roleName(group.role) }}</span>
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

      <!-- 曲目参与人员: the tracks' credits by person, folded under the album's own; open from the start when the album
           has none of its own. Each person shows their roles (with the tracks of each) or their tracks (with the roles
           on each in a tooltip); the choice is kept in this browser. -->
      <div v-if="people.length" :class="groups.length && 'mt-3 border-t border-line pt-2'">
        <div class="-mx-2 flex items-center gap-2">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[13px] font-semibold text-title transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
            :aria-expanded="peopleOpen"
            @click="peopleOpen = !peopleOpen"
          >
            <ChevronRight :size="15" class="shrink-0 text-meta transition-transform duration-200" :class="peopleOpen && 'rotate-90'" />
            {{ $t('album.track_people.title') }}
            <span class="font-normal text-meta">{{ $t('album.track_people.count', { count: people.length }) }}</span>
          </button>
          <UiSegmented v-if="peopleOpen" v-model="peopleView" :items="peopleViews" :label="$t('album.track_people.view_label')" size="sm" class="mr-2 shrink-0" />
        </div>
        <UiCollapse :open="peopleOpen" lazy>
          <CatalogInfoTable variant="lines" class="pt-1">
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
                      <p class="mt-0.5 text-meta">{{ track.roles.map(role => role.detail ? `${roleName(role.role)} · ${role.detail}` : roleName(role.role)).join(' / ') }}</p>
                    </template>
                  </UiTooltip>
                </span>
              </span>
              <!-- By role: each role as its tag, the tracks after it -->
              <span v-else class="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                <span v-for="role in person.roles" :key="`${role.role}:${role.detail}`" class="inline-flex min-w-0 items-center gap-1.5">
                  <span class="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4" :class="getAlbumRolePalette(role.category ?? roleCategory(role.role)).badge">{{ roleName(role.role) }}</span>
                  <span class="min-w-0 text-xs tabular-nums text-meta">
                    <span v-if="role.detail" class="text-body">{{ role.detail }} · </span>{{ role.tracks ?? $t('album.track_people.all') }}
                  </span>
                </span>
              </span>
            </CatalogInfoRow>
          </CatalogInfoTable>
        </UiCollapse>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { AlbumDisc } from '~/types/album'
import type { CatalogCredit } from '~/types/catalog'
import { ChevronRight, Users } from '@lucide/vue'
import { NuxtLink } from '#components'
import { RELEASE_ROLES } from '~/types/album'
import { getAlbumRolePalette } from '~/utils/albumRolePalette'
import { trackPeople } from '~/utils/trackPeople'

const props = defineProps<{ credits: CatalogCredit[], discs?: AlbumDisc[] }>()

const { roleName, roleCategory, roleOrder } = useCatalogSchema()

/**
 * The album's own credits, one row per role; a person credited under another name shows that name. The 署名与发行
 * roles are left to the hero, 专辑信息 and the tracklist. The tracks' credits go to 曲目参与人员, by person.
 */
const groups = computed(() => {
  const isWork = (credit: CatalogCredit) => !(RELEASE_ROLES as readonly string[]).includes(credit.role)
  const credits = props.credits.filter(isWork)
  const map = new Map<string, { role: string, category: string, people: Array<{ name: string, artistId: number | null, detail: string | null }> }>()
  const seen = new Set<string>()
  for (const credit of credits) {
    const person = { name: credit.credited_as || credit.artist?.name || '', artistId: credit.artist?.id ?? null, detail: credit.detail }
    const key = JSON.stringify([credit.role, person.artistId ?? person.name, person.detail])
    if (seen.has(key)) continue
    seen.add(key)
    const group = map.get(credit.role) ?? { role: credit.role, category: credit.category ?? roleCategory(credit.role), people: [] }
    group.people.push(person)
    map.set(credit.role, group)
  }
  return [...map.values()].sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
})

const people = computed(() => trackPeople(props.discs ?? [], roleOrder))
const peopleOpen = ref(!groups.value.length)

const VIEW_KEY = 'cdcat:album:track-people-view'
const { t } = useI18n()
// The page is rendered on the server too, so the stored choice is read once mounted.
const peopleView = ref<'roles' | 'tracks'>('roles')
onMounted(() => {
  try {
    if (localStorage.getItem(VIEW_KEY) === 'tracks') peopleView.value = 'tracks'
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
])
</script>
