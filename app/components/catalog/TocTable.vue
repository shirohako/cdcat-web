<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[26rem] text-xs tabular-nums">
      <thead>
        <tr class="border-b border-line text-left text-meta">
          <th class="py-1.5 pr-3 font-medium">{{ $t('catalog.toc.track') }}</th>
          <th class="py-1.5 pr-3 font-medium">{{ $t('catalog.toc.start') }}</th>
          <th class="py-1.5 pr-3 font-medium">{{ $t('catalog.toc.length') }}</th>
          <th class="py-1.5 pr-3 text-right font-medium">{{ $t('catalog.toc.start_sector') }}</th>
          <th class="py-1.5 text-right font-medium">{{ $t('catalog.toc.end_sector') }}</th>
        </tr>
      </thead>
      <tbody class="font-mono text-body">
        <tr v-for="row in rows" :key="row.track" class="border-b border-line/60 last:border-0" :class="row.data && 'text-meta'">
          <td class="py-1 pr-3">
            {{ row.track }}
            <span v-if="row.data" class="ml-1.5 rounded-sm bg-black/5 px-1 py-px font-sans text-10 dark:bg-white/10">{{ $t('catalog.toc.data') }}</span>
          </td>
          <td class="py-1 pr-3">{{ formatFrames(row.start) }}</td>
          <td class="py-1 pr-3">{{ formatFrames(row.length) }}</td>
          <td class="py-1 pr-3 text-right">{{ row.start }}</td>
          <td class="py-1 text-right">{{ row.end }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { DiscTocLike } from '~/utils/discToc'
import { formatFrames, tocRows } from '~/utils/discToc'

/** A TOC laid out like EAC's "TOC of the extracted CD": every track's start, length and sectors, the data track marked. */
const props = defineProps<{ toc: DiscTocLike }>()

const rows = computed(() => tocRows(props.toc))
</script>
