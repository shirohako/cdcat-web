<template>
  <UiTabs :model-value="modelValue" :items="items" variant="segmented" @update:model-value="selectTab" />
</template>

<script setup lang="ts">
// Two views of the series' content (entries, albums): a compact switch.
interface TabItem {
  id: string
  label: string
}

const props = defineProps<{
  tabs: TabItem[]
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const items = computed(() => props.tabs.map(tab => ({ value: tab.id, label: tab.label })))

const selectTab = (id?: string) => {
  if (id && id !== props.modelValue) {
    emit('update:modelValue', id)
  }
}
</script>
