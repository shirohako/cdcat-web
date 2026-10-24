<script setup lang="ts">
/** An on/off switch (the .toggle primitive) and its label. */
defineProps<{ disabled?: boolean }>()

const model = defineModel<boolean>()
</script>

<template>
  <label class="inline-flex items-center gap-2.5 text-sm text-body" :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'">
    <input v-model="model" type="checkbox" role="switch" class="toggle" :disabled="disabled">
    <span v-if="$slots.default"><slot /></span>
  </label>
</template>
