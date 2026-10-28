<script setup lang="ts">
/** A pill on a mock-up: a choice among several (`selected` in the theme colour), or a tag beside a name. */
defineProps<{ label: string, selected?: boolean, tone?: 'plain' | 'soft' | 'success' | 'warning' | 'bonus' }>()
</script>

<template>
  <span
    class="inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-[11px] font-semibold"
    :class="selected
      ? 'bg-primary text-on-primary'
      : {
        'bg-btn text-btn-content': !tone || tone === 'plain',
        'bg-(--accent-soft) text-(--accent)': tone === 'soft',
        'bg-success/15 text-success': tone === 'success',
        'bg-warning/15 text-warning': tone === 'warning',
        'bg-pink-100 text-pink-600 dark:bg-pink-400/20 dark:text-pink-200': tone === 'bonus',
      }"
  ><slot />{{ label }}</span>
</template>
