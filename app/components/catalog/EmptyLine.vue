<script setup lang="ts">
import type { Component } from 'vue'

/**
 * A card's empty state in one line: the card's icon on a faint tile, and what is missing ("暂无相关文章"). `sm` is
 * tighter, close under the title, for the side column's cards.
 */
withDefaults(defineProps<{ icon: Component, text: string, size?: 'md' | 'sm' }>(), { size: 'md' })
</script>

<template>
  <div class="flex items-center justify-center gap-3 px-5" :class="size === 'sm' ? 'pb-4 pt-1' : 'py-5'">
    <div class="flex shrink-0 items-center justify-center rounded-lg bg-sunken" :class="size === 'sm' ? 'size-7' : 'size-8'">
      <component :is="icon" :size="size === 'sm' ? 14 : 15" class="text-meta" />
    </div>
    <p class="text-sm font-semibold text-meta">{{ text }}</p>
  </div>
</template>
