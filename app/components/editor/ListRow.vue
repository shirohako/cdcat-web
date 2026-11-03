<template>
  <li
    class="group relative flex items-center gap-2 rounded-lg py-1.5 pr-1 transition-[background-color,opacity]"
    :class="[invalid ? 'bg-danger/10 ring-1 ring-inset ring-danger/25' : 'bg-sunken hover:bg-card-hover', sortable ? 'pl-1' : 'pl-3', dragging && 'opacity-40']"
  >
    <!-- Where the row being dragged would land, in the middle of the gap between two rows. -->
    <span v-if="dropEdge" class="pointer-events-none absolute inset-x-2 h-0.5 rounded-full bg-primary" :class="dropEdge === 'before' ? '-top-[4px]' : '-bottom-[4px]'" />
    <!-- Dragging starts from the handle only; the move buttons are the keyboard and touch way. -->
    <span v-if="sortable" class="flex w-4 shrink-0 cursor-grab touch-none items-center justify-center self-stretch text-faint transition-colors hover:text-body active:cursor-grabbing" aria-hidden="true" @pointerdown="emit('grab')">
      <GripVertical :size="14" />
    </span>
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
import { GripVertical, PencilLine, Trash2 } from '@lucide/vue'

/**
 * A filled-in row shown as a summary: clicking it (or the pencil) opens its dialog. A `sortable` row has a drag handle
 * (`grab` when pressed; the list then makes the row draggable), `dragging` while it is dragged and `dropEdge` where a
 * dragged row would land.
 */
defineProps<{ invalid?: boolean, sortable?: boolean, dragging?: boolean, dropEdge?: 'before' | 'after' | null }>()
const emit = defineEmits<{ edit: [], remove: [], grab: [] }>()
</script>
