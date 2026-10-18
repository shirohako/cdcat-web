<template>
  <!-- What a picker was set to: the same height as the picker, tinted so it reads as a chosen value. -->
  <div class="flex h-[2.125rem] min-w-0 max-w-full items-center gap-2 rounded-[0.58rem] border border-blue-200 bg-blue-50 pl-2.5 pr-1 text-sm text-blue-950">
    <component :is="icon" v-if="icon" :size="14" class="shrink-0 text-blue-500" aria-hidden="true" />
    <EditorRefLabel :id="id" :type="type" :references="references" :pending="pending" class="min-w-0 flex-1 font-medium" />
    <button
      type="button"
      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-blue-400 hover:bg-blue-100 hover:text-blue-700"
      :aria-label="$t('common.delete')"
      @click="emit('remove')"
    ><X :size="13" /></button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { CatalogReferences } from '~/types/catalog'
import { X } from '@lucide/vue'

defineProps<{
  type: string
  id: number | string | null
  references: CatalogReferences
  pending?: Record<string, string>
  icon?: Component
}>()
const emit = defineEmits<{ remove: [] }>()
</script>
