<template>
  <CatalogSection v-if="groups.length" :title="$t('album.section.credits')" :icon="Users">
    <dl class="divide-y divide-line">
      <div v-for="group in groups" :key="group.role" class="flex gap-3 px-5 py-2.5">
        <dt class="w-28 shrink-0">
          <span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold" :class="getAlbumRolePalette(group.category).badge">{{ roleName(group.role) }}</span>
        </dt>
        <dd class="flex min-w-0 flex-wrap gap-x-1 text-sm text-body">
          <template v-for="(person, index) in group.people" :key="index">
            <NuxtLink v-if="person.artistId" :to="`/artists/${person.artistId}`" class="transition-colors hover:text-primary">{{ person.name }}</NuxtLink>
            <span v-else>{{ person.name }}</span>
            <span v-if="person.detail" class="text-meta">({{ person.detail }})</span><span v-if="index < group.people.length - 1">,</span>
          </template>
        </dd>
      </div>
    </dl>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { AlbumDisc } from '~/types/album'
import type { CatalogCredit } from '~/types/catalog'
import { Users } from '@lucide/vue'
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
