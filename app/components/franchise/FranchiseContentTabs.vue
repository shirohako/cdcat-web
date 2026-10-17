<template>
  <div class="rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-gray-200 p-2 shadow-sm">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border"
        :class="modelValue === tab.id
          ? 'bg-white text-slate-900 border-slate-200 shadow-[0_6px_18px_rgba(15,23,42,0.12)]'
          : 'text-gray-500 border-transparent hover:bg-white hover:text-slate-800 hover:border-slate-200'"
        @click="selectTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const selectTab = (id: string) => {
  if (id !== props.modelValue) {
    emit('update:modelValue', id)
  }
}
</script>
