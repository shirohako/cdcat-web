<script setup lang="ts">
/** vivia's count box, next to list rows and section titles. */
withDefaults(defineProps<{ value: number | string, size?: 'sm' | 'md' }>(), { size: 'md' })
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center bg-badge font-bold tabular-nums text-on-badge"
    :class="size === 'md' ? 'h-7 min-w-8 rounded-lg px-1.5 text-sm' : 'h-5 min-w-5 rounded-md px-1.5 text-[11px]'"
  >
    {{ value }}
  </span>
</template>
