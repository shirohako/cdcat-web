<template>
  <ul v-if="titles.length" class="space-y-1 text-sm">
    <li v-for="(title, index) in titles" :key="index" class="flex items-baseline gap-2">
      <span class="text-gray-800">{{ title.title }}</span>
      <span class="shrink-0 text-[11px] text-gray-400">
        {{ [title.locale ? localeName(title.locale) : '', enumLabel('title_kind', title.kind)].filter(Boolean).join(' · ') }}
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { CatalogTitle } from '~/types/catalog'

defineProps<{ titles: CatalogTitle[] }>()

const { localeName, enumLabel } = useCatalogDisplay()
</script>
