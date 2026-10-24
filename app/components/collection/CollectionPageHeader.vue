<script setup lang="ts">
interface FilterOption {
  value: string
  label: string
  icon?: string
}

withDefaults(defineProps<{
  title: string
  description: string
  icon: string
  filters?: FilterOption[]
  modelValue?: string
  filterLabel?: string
}>(), {
  filters: () => [],
  modelValue: 'all',
  filterLabel: 'Filter',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Filter chips as in vivia: the chosen one in the theme colour, the rest on the quiet button colour. The
// filter-end slot gets the same classes so extra filters match the row.
const activeFilterClass = 'bg-primary text-on-primary ring-primary'
const idleFilterClass = 'bg-btn text-btn-content ring-transparent hover:bg-btn-hover'
</script>

<template>
  <section class="border-b border-line">
    <div class="flex items-start justify-between gap-3 px-4 py-3.5 sm:items-center sm:px-6 sm:py-4.5">
      <div class="flex min-w-0 items-center gap-3.5">
        <UiIconTile :icon="icon" />

        <div class="min-w-0">
          <h1 class="text-2xl font-bold tracking-[-0.025em] text-title sm:text-[28px]">
            {{ title }}
          </h1>

          <p class="mt-0.5 truncate text-sm text-meta">
            {{ description }}
          </p>
        </div>
      </div>

      <div v-if="$slots.action" class="shrink-0">
        <slot name="action" />
      </div>
    </div>

    <div v-if="filters.length" class="flex items-center gap-2.5 border-t border-line bg-sunken px-4 py-2.5 sm:px-6 sm:py-3">
      <span class="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-faint sm:inline-flex">
        <Icon name="lucide:list-filter" class="h-3.5 w-3.5" />
        {{ filterLabel }}
      </span>

      <div class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          v-for="filter in filters"
          :key="filter.value"
          type="button"
          class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150"
          :class="modelValue === filter.value ? activeFilterClass : idleFilterClass"
          :aria-pressed="modelValue === filter.value"
          @click="emit('update:modelValue', filter.value)"
        >
          <Icon v-if="filter.icon" :name="filter.icon" class="h-3.5 w-3.5" />
          {{ filter.label }}
        </button>
      </div>

      <!-- Extra filters (e.g. an event chip) get the same chip classes so they match the row. -->
      <div v-if="$slots['filter-end']" class="shrink-0">
        <slot name="filter-end" :active-class="activeFilterClass" :idle-class="idleFilterClass" />
      </div>
    </div>
  </section>
</template>
