<script setup lang="ts">
/**
 * What the album list keeps behind 更多筛选 (and ⋯ on phones): the type, the year and the event, and the pending
 * switch. `rows` lays each out as a labelled row, for the panel that folds open under the bar on wider screens;
 * otherwise they stack, for the ⋯ menu. The chip classes come from AlbumListFilters so these match its own chips.
 */
withDefaults(defineProps<{
  types: { value: string, label: string }[]
  type: string
  eventId: number | null
  year: number | null
  pending: boolean
  chip: string
  on: string
  off: string
  rows?: boolean
}>(), { rows: false })

const emit = defineEmits<{
  type: [value: string]
  event: [value: number | null]
  year: [value: number | null]
  pending: [value: boolean]
}>()

const { t } = useI18n()
</script>

<template>
  <div :class="rows ? 'grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3' : ''">
    <p class="text-xs font-semibold text-meta" :class="rows ? '' : 'mb-2'">{{ t('content_display.type') }}</p>
    <div class="flex flex-wrap gap-1.5">
      <button v-for="option in types" :key="option.value" type="button" :class="[chip, type === option.value ? on : off]" :aria-pressed="type === option.value" @click="emit('type', option.value)">
        {{ option.label }}
      </button>
    </div>
    <!-- An event fixes the year, so the page clears one when the other is picked. -->
    <p class="text-xs font-semibold text-meta" :class="rows ? '' : 'mb-2 mt-4'">{{ t('albums.time_filter') }}</p>
    <div class="flex flex-wrap gap-1.5">
      <CollectionYearFilter :model-value="year" :label="t('albums.year_filter')" :active-class="on" :idle-class="off" @update:model-value="value => emit('year', value)" />
      <EventFilterMenu :model-value="eventId" :label="t('albums.event_filter_label')" :active-class="on" :idle-class="off" @update:model-value="value => emit('event', value)" />
    </div>
    <p v-if="rows" class="text-xs font-semibold text-meta">{{ t('albums.review_filter') }}</p>
    <div :class="rows ? '-ml-2' : '-mx-1 mt-4 border-t border-line pt-2'">
      <CatalogPendingToggle :model-value="pending" @update:model-value="value => emit('pending', value)" />
    </div>
  </div>
</template>
