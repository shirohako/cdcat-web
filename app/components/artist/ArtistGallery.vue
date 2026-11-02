<template>
  <!-- The artist's images besides the avatar and the banner, as a grid of thumbnails; past two rows, collapsed until
       expanded. Each opens the full-screen viewer. -->
  <CatalogSection :title="$t('artists.detail.gallery')" :icon="Images">
    <template #actions>{{ items.length }}</template>
    <div class="px-5 pb-5 pt-2">
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        <UiTooltip v-for="(item, at) in shown" :key="item.id" group="artist-gallery" :text="describe(item)">
          <button type="button" class="group relative aspect-square overflow-hidden rounded-md bg-sunken" @click="index = at">
            <img :src="item.image.thumbnail_url" :alt="item.caption || describe(item)" loading="lazy" class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105">
          </button>
        </UiTooltip>
      </div>
      <div v-if="collapsible" class="mt-3 flex justify-center">
        <UiButton size="xs" :icon-right="expanded ? ChevronUp : ChevronDown" @click="expanded = !expanded">
          {{ expanded ? $t('album.gallery.collapse') : $t('album.gallery.show_all', { count: items.length }) }}
        </UiButton>
      </div>
    </div>
    <CatalogImageViewer v-model:index="index" :items="viewerItems" />
  </CatalogSection>
</template>

<script setup lang="ts">
import type { ArtistImage } from '~/types/artist'
import type { CatalogImage } from '~/types/catalog'
import { ChevronDown, ChevronUp, Images } from '@lucide/vue'

/** `items`: the images to show, in order, each with its file. */
const props = defineProps<{ items: Array<ArtistImage & { image: CatalogImage }> }>()

const { enumLabel } = useCatalogDisplay()

/** Two rows of the widest grid show at first; one more would not be worth a button. */
const COLLAPSED_COUNT = 12
const collapsible = computed(() => props.items.length > COLLAPSED_COUNT + 1)
const expanded = ref(false)
const shown = computed(() => collapsible.value && !expanded.value ? props.items.slice(0, COLLAPSED_COUNT) : props.items)

/** "照片 · 2024": the kind and its label. */
const describe = (item: ArtistImage) => [enumLabel('artist_image_kind', item.kind), item.label].filter(Boolean).join(' · ')

const index = ref<number | null>(null)
const viewerItems = computed(() => props.items.map(item => ({ ...item, title: enumLabel('artist_image_kind', item.kind) })))
</script>
