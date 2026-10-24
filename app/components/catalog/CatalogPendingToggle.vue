<template>
  <label class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs text-body transition-colors hover:bg-ghost-hover">
    <input type="checkbox" class="checkbox checkbox-xs" :checked="modelValue" @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)">
    {{ $t('pending.show_toggle') }}
  </label>
</template>

<script setup lang="ts">
// Catalog lists leave out content awaiting review unless this is ticked (include_pending=1).
defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
