<template>
  <!-- Who a credit points at: an artist new in this revision, an existing artist (with its id), or a printed name only. -->
  <span v-if="typeof artistId === 'string'" class="truncate rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">{{ $t('editor.new') }}</span>
  <span v-else-if="artistId !== null" class="truncate rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{{ $t('editor.credits.existing') }} <span class="font-mono">#{{ artistId }}</span></span>
  <span v-else class="truncate rounded-full bg-btn px-1.5 py-0.5 text-[10px] text-btn-content" :title="$t('editor.credits.link_artist')">{{ $t('editor.dialog.name_only') }}</span>
</template>

<script setup lang="ts">
import type { AggregateRef } from '~/types/document'

defineProps<{ artistId: AggregateRef | null }>()
</script>
