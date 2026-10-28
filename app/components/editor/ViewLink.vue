<template>
  <!-- Opens the linked entity's page in a new tab; shown only for one that exists (not one new in this revision). -->
  <UiButton
    v-if="typeof id === 'number'"
    :to="`/${type}s/${id}`"
    target="_blank"
    :icon="ExternalLink"
    size="xs"
    class="shrink-0 gap-1 ring-1 ring-inset ring-line shadow-xs active:translate-y-px"
    :title="$t('common.view')"
    @click.stop
  >{{ $t('common.view') }}</UiButton>
</template>

<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'

defineProps<{
  type: 'artist'
  id: number | string | null
}>()
</script>
