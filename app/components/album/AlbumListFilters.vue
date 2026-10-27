<script setup lang="ts">
interface Option { value: string, label: string }

/**
 * The album list's filters, under the header (whose #tabs hold the sort). Categories come first, as chips: a row that
 * scrolls sideways on phones; on wider screens they wrap, with a short search box at the row's end. Below them:
 *
 * - phones: the search box and ⋯, which holds the type, the year, the event and the pending switch (AlbumMoreFilters);
 * - wider screens: 更多筛选, which folds the same open as labelled rows under the bar, a tag for each of those that
 *   is on, then 清除.
 *
 * The page keeps the state in the URL; this only shows it and says what was picked.
 */
const props = defineProps<{
  categories: Option[]
  category: string | null
  types: Option[]
  type: string
  eventId: number | null
  year: number | null
  pending: boolean
  /** Anything narrowing the list, for 清除 */
  filtered: boolean
  searchPlaceholder: string
}>()

const emit = defineEmits<{
  category: [value: string | null]
  type: [value: string]
  event: [value: number | null]
  year: [value: number | null]
  pending: [value: boolean]
  search: []
  clear: []
}>()

const search = defineModel<string>('search', { required: true })

const { t } = useI18n()
const { selected: event } = useEventLookup(toRef(props, 'eventId'))
const typeLabel = computed(() => props.types.find(option => option.value === props.type)?.label ?? props.type)
/** The filters 更多筛选 holds, counted on its button. */
const hiddenOn = computed(() => [props.type !== 'all', !!props.eventId, !!props.year, props.pending].filter(Boolean).length)
/** Whether 更多筛选 is folded open (wider screens). */
const moreOpen = ref(false)
const morePanelId = useId()

// The bar's chips: the chosen one in the theme colour, the rest plain grey (the quiet button colour in the dark theme).
const CHIP = 'inline-flex h-7.5 shrink-0 items-center rounded-md px-3 text-[13px] font-medium whitespace-nowrap ring-1 ring-inset transition-colors duration-150 ease-out'
const ON = 'bg-primary text-on-primary ring-primary'
const OFF = 'bg-black/5 text-body ring-transparent hover:bg-black/10 dark:bg-btn dark:text-btn-content dark:hover:bg-btn-hover'
const TAG = 'inline-flex h-6.5 items-center gap-1 rounded-md bg-black/5 pl-2.5 pr-1.5 text-xs font-medium text-body transition-colors hover:bg-black/10 dark:bg-btn dark:hover:bg-btn-hover'
</script>

