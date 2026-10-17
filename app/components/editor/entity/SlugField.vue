<template>
  <details>
    <summary class="cursor-pointer text-sm font-medium text-gray-600">{{ $t('editor.advanced') }}</summary>
    <label class="mt-3 block max-w-sm">
      <span class="mb-1 block text-xs font-medium text-gray-600">{{ $t('catalog.field.slug') }}</span>
      <input v-model="model" class="input input-sm w-full font-mono" :class="{ 'input-error': error }" placeholder="my-name">
      <span class="mt-1 block text-[11px]" :class="error ? 'text-error' : 'text-gray-400'">{{ error ?? $t('catalog.form.slug_hint') }}</span>
    </label>
  </details>
</template>

<script setup lang="ts">
const model = defineModel<string | null>({ required: true })
const editor = useEntityEditor()
const error = computed(() => editor.errorAt('slug'))
</script>
