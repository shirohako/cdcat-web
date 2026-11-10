<template>
  <!-- Each name a grey tag, its language and kind grey labels after it, as the tracklist's (纯音乐, 原曲); under it
       when a long name needs the whole line -->
  <ul v-if="titles.length" class="space-y-1 text-sm">
    <li v-for="(title, index) in titles" :key="index" class="flex flex-wrap items-start gap-x-2 gap-y-1">
      <CatalogNameTag>{{ title.title }}</CatalogNameTag>
      <!-- As tall as the tag's first line, so the labels sit in its middle -->
      <span class="flex h-5 shrink-0 items-center gap-1">
        <AlbumTracklistLabel v-if="title.locale">{{ localeName(title.locale) }}</AlbumTracklistLabel>
        <AlbumTracklistLabel v-if="title.kind">{{ enumLabel('title_kind', title.kind) }}</AlbumTracklistLabel>
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { CatalogTitle } from '~/types/catalog'

defineProps<{ titles: CatalogTitle[] }>()

const { localeName, enumLabel } = useCatalogDisplay()
</script>
