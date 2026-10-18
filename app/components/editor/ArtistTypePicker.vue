<template>
  <div>
    <span class="mb-1.5 block text-sm font-medium text-gray-700">{{ $t('editor.dialog.new_artist_type') }} <span class="text-error">*</span></span>
    <div class="flex flex-wrap gap-1.5" role="radiogroup" :aria-label="$t('editor.dialog.new_artist_type')">
      <button
        v-for="value in enums.artist_type ?? []"
        :key="value"
        type="button"
        role="radio"
        class="rounded-full border px-3 py-1 text-xs transition-colors"
        :class="model === value ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-700' : invalid ? 'border-rose-300 text-gray-600 hover:border-rose-400' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        :aria-checked="model === value"
        @click="model = value"
      >{{ enumLabel('artist_type', value) }}</button>
    </div>
    <span v-if="invalid" class="mt-1 block text-xs text-error">{{ $t('editor.dialog.new_artist_type_required') }}</span>
  </div>
</template>

<script setup lang="ts">
/** The required type of an artist created on the spot in a dialog; nothing is picked to begin with. */
defineProps<{ invalid?: boolean }>()
const model = defineModel<string | null>({ required: true })
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const enums = computed(() => schema.value?.enums ?? {})
</script>
