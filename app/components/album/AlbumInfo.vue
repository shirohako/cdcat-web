<template>
  <CatalogSection v-if="hasContent" :title="$t('album.section.information')" :icon="Info" tone="sky">
    <div class="space-y-4 px-5 py-4 text-sm">
      <div v-if="album.titles.length">
        <h3 class="mb-1.5 text-xs font-semibold text-gray-400">{{ $t('catalog.other_names') }}</h3>
        <CatalogTitleList :titles="album.titles" />
      </div>

      <div v-if="album.labels.length">
        <h3 class="mb-1.5 text-xs font-semibold text-gray-400">{{ $t('album.info.labels') }}</h3>
        <ul class="space-y-1">
          <li v-for="label in album.labels" :key="`${label.id}-${label.role}`" class="flex items-baseline gap-2">
            <NuxtLink :to="`/labels/${label.id}`" class="text-gray-800 hover:text-sky-700 hover:underline">{{ label.credited_as || label.name }}</NuxtLink>
            <span class="text-[11px] text-gray-400">{{ enumLabel('label_role', label.role) }}</span>
          </li>
        </ul>
      </div>

      <div v-if="album.release_event">
        <h3 class="mb-1.5 text-xs font-semibold text-gray-400">{{ $t('album.info.release_event') }}</h3>
        <NuxtLink :to="`/albums?event=${album.release_event.id}`" class="text-gray-800 hover:text-sky-700 hover:underline">{{ album.release_event.name }}</NuxtLink>
      </div>

      <div v-if="album.attributes.length">
        <h3 class="mb-1.5 text-xs font-semibold text-gray-400">{{ $t('album.info.attributes') }}</h3>
        <CatalogAttributeList :attributes="album.attributes" />
      </div>

      <div v-if="album.entries.length">
        <h3 class="mb-1.5 text-xs font-semibold text-gray-400">{{ $t('content_display.linked_entries') }}</h3>
        <ul class="space-y-1.5">
          <li v-for="entry in album.entries" :key="entry.id" class="flex items-baseline gap-2">
            <NuxtLink :to="`/entries/${entry.id}`" class="min-w-0 truncate text-gray-800 hover:text-sky-700 hover:underline">{{ entry.name }}</NuxtLink>
            <span class="shrink-0 text-[11px] text-gray-400">{{ albumRelationLabel(entry.relation_type) }}<template v-if="entry.episode"> · {{ $t('catalog.episode_n', { n: entry.episode }) }}</template></span>
          </li>
        </ul>
      </div>

      <div v-if="album.franchises.length">
        <h3 class="mb-1.5 text-xs font-semibold text-gray-400">{{ $t('catalog.belongs_to') }}</h3>
        <p class="flex flex-wrap gap-x-3">
          <NuxtLink v-for="franchise in album.franchises" :key="franchise.id" :to="`/franchises/${franchise.id}`" class="text-gray-800 hover:text-sky-700 hover:underline">{{ franchise.name }}</NuxtLink>
        </p>
      </div>
    </div>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { Album } from '~/types/album'
import { Info } from '@lucide/vue'

const props = defineProps<{ album: Album }>()

const { enumLabel } = useCatalogDisplay()
const { albumRelationLabel } = useEntryDisplay()

const hasContent = computed(() => props.album.titles.length || props.album.labels.length || props.album.release_event
  || props.album.attributes.length || props.album.entries.length || props.album.franchises.length)
</script>
