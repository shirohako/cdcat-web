<script setup lang="ts">
/** A checkbox and its label. `v-model` is a boolean, or a list of the checked `value`s when several share one model. */
withDefaults(defineProps<{
  value?: string | number
  size?: 'sm' | 'md'
  disabled?: boolean
}>(), { value: undefined, size: 'md' })

const model = defineModel<boolean | (string | number)[]>()
</script>

<template>
  <label class="inline-flex items-center gap-2 text-sm text-body" :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'">
    <input v-model="model" type="checkbox" class="checkbox" :class="{ 'checkbox-sm': size === 'sm' }" :value="value" :disabled="disabled">
    <span v-if="$slots.default"><slot /></span>
  </label>
</template>
