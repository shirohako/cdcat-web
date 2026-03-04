<template>
  <div class="-mx-6 md:-mx-8 px-6 md:px-8 border-b border-gray-100 pb-4">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
        :class="modelValue === tab.id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'"
        @click="selectTab(tab.id)"
      >
        <Icon v-if="tab.icon" :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TabItem {
  id: string
  label: string
  icon?: string
}

const props = defineProps<{
  tabs: TabItem[]
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const selectTab = (id: string) => {
  if (id !== props.modelValue) {
    emit('update:modelValue', id)
  }
}
</script>
