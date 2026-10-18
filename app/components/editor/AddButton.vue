<template>
  <button type="button" class="btn btn-add gap-1" :class="small ? 'btn-xs' : 'btn-sm'">
    <Plus :size="small ? 12 : 14" class="shrink-0" /><slot />
  </button>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue'

/** An editor's "Add …" button. `small` for adding inside a list (a link, a track); the default for a section. */
defineProps<{ small?: boolean }>()
</script>
