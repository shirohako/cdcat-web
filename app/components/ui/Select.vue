<script setup lang="ts">
export interface UiSelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

/** A native select on the .select primitive. Give `options`, or put <option>s in the default slot. */
withDefaults(defineProps<{
  options?: UiSelectOption[]
  size?: 'xs' | 'sm' | 'md'
  invalid?: boolean
}>(), { options: () => [], size: 'md' })

const model = defineModel<string | number | null>()

const SIZES = { xs: 'select-xs', sm: 'select-sm', md: '' }
</script>

<template>
  <select v-model="model" class="select" :class="[SIZES[size], { 'select-error': invalid }]" :aria-invalid="invalid || undefined">
    <slot>
      <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
        {{ option.label }}
      </option>
    </slot>
  </select>
</template>
