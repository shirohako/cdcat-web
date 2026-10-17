<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-bold text-gray-900">JSON Editor</h2>
    </div>

    <p class="text-sm text-gray-500">
      JSON stays in sync with the form. Paste payload JSON to validate and apply it.
    </p>

    <textarea
      :value="jsonText"
      rows="16"
      spellcheck="false"
      class="textarea textarea-bordered w-full font-mono text-xs bg-gray-50"
      placeholder='{\n  "title": "...",\n  "type": "..." \n}'
      @input="$emit('update:jsonText', ($event.target as HTMLTextAreaElement).value)"
    />

    <div class="flex flex-wrap gap-3">
      <button type="button" class="btn btn-sm btn-primary" @click="$emit('apply')">
        Validate & Apply
      </button>
      <span v-if="success" class="text-sm text-green-600 flex items-center gap-1">
        <i class="i-lucide:check-circle-2 w-4 h-4" /> {{ success }}
      </span>
      <span v-else-if="error" class="text-sm text-red-600 flex items-center gap-1">
        <i class="i-lucide:alert-circle w-4 h-4" /> {{ error }}
      </span>
    </div>

    <div v-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div v-if="success" class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ success }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  jsonText: string
  error: string
  success: string
}>()

defineEmits<{
  'update:jsonText': [value: string]
  apply: []
}>()
</script>
