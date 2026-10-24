<template>
  <!-- What a picker was set to: the same height as the picker, tinted so it reads as a chosen value. -->
  <div class="flex h-8 min-w-0 max-w-full items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 pl-2.5 pr-1 text-sm text-title">
    <component :is="icon" v-if="icon" :size="14" class="shrink-0 text-primary" aria-hidden="true" />
    <EditorRefLabel :id="id" :type="type" :references="references" :pending="pending" class="min-w-0 flex-1 font-medium" />
    <button
      type="button"
      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary"
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
