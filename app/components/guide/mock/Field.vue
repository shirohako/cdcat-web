<script setup lang="ts">
/**
 * A form field on a mock-up: its label (with the required star and a step marker), then a box showing the value, or
 * the placeholder in a fainter colour. `select` adds the dropdown's chevron, `area` makes it a taller text box.
 */
withDefaults(defineProps<{
  label?: string
  value?: string
  placeholder?: string
  required?: boolean
  mono?: boolean
  select?: boolean
  area?: boolean
  n?: number
}>(), { label: undefined, value: undefined, placeholder: undefined, n: undefined })
</script>

<template>
  <div class="min-w-0">
    <span v-if="label || n" class="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-body">
      <GuideMockMarker v-if="n" :n="n" />
      <span class="truncate">{{ label }}</span>
      <span v-if="required" class="-ml-1 text-danger">*</span>
    </span>
    <span
      class="flex min-w-0 gap-1 rounded-md border border-field-line bg-field px-2 text-xs"
      :class="area ? 'min-h-12 items-start py-1.5 leading-[1.125rem]' : 'h-7 items-center'"
    >
      <span class="min-w-0 flex-1" :class="[value ? 'text-title' : 'text-faint', area ? 'line-clamp-2' : 'truncate', { 'font-mono': mono }]">{{ value || placeholder }}</span>
      <Icon v-if="select" name="lucide:chevron-down" class="size-3 shrink-0 text-meta" />
    </span>
  </div>
</template>
