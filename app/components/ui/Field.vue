<script setup lang="ts">
/**
 * A form field: the label, the control in the default slot, then the error or else a hint. The slot gets `id` (put it
 * on the control so the label points at it), `describedBy` (for aria-describedby) and `invalid`.
 */
const props = withDefaults(defineProps<{
  label?: string
  hint?: string
  error?: string | null
  required?: boolean
  id?: string
}>(), { label: undefined, hint: undefined, error: undefined, id: undefined })

const generatedId = useId()
const controlId = computed(() => props.id ?? generatedId)
const messageId = computed(() => `${controlId.value}-message`)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="controlId" class="text-sm font-medium text-body">
      {{ label }}<span v-if="required" class="ml-0.5 text-danger" aria-hidden="true">*</span>
    </label>
    <slot :id="controlId" :described-by="error || hint ? messageId : undefined" :invalid="Boolean(error)" />
    <p v-if="error" :id="messageId" class="text-xs leading-5 text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="messageId" class="text-xs leading-5 text-meta">{{ hint }}</p>
  </div>
</template>
