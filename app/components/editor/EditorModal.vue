<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.esc="open = false">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="open = false" />
      <div class="relative flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl" :class="wide ? 'max-w-3xl' : 'max-w-lg'" role="dialog" aria-modal="true">
        <div class="flex shrink-0 items-center gap-2 border-b border-gray-100 px-5 py-3.5">
          <h2 class="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">{{ title }}</h2>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100" :aria-label="$t('common.close')" @click="open = false"><X :size="18" class="text-gray-400" /></button>
        </div>
        <div class="overflow-y-auto px-5 py-4"><slot /></div>
        <div v-if="$slots.footer" class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-5 py-3"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'

defineProps<{ title: string, wide?: boolean }>()
const open = defineModel<boolean>({ required: true })
</script>
