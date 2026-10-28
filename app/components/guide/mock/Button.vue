<script setup lang="ts">
/** A button on a mock-up, filled like the editor's: plain, the primary action, a dashed "add …" or a delete. */
defineProps<{ label?: string, icon?: string, variant?: 'plain' | 'primary' | 'add' | 'danger' }>()
</script>

<template>
  <span
    class="inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-[11px] font-semibold"
    :class="{
      'bg-btn text-btn-content shadow-xs ring-1 ring-inset ring-line': !variant || variant === 'plain',
      'bg-primary text-on-primary shadow-xs': variant === 'primary',
      'border border-dashed border-primary/45 bg-primary/8 text-primary': variant === 'add',
      'bg-danger/10 px-1.5 text-danger ring-1 ring-inset ring-danger/20': variant === 'danger',
    }"
  >
    <Icon v-if="icon" :name="icon" class="size-3 shrink-0" />{{ label }}
  </span>
</template>
