<script setup lang="ts">
const props = withDefaults(defineProps<{
  page: number
  totalPages: number
  disabled?: boolean
}>(), {
  disabled: false,
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
</script>

<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1" :aria-label="$t('common.pagination_label')">
    <button
      type="button"
      :disabled="disabled || page <= 1"
      class="grid size-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-30 disabled:hover:bg-transparent"
      :aria-label="$t('common.previousPage')"
      @click="goTo(page - 1)"
    >
      <Icon name="lucide:chevron-left" class="size-3.5" />
    </button>

    <template v-for="(item, index) in items" :key="`${item}-${index}`">
      <span v-if="item === '…'" class="px-1 text-xs text-slate-400" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="min-w-7 rounded-md px-1.5 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed"
        :class="item === page
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'"
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
      class="grid size-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-30 disabled:hover:bg-transparent"
      :aria-label="$t('common.nextPage')"
      @click="goTo(page + 1)"
    >
      <Icon name="lucide:chevron-right" class="size-3.5" />
    </button>
  </nav>
</template>
