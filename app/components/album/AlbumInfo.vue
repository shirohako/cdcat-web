<template>
  <CatalogSection v-if="hasContent" :title="$t('album.section.information')" :icon="Info">
    <div class="space-y-4 px-5 py-4 text-sm">
      <div v-if="album.titles.length">
        <h3 class="mb-1.5 text-xs font-semibold text-meta">{{ $t('catalog.other_names') }}</h3>
        <CatalogTitleList :titles="album.titles" />
      </div>

      <!-- Who publishes, labels, sells, makes and plans the album, each name once with all its roles -->
      <div v-if="releasers.length">
        <h3 class="mb-1.5 text-xs font-semibold text-meta">{{ $t('album.info.people') }}</h3>
        <ul class="space-y-1">
          <li v-for="releaser in releasers" :key="releaser.key" class="flex items-baseline gap-2">
            <NuxtLink v-if="releaser.id" :to="`/artists/${releaser.id}`" class="min-w-0 truncate text-title transition-colors hover:text-primary">{{ releaser.name }}</NuxtLink>
            <span v-else class="min-w-0 truncate text-title">{{ releaser.name }}</span>
            <span class="shrink-0 text-[11px] text-meta">{{ releaser.roles.map(roleName).join(', ') }}</span>
          </li>
        </ul>
      </div>

      <div v-if="album.release_event">
        <h3 class="mb-1.5 text-xs font-semibold text-meta">{{ $t('album.info.release_event') }}</h3>
        <NuxtLink :to="`/albums?event=${album.release_event.id}`" class="text-title transition-colors hover:text-primary">{{ album.release_event.name }}</NuxtLink>
      </div>

      <div v-if="album.attributes.length">
        <h3 class="mb-1.5 text-xs font-semibold text-meta">{{ $t('album.info.attributes') }}</h3>
        <CatalogAttributeList :attributes="album.attributes" />
      </div>

      <div v-if="album.entries.length">
        <h3 class="mb-1.5 text-xs font-semibold text-meta">{{ $t('content_display.linked_entries') }}</h3>
        <ul class="space-y-1.5">
          <li v-for="entry in album.entries" :key="entry.id" class="flex items-baseline gap-2">
            <NuxtLink :to="`/entries/${entry.id}`" class="min-w-0 truncate text-title transition-colors hover:text-primary">{{ entry.name }}</NuxtLink>
            <span class="shrink-0 text-[11px] text-meta">{{ albumRelationLabel(entry.relation_type) }}</span>
          </li>
        </ul>
      </div>

      <div v-if="album.franchises.length">
        <h3 class="mb-1.5 text-xs font-semibold text-meta">{{ $t('catalog.belongs_to') }}</h3>
        <p class="flex flex-wrap gap-x-3">
          <NuxtLink v-for="franchise in album.franchises" :key="franchise.id" :to="`/franchises/${franchise.id}`" class="text-title transition-colors hover:text-primary">{{ franchise.name }}</NuxtLink>
        </p>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { Album } from '~/types/album'
import { Info } from '@lucide/vue'
import { RELEASE_ROLES } from '~/types/album'

const props = defineProps<{ album: Album }>()

const { roleName } = useCatalogSchema()
const { albumRelationLabel } = useEntryDisplay()

/** The album-wide 署名与发行 credits but 署名艺术家 (the hero shows those), grouped by name, roles in their fixed order. */
const releasers = computed(() => {
  const rows = new Map<string, { key: string, id: number | null, name: string, roles: string[] }>()
  for (const credit of props.album.credits) {
    if (credit.role === 'artist' || !(RELEASE_ROLES as readonly string[]).includes(credit.role)) continue
    const name = credit.credited_as || credit.artist?.name || ''
    const key = credit.artist ? `id:${credit.artist.id}:${name}` : `name:${name}`
    const row = rows.get(key) ?? { key, id: credit.artist?.id ?? null, name, roles: [] }
    if (!row.roles.includes(credit.role)) row.roles.push(credit.role)
    rows.set(key, row)
  }
  const order = (role: string) => (RELEASE_ROLES as readonly string[]).indexOf(role)
  return [...rows.values()].map(row => ({ ...row, roles: row.roles.sort((a, b) => order(a) - order(b)) }))
})

const hasContent = computed(() => props.album.titles.length || releasers.value.length || props.album.release_event
  || props.album.attributes.length || props.album.entries.length || props.album.franchises.length)
</script>
