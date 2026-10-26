<template>
  <!-- One tag per disc, the same in every UI language: "DISC 1" on a tint, then "TRACK 1–3, 5". -->
  <span class="inline-flex min-w-0 flex-wrap items-center gap-1">
    <span
      v-for="part in parts"
      :key="part.disc"
      class="inline-flex h-5 min-w-0 max-w-full items-stretch overflow-hidden rounded-md border border-primary/25 text-[10px] font-semibold leading-none"
    >
      <span class="flex shrink-0 items-center bg-primary/15 px-1.5 uppercase tracking-wide text-primary">Disc {{ part.disc }}</span>
      <span class="flex min-w-0 items-center gap-1 bg-primary/5 px-1.5">
        <span class="shrink-0 uppercase tracking-wide text-meta">Track</span>
        <span class="truncate font-mono text-title">{{ part.ranges.join(', ') }}</span>
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
import type { RowId } from '~/types/document'
import { trackRangeParts } from '~/utils/albumDocument'

const props = defineProps<{ trackIds: RowId[] }>()

const editor = useAlbumEditor()
const parts = computed(() => trackRangeParts(editor.album.value, props.trackIds))
</script>
