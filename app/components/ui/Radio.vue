<script setup lang="ts">
/** One radio button and its label; the radios of a group share a `v-model` and a `name`. */
withDefaults(defineProps<{
  value: string | number | boolean
  name?: string
  disabled?: boolean
}>(), { name: undefined })

const model = defineModel<string | number | boolean | null>()
</script>

<template>
  <label class="inline-flex items-center gap-2 text-sm text-body" :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'">
    <input v-model="model" type="radio" class="radio" :name="name" :value="value" :disabled="disabled">
    <span v-if="$slots.default"><slot /></span>
  </label>
</template>
