<template>
  <div v-if="sorted.length" class="flex flex-wrap gap-1.5">
    <a
      v-for="link in sorted"
      :key="link.id"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex h-7 items-center gap-1.5 rounded-md bg-btn px-2.5 text-xs font-medium text-btn-content transition-colors duration-150 ease-out hover:bg-btn-hover"
      :title="link.url"
    >
      <img v-if="link.provider?.icon_url" :src="link.provider.icon_url" alt="" class="h-3.5 w-3.5 rounded-sm object-contain">
      <Globe v-else :size="13" class="opacity-60" />
      {{ label(link) }}
      <ExternalLink :size="11" class="opacity-40" />
    </a>
  </div>
</template>

<script setup lang="ts">
import type { CatalogLink } from '~/types/catalog'
import { ExternalLink, Globe } from '@lucide/vue'

/** External links as one compact row, for page headers. The full grouped list is AlbumLinks. */
const props = defineProps<{ links: CatalogLink[] }>()

const categoryOrder = ['official', 'streaming', 'shop', 'social', 'database', 'other']
const rank = (link: CatalogLink) => {
  const index = categoryOrder.indexOf(link.provider?.category ?? 'other')
  return index === -1 ? categoryOrder.length : index
}
const sorted = computed(() => [...props.links].sort((a, b) => rank(a) - rank(b)))

const label = (link: CatalogLink) => {
  if (link.provider?.name) return link.provider.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  try {
    return new URL(link.url).hostname.replace(/^www\./, '')
  } catch {
    return link.url
  }
}
</script>
