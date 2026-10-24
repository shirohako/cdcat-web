<script setup lang="ts">
/** A multi-line text box on the .textarea primitive; attributes such as rows or placeholder pass through. */
withDefaults(defineProps<{ size?: 'sm' | 'md', invalid?: boolean }>(), { size: 'md' })

const model = defineModel<string | null>()
</script>

<template>
  <textarea
    v-model="model"
    class="textarea"
    :class="{ 'textarea-sm': size === 'sm', 'textarea-error': invalid }"
    :aria-invalid="invalid || undefined"
  />
</template>
