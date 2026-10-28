<script setup lang="ts">
/** A checkbox on a mock-up, ticked or not, with its label. */
defineProps<{ label?: string, checked?: boolean }>()
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-1.5 text-[11px]" :class="checked ? 'text-title' : 'text-meta'">
    <span
      class="grid size-3.5 shrink-0 place-items-center rounded-[4px] border"
      :class="checked ? 'border-primary bg-primary text-on-primary' : 'border-field-line bg-field'"
    >
      <Icon v-if="checked" name="lucide:check" class="size-2.5" />
    </span>
    <span v-if="label" class="truncate">{{ label }}</span>
  </span>
</template>
