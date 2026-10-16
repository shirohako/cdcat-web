<script setup lang="ts">
interface FilterOption {
  value: string
  label: string
  icon?: string
}

type Tone = 'sky' | 'violet' | 'rose' | 'amber' | 'emerald' | 'indigo'

const props = withDefaults(defineProps<{
  title: string
  description: string
  icon: string
  tone?: Tone
  filters?: FilterOption[]
  modelValue?: string
  filterLabel?: string
}>(), {
  tone: 'sky',
  filters: () => [],
  modelValue: 'all',
  filterLabel: 'Filter',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const idleFilterClass = 'bg-white text-slate-500 ring-slate-200 shadow-xs hover:text-slate-900 hover:ring-slate-300'

const toneStyles = computed(() => ({
  sky: {
    icon: 'bg-sky-50 text-sky-600 ring-sky-100',
    active: 'bg-sky-600 text-white ring-sky-600',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 ring-violet-100',
    active: 'bg-violet-600 text-white ring-violet-600',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 ring-rose-100',
    active: 'bg-rose-600 text-white ring-rose-600',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 ring-amber-100',
    active: 'bg-amber-500 text-white ring-amber-500',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    active: 'bg-emerald-600 text-white ring-emerald-600',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    active: 'bg-indigo-600 text-white ring-indigo-600',
  },
})[props.tone])
</script>

<template>
  <section class="border-b border-slate-200/80 bg-white">
    <div class="flex items-start justify-between gap-3 px-4 py-3.5 sm:items-center sm:px-6 sm:py-4.5">
      <div class="flex min-w-0 items-center gap-3.5">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset"
          :class="toneStyles.icon"
        >
          <Icon :name="icon" class="h-5 w-5" />
        </div>

        <div class="min-w-0">
          <h1 class="text-2xl font-bold tracking-[-0.025em] text-slate-950 sm:text-[28px]">
            {{ title }}
          </h1>

          <p class="mt-0.5 truncate text-sm text-slate-500">
            {{ description }}
          </p>
        </div>
      </div>

      <div v-if="$slots.action" class="shrink-0">
        <slot name="action" />
      </div>
    </div>

    <div v-if="filters.length" class="flex items-center gap-2.5 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-6 sm:py-3">
      <span class="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400 sm:inline-flex">
        <Icon name="lucide:list-filter" class="h-3.5 w-3.5" />
        {{ filterLabel }}
      </span>

      <div class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          v-for="filter in filters"
          :key="filter.value"
          type="button"
          class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150"
          :class="modelValue === filter.value
            ? toneStyles.active
            : idleFilterClass"
          :aria-pressed="modelValue === filter.value"
          @click="emit('update:modelValue', filter.value)"
        >
          <Icon v-if="filter.icon" :name="filter.icon" class="h-3.5 w-3.5" />
          {{ filter.label }}
        </button>
      </div>

      <!-- Extra filters (e.g. an event chip) get the same chip classes so they match the row. -->
      <div v-if="$slots['filter-end']" class="shrink-0">
        <slot name="filter-end" :active-class="toneStyles.active" :idle-class="idleFilterClass" />
      </div>
    </div>
  </section>
</template>