<template>
  <div class="border-b border-line">
    <!-- Categories: second only to the sort -->
    <div class="flex items-start gap-4 px-4 pt-3 sm:px-6 sm:pt-4">
      <div class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden" role="group" :aria-label="t('albums.category_filter')">
        <button type="button" :class="[CHIP, category ? OFF : ON]" :aria-pressed="!category" @click="emit('category', null)">{{ t('common.all') }}</button>
        <button
          v-for="option in categories"
          :key="option.value"
          type="button"
          :class="[CHIP, category === option.value ? ON : OFF]"
          :aria-pressed="category === option.value"
          @click="emit('category', category === option.value ? null : option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <CollectionSearchBox v-model="search" class="hidden w-52 shrink-0 sm:flex" :placeholder="searchPlaceholder" @submit="emit('search')" />
    </div>

    <!-- Phones: search, and everything else under ⋯ (in the theme colour, with a count, while any of it is on) -->
    <div class="flex items-center gap-1.5 px-4 pb-3 pt-2.5 sm:hidden">
      <CollectionSearchBox v-model="search" class="flex min-w-0 flex-1" :placeholder="searchPlaceholder" @submit="emit('search')" />
      <UiPopover placement="bottom-end" :label="t('albums.more_filters')" class="w-[min(20rem,calc(100vw-2rem))] p-3.5!">
        <template #trigger="{ toggle, attrs }">
          <button
            type="button"
            class="inline-flex h-7.5 shrink-0 items-center gap-1 rounded-md px-2.5"
            :class="hiddenOn ? ON : OFF"
            :aria-label="t('albums.more_filters')"
            v-bind="attrs"
            @click="toggle"
          >
            <Icon name="lucide:ellipsis" class="size-4" />
            <span v-if="hiddenOn" class="text-xs font-semibold tabular-nums">{{ hiddenOn }}</span>
          </button>
        </template>
        <AlbumMoreFilters
          :types="types" :type="type" :event-id="eventId" :year="year" :pending="pending" :chip="CHIP" :on="ON" :off="OFF"
          @type="value => emit('type', value)" @event="value => emit('event', value)" @year="value => emit('year', value)" @pending="value => emit('pending', value)"
        />
      </UiPopover>
    </div>

    <!-- Wider screens: 更多筛选, and what in it is on -->
    <div class="hidden flex-wrap items-center gap-2 px-6 pb-4 pt-3 sm:flex">
      <button
        type="button"
        class="inline-flex h-7.5 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium ring-1 ring-inset ring-line transition-colors duration-150 ease-out hover:bg-black/5 dark:hover:bg-white/5"
        :class="moreOpen ? 'bg-black/5 dark:bg-white/5' : ''"
        :aria-expanded="moreOpen"
        :aria-controls="morePanelId"
        @click="moreOpen = !moreOpen"
      >
        <Icon name="lucide:sliders-horizontal" class="size-3.5" />
        {{ t('albums.more_filters') }}
        <span v-if="hiddenOn" class="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold tabular-nums text-on-primary">{{ hiddenOn }}</span>
        <Icon name="lucide:chevron-down" class="size-3 opacity-60 transition-transform duration-200 ease-out" :class="moreOpen ? 'rotate-180' : ''" />
      </button>

      <button v-if="type !== 'all'" type="button" :class="TAG" :aria-label="t('albums.remove_filter', { name: typeLabel })" @click="emit('type', 'all')">
        {{ typeLabel }}<Icon name="lucide:x" class="size-3 opacity-60" />
      </button>
      <button v-if="year" type="button" :class="TAG" :aria-label="t('albums.remove_filter', { name: year })" @click="emit('year', null)">
        <span class="tabular-nums">{{ year }}</span><Icon name="lucide:x" class="size-3 opacity-60" />
      </button>
      <button v-if="eventId" type="button" :class="TAG" class="max-w-60" :aria-label="t('albums.remove_filter', { name: event?.name ?? '' })" @click="emit('event', null)">
        <span class="truncate">{{ event?.name ?? `#${eventId}` }}</span><Icon name="lucide:x" class="size-3 shrink-0 opacity-60" />
      </button>
      <button v-if="pending" type="button" :class="TAG" @click="emit('pending', false)">
        {{ t('albums.pending_tag') }}<Icon name="lucide:x" class="size-3 opacity-60" />
      </button>
      <button v-if="filtered" type="button" class="ml-1 text-xs font-medium text-meta transition-colors hover:text-primary" @click="emit('clear')">
        {{ t('albums.clear_filters') }}
      </button>
    </div>

    <!-- 更多筛选 folds open here, pushing the list down; the grid rows animate the height. -->
    <div
      :id="morePanelId"
      class="hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none sm:grid"
      :class="moreOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      :inert="!moreOpen"
    >
      <div class="min-h-0 overflow-hidden">
        <AlbumMoreFilters
          rows
          class="mx-6 mb-4 rounded-lg bg-black/[0.025] p-4 dark:bg-white/[0.03]"
          :types="types" :type="type" :event-id="eventId" :year="year" :pending="pending" :chip="CHIP" :on="ON" :off="OFF"
          @type="value => emit('type', value)" @event="value => emit('event', value)" @year="value => emit('year', value)" @pending="value => emit('pending', value)"
        />
      </div>
    </div>
  </div>
</template>
