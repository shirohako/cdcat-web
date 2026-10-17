<template>
  <CatalogSection v-if="groups.length" :title="$t('album.section.credits')" :icon="Users" tone="emerald">
    <dl class="divide-y divide-gray-50">
      <div v-for="group in groups" :key="group.role" class="flex gap-3 px-5 py-2.5">
        <dt class="w-28 shrink-0">
          <span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold" :class="getAlbumRolePalette(group.category).badge">{{ roleName(group.role) }}</span>
        </dt>
        <dd class="flex min-w-0 flex-wrap gap-x-1 text-sm text-gray-700">
          <template v-for="(person, index) in group.people" :key="index">
            <NuxtLink v-if="person.artistId" :to="`/artists/${person.artistId}`" class="hover:text-emerald-700 hover:underline">{{ person.name }}</NuxtLink>
            <span v-else>{{ person.name }}</span>
            <span v-if="person.detail" class="text-gray-400">({{ person.detail }})</span><span v-if="index < group.people.length - 1">,</span>
          </template>
        </dd>
      </div>
    </dl>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { CatalogCredit } from '~/types/catalog'
import { Users } from '@lucide/vue'
import { getAlbumRolePalette } from '~/utils/albumRolePalette'

const props = defineProps<{ credits: CatalogCredit[] }>()

const { roleName, roleCategory, roleOrder } = useCatalogSchema()

/** One row per role; a person credited under another name shows that name. */
const groups = computed(() => {
  const map = new Map<string, { role: string, category: string, people: Array<{ name: string, artistId: number | null, detail: string | null }> }>()
  for (const credit of props.credits) {
    const group = map.get(credit.role) ?? { role: credit.role, category: credit.category ?? roleCategory(credit.role), people: [] }
    group.people.push({ name: credit.credited_as || credit.artist?.name || '', artistId: credit.artist?.id ?? null, detail: credit.detail })
    map.set(credit.role, group)
  }
  return [...map.values()].sort((a, b) => roleOrder(a.role) - roleOrder(b.role))
})
</script>
