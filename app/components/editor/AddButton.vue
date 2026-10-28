<template>
  <UiButton variant="add" :size="small ? 'xs' : 'sm'" :icon="Plus" :icon-class="small ? 'size-3' : 'size-3.5'" class="gap-1"><slot /></UiButton>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue'

/** An editor's "Add …" button. `small` for adding inside a list (a link, a track); the default for a section. */
defineProps<{ small?: boolean }>()
</script>
