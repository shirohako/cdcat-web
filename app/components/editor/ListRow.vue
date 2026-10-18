<template>
  <li
    class="group flex items-center gap-2 rounded-lg border bg-white py-1.5 pl-3 pr-1 transition-colors"
    :class="invalid ? 'border-rose-200 bg-rose-50/40' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'"
  >
    <!-- The pencil is the keyboard way in; the summary itself is a larger mouse target. -->
    <div class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-0.5" @click="emit('edit')">
      <slot />
    </div>
    <slot name="actions" />
    <button type="button" class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" :aria-label="$t('common.edit')" @click="emit('edit')">
      <PencilLine :size="14" />
    </button>
    <button type="button" class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600" :aria-label="$t('common.delete')" @click="emit('remove')">
      <Trash2 :size="14" />
    </button>
  </li>
</template>

<script setup lang="ts">
import { PencilLine, Trash2 } from '@lucide/vue'

/** A filled-in row shown as a summary: clicking it (or the pencil) opens its dialog. */
defineProps<{ invalid?: boolean }>()
const emit = defineEmits<{ edit: [], remove: [] }>()
</script>
