<template>
  <li
    class="group flex items-center gap-2 rounded-lg py-1.5 pl-3 pr-1 transition-colors"
    :class="invalid ? 'bg-danger/10 ring-1 ring-inset ring-danger/25' : 'bg-sunken hover:bg-card-hover'"
  >
    <!-- The pencil is the keyboard way in; the summary itself is a larger mouse target. -->
    <div class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-0.5" @click="emit('edit')">
      <slot />
    </div>
    <slot name="actions" />
    <UiButton :icon="PencilLine" :label="$t('common.edit')" size="xs" class="shrink-0 ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="emit('edit')" />
    <UiButton variant="danger-soft" :icon="Trash2" :label="$t('common.delete')" size="xs" class="shrink-0 ring-1 ring-inset ring-danger/20 shadow-xs active:translate-y-px" @click="emit('remove')" />
  </li>
</template>

<script setup lang="ts">
import { PencilLine, Trash2 } from '@lucide/vue'

/** A filled-in row shown as a summary: clicking it (or the pencil) opens its dialog. */
defineProps<{ invalid?: boolean }>()
const emit = defineEmits<{ edit: [], remove: [] }>()
</script>
