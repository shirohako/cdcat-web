<template>
  <!-- Opens the linked entity's page in a new tab; shown only for one that exists (not one new in this revision). -->
  <NuxtLink
    v-if="typeof id === 'number'"
    :to="`/${type}s/${id}`"
    target="_blank"
    class="flex h-7 shrink-0 items-center gap-1 rounded-md bg-btn px-2 text-xs font-medium text-btn-content hover:bg-btn-hover ring-1 ring-inset ring-line shadow-xs transition active:translate-y-px"
    :title="$t('common.view')"
    @click.stop
  >
    <ExternalLink :size="13" aria-hidden="true" />{{ $t('common.view') }}
  </NuxtLink>
</template>

<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'

defineProps<{
  type: 'artist'
  id: number | string | null
}>()
</script>
