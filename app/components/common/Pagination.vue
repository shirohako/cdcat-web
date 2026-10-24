<script setup lang="ts">
const props = withDefaults(defineProps<{
  page: number
  totalPages: number
  disabled?: boolean
  /** `sm` for tight spots such as table footers. */
  size?: 'sm' | 'md'
}>(), {
  disabled: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:page': [page: number]
}>()

/**
 * Always show the first and last page and a three-page window around the
 * current page. Near either edge, shift the window inward to keep it full.
 */
const items = computed<(number | '…')[]>(() => {
  const { page, totalPages } = props
  if (totalPages <= 1) return [1]

  let lo = page - 1
  let hi = page + 1
  if (lo < 1) hi += 1 - lo
  if (hi > totalPages) lo -= hi - totalPages
  lo = Math.max(lo, 1)
  hi = Math.min(hi, totalPages)

  const window = Array.from({ length: hi - lo + 1 }, (_, index) => lo + index)
  const shown = [...new Set([1, ...window, totalPages])]
    .filter(item => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b)

  const output: (number | '…')[] = []
  let previous = 0
  for (const item of shown) {
    if (previous && item - previous > 1) output.push('…')
    output.push(item)
    previous = item
  }
  return output
})

const goTo = (target: number) => {
  if (
    props.disabled
    || target < 1
    || target > props.totalPages
    || target === props.page
  ) return

  emit('update:page', target)
}

// vivia's page navigation: card-coloured squares, arrows in the theme colour, the current page filled with it.
const SIZES = { sm: 'h-8 min-w-8 rounded-md text-xs', md: 'h-10 min-w-10 rounded-lg text-sm' }
const ICON_SIZES = { sm: 'size-3.5', md: 'size-4' }
const STEP = 'grid place-items-center bg-card text-primary transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active disabled:pointer-events-none disabled:text-faint'
</script>

<template>
  <nav v-if="totalPages > 1" class="flex flex-wrap items-center justify-center gap-1.5" :aria-label="$t('common.pagination_label')">
    <button
      type="button"
      :disabled="disabled || page <= 1"
      :class="[STEP, SIZES[size]]"
      :aria-label="$t('common.previousPage')"
      @click="goTo(page - 1)"
    >
      <Icon name="lucide:chevron-left" :class="ICON_SIZES[size]" />
    </button>

    <template v-for="(item, index) in items" :key="`${item}-${index}`">
      <span v-if="item === '…'" class="grid place-items-center text-faint" :class="SIZES[size]" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="px-2 font-semibold tabular-nums transition-colors duration-150 ease-out disabled:cursor-not-allowed"
        :class="[SIZES[size], item === page ? 'bg-primary text-on-primary' : 'bg-card text-body hover:bg-card-hover active:bg-card-active']"
        :disabled="disabled"
        :aria-current="item === page ? 'page' : undefined"
        :aria-label="$t('common.page_label', { page: item })"
        @click="goTo(item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      :disabled="disabled || page >= totalPages"
      :class="[STEP, SIZES[size]]"
      :aria-label="$t('common.nextPage')"
      @click="goTo(page + 1)"
    >
      <Icon name="lucide:chevron-right" :class="ICON_SIZES[size]" />
    </button>
  </nav>
</template>
