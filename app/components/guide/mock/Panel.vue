<script setup lang="ts">
/** A card of the editor as the guide's mock-ups draw it: an icon and a title over the body, like CatalogSection. */
defineProps<{ title: string, icon?: string }>()
</script>

<template>
  <div class="overflow-hidden rounded-lg bg-card shadow-xs ring-1 ring-line">
    <div class="flex min-h-9 items-center gap-2 border-b border-line px-3 py-1.5">
      <Icon v-if="icon" :name="icon" class="size-3.5 shrink-0 text-meta" />
      <span class="min-w-0 flex-1 truncate text-[13px] font-semibold text-title">{{ title }}</span>
      <slot name="actions" />
    </div>
    <div class="p-3">
      <slot />
    </div>
  </div>
</template>
