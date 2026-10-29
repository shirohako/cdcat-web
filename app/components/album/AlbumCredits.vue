<template>
  <CatalogSection v-if="groups.length" :title="$t('album.section.credits')" :icon="Users" size="sm">
    <!-- One row per role, the role as its coloured tag; a hairline list, as a single role looks lost in the 简介 card's
         booklet layout. -->
    <div class="px-5 pb-5 pt-2">
      <CatalogInfoTable variant="lines">
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

const props = defineProps<{ credits: CatalogCredit[], discs?: AlbumDisc[] }>()

const { roleName, roleCategory, roleOrder } = useCatalogSchema()

/**
 * One row per role; a person credited under another name shows that name. An album with no credits
 * of its own sums up its tracks' credits instead, each person once per role. The 署名与发行 roles are left
 * to the hero, 专辑信息 and the tracklist.
 */
const groups = computed(() => {
  const isWork = (credit: CatalogCredit) => !(RELEASE_ROLES as readonly string[]).includes(credit.role)
  const own = props.credits.filter(isWork)
  const credits = own.length ? own : (props.discs ?? []).flatMap(disc => disc.tracks.flatMap(track => track.credits)).filter(isWork)
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
</script>
