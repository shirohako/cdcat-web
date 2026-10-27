<script setup lang="ts">
interface FilterOption {
  value: string
  label: string
  icon?: string
}

/**
 * The header of every list page's card (CollectionPageCard's #header), built the same way everywhere:
 *
 * - the icon, title and description, with #action and the `create` button on the right;
 * - when `search` is bound (v-model:search), a search row: the box, its button, then #search-end (the pending switch);
 * - when there are filters, a grey bar: the type chips with #filter-end on one line, #filters (narrower filters,
 *   a result count) on the next.
 */
withDefaults(defineProps<{
  title: string
  description: string
  icon: string
  /** The "new" button on the right: a plus in a circle (UiCreateButton), its label in a tooltip. */
  create?: { to: string, label: string }
  filters?: FilterOption[]
  modelValue?: string
  filterLabel?: string
  searchPlaceholder?: string
}>(), {
  create: undefined,
  filters: () => [],
  modelValue: 'all',
  filterLabel: 'Filter',
  searchPlaceholder: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** The search row was submitted. */
  'search': []
}>()

/** What is typed in the search row; leaving it unbound leaves the row out. */
const search = defineModel<string>('search')

// Filter chips: the chosen one in the theme colour, the rest plain grey in the light theme (the quiet button colour
// in the dark one). #filter-end and #filters get the same classes so extra filters match the row.
const activeFilterClass = 'bg-primary text-on-primary ring-primary'
const idleFilterClass = 'bg-black/5 text-body ring-transparent hover:bg-black/10 dark:bg-btn dark:text-btn-content dark:hover:bg-btn-hover'
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

      <div v-if="$slots.action || create" class="flex shrink-0 items-center gap-2">
        <slot name="action" />
        <UiCreateButton v-if="create" :to="create.to" :label="create.label" />
      </div>
    </div>

    <form
      v-if="search !== undefined"
      class="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 sm:px-6"
      role="search"
      @submit.prevent="emit('search')"
    >
      <label class="flex h-9 min-w-48 flex-1 items-center gap-2 rounded-lg bg-field px-3 ring-1 ring-line focus-within:ring-primary">
        <Icon name="lucide:search" class="h-4 w-4 shrink-0 text-faint" />
        <input
          v-model="search"
          type="search"
          maxlength="100"
          class="min-w-0 flex-1 bg-transparent text-sm text-title outline-none placeholder:text-faint"
          :placeholder="searchPlaceholder"
          :aria-label="searchPlaceholder"
        >
      </label>
      <button type="submit" class="btn btn-primary btn-sm h-9 shrink-0 text-xs">{{ $t('catalog.search') }}</button>
      <slot name="search-end" />
    </form>

    <div v-if="filters.length || $slots.filters" class="space-y-2.5 border-t border-line bg-sunken px-4 py-2.5 sm:px-6 sm:py-3">
      <div v-if="filters.length" class="flex items-center gap-2.5">
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

        <div v-if="$slots['filter-end']" class="shrink-0">
          <slot name="filter-end" :active-class="activeFilterClass" :idle-class="idleFilterClass" />
        </div>
      </div>

      <div v-if="$slots.filters" class="flex flex-wrap items-center gap-2">
        <slot name="filters" :active-class="activeFilterClass" :idle-class="idleFilterClass" />
      </div>
    </div>
  </section>
</template>
