<template>
  <!-- A select styled as a filter chip: the native select sits on top, invisible, so phones get their own picker. -->
  <div class="relative inline-flex h-8 shrink-0 items-center rounded-lg text-xs font-medium ring-1 ring-inset transition-colors duration-150" :class="modelValue ? activeClass : idleClass">
    <span class="pointer-events-none inline-flex items-center gap-1.5 pl-3" :class="modelValue ? 'pr-1' : 'pr-2.5'">
      <Icon :name="icon" class="h-3.5 w-3.5 shrink-0" />
      <span class="max-w-40 truncate">{{ selectedLabel ?? label }}</span>
      <Icon v-if="!modelValue" name="lucide:chevron-down" class="h-3 w-3 opacity-60" />
    </span>
    <select
      :value="modelValue ?? ''"
      class="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      :aria-label="label"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value || null)"
    >
      <option value="">{{ allLabel }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <button
      v-if="modelValue"
      type="button"
      class="relative inline-flex h-full items-center pl-0.5 pr-2 opacity-80 hover:opacity-100"
      :aria-label="clearLabel"
      @click="emit('update:modelValue', null)"
    >
      <Icon name="lucide:x" class="h-3.5 w-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
/** One filter of a list page's filter bar, as a chip; `activeClass` / `idleClass` match the bar's other chips. */
const props = defineProps<{
  modelValue: string | null
  label: string
  icon: string
  options: Array<{ value: string, label: string }>
  allLabel: string
  clearLabel: string
  activeClass: string
  idleClass: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const selectedLabel = computed(() => props.options.find(option => option.value === props.modelValue)?.label ?? null)
</script>
