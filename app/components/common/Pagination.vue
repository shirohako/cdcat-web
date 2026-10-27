<script setup lang="ts">
const props = withDefaults(defineProps<{
  page: number
  totalPages: number
  disabled?: boolean
  /** `xs` (the default) everywhere on the site; `sm` and `md` are larger. */
  size?: 'xs' | 'sm' | 'md'
  /** A line such as the result count (or the #summary slot), on the left with the pages centred; with it the pages
   *  always show. */
  summary?: string
  /** Show the pages even when there is only one. */
  always?: boolean
}>(), {
  disabled: false,
  size: 'xs',
  summary: undefined,
  always: false,
})

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const { t } = useI18n()

/** Pages a click on "…" skips. */
const SKIP = 5

type Item = number | 'back' | 'forward'

/**
 * The first and last page, `siblings` pages either side of the current one and a "…" for each gap, always in
 * 2 × siblings + 5 slots, so the bar keeps its width from page to page: with one sibling, 1 2 3 4 5 … 13,
 * 1 … 6 7 8 … 13 and 1 … 9 10 11 12 13.
 */
const pageItems = (page: number, total: number, siblings: number): Item[] => {
  const slots = 2 * siblings + 5
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index)
  if (total <= slots) return range(1, Math.max(total, 1))
  if (page <= siblings + 3) return [...range(1, slots - 2), 'forward', total]
  if (page >= total - siblings - 2) return [1, 'back', ...range(total - slots + 3, total)]
  return [1, 'back', ...range(page - siblings, page + siblings), 'forward', total]
}

// Phones get one page either side fewer than wider screens.
const narrowItems = computed(() => pageItems(props.page, props.totalPages, 0))
const wideItems = computed(() => pageItems(props.page, props.totalPages, 1))
/** Pages left out on wider screens too: then a box takes a page number. */
const hasGaps = computed(() => wideItems.value.length < props.totalPages)

const goTo = (target: number) => {
  if (
    props.disabled
    || target < 1
    || target > props.totalPages
    || target === props.page
  ) return

  emit('update:page', target)
}

const skip = (item: 'back' | 'forward') => goTo(item === 'back' ? Math.max(1, props.page - SKIP) : Math.min(props.totalPages, props.page + SKIP))

// Out of range is taken as the nearest end; anything that is not a number is dropped.
const jumpInput = ref('')
// Only digits stay in the box.
watch(jumpInput, (value) => {
  const digits = value.replace(/\D/g, '')
  if (digits !== value) jumpInput.value = digits
})
const jump = () => {
  const target = Number.parseInt(jumpInput.value, 10)
  jumpInput.value = ''
  if (Number.isFinite(target)) goTo(Math.min(props.totalPages, Math.max(1, target)))
}

// vivia's page navigation: card-coloured squares, arrows in the theme colour, the current page filled with it.
const SIZES = { xs: 'h-7 min-w-7 rounded-md text-xs', sm: 'h-8 min-w-8 rounded-md text-xs', md: 'h-10 min-w-10 rounded-lg text-sm' }
const ICON_SIZES = { xs: 'size-3.5', sm: 'size-3.5', md: 'size-4' }
const STEP = 'grid place-items-center bg-card text-primary transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active disabled:pointer-events-none disabled:text-faint'
</script>

<template>
  <!-- With a summary: the line on the left and the same pages (without it) in the middle; stacked on phones. -->
  <div v-if="summary || $slots.summary" class="flex flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
    <p class="text-xs tabular-nums text-meta sm:justify-self-start"><slot name="summary">{{ summary }}</slot></p>
    <CommonPagination :page="page" :total-pages="totalPages" :disabled="disabled" :size="size" always @update:page="emit('update:page', $event)" />
  </div>
  <nav v-else-if="always || totalPages > 1" class="flex flex-wrap items-center justify-center gap-1.5" :aria-label="t('common.pagination_label')">
    <button
      type="button"
      :disabled="disabled || page <= 1"
      :class="[STEP, SIZES[size]]"
      :aria-label="t('common.previousPage')"
      @click="goTo(page - 1)"
    >
      <Icon name="lucide:chevron-left" :class="ICON_SIZES[size]" />
    </button>

    <div v-for="list in [{ items: narrowItems, class: 'contents sm:hidden' }, { items: wideItems, class: 'hidden sm:contents' }]" :key="list.class" :class="list.class">
      <template v-for="item in list.items" :key="item">
        <!-- "…" skips five pages; hovered or focused, it shows which way. -->
        <button
          v-if="item === 'back' || item === 'forward'"
          type="button"
          class="group/skip grid place-items-center text-faint transition-colors duration-150 ease-out hover:text-primary disabled:pointer-events-none"
          :class="SIZES[size]"
          :disabled="disabled"
          :aria-label="t(item === 'back' ? 'common.pagination_back' : 'common.pagination_forward', { count: SKIP })"
          @click="skip(item)"
        >
          <span class="group-hover/skip:hidden group-focus-visible/skip:hidden" aria-hidden="true">…</span>
          <Icon :name="item === 'back' ? 'lucide:chevrons-left' : 'lucide:chevrons-right'" class="hidden group-hover/skip:block group-focus-visible/skip:block" :class="ICON_SIZES[size]" />
        </button>
        <button
          v-else
          type="button"
          class="px-2 font-semibold tabular-nums transition-colors duration-150 ease-out disabled:cursor-not-allowed"
          :class="[SIZES[size], item === page ? 'bg-primary text-on-primary' : 'bg-card text-body hover:bg-card-hover active:bg-card-active']"
          :disabled="disabled"
          :aria-current="item === page ? 'page' : undefined"
          :aria-label="t('common.page_label', { page: item })"
          @click="goTo(item)"
        >
          {{ item }}
        </button>
      </template>
    </div>

    <button
      type="button"
      :disabled="disabled || page >= totalPages"
      :class="[STEP, SIZES[size]]"
      :aria-label="t('common.nextPage')"
      @click="goTo(page + 1)"
    >
      <Icon name="lucide:chevron-right" :class="ICON_SIZES[size]" />
    </button>

    <!-- Wider screens, when pages are left out: type a page number and press Enter. A chip like the pages, set off
         by a hairline, with the current page as its placeholder. -->
    <i18n-t v-if="hasGaps" keypath="common.pagination_jump" tag="label" scope="global" class="ml-1.5 hidden h-5 items-center gap-1.5 border-l border-line pl-3 text-xs text-meta sm:inline-flex">
      <template #input>
        <input
          v-model="jumpInput"
          type="text"
          inputmode="numeric"
          maxlength="5"
          :placeholder="String(page)"
          class="w-10 bg-card px-1 text-center font-semibold tabular-nums text-title caret-primary outline-none ring-1 ring-inset ring-transparent transition-[background-color,box-shadow] duration-150 ease-out placeholder:font-medium placeholder:text-faint hover:bg-card-hover focus:bg-card focus:ring-primary disabled:pointer-events-none disabled:opacity-60"
          :class="SIZES[size]"
          :disabled="disabled"
          :aria-label="t('common.pagination_jump_label')"
          @keydown.enter.prevent="jump"
        >
      </template>
    </i18n-t>
  </nav>
</template>
