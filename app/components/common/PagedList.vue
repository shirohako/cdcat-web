<script setup lang="ts">
/**
 * A list page's results with its pages around them: below, always (with one page too), which results are on screen
 * and how many there are on the left and
 * the pages centred; above, the same, once the page holds more than `topAfter` items, so a short page has only the
 * row below. Both rows leave once nothing was found, so the slot's empty state stands alone.
 */
const props = withDefaults(defineProps<{
  page: number
  totalPages: number
  /** Results across all pages. */
  total: number
  /** Results on this page. */
  count: number
  /** Results a full page holds, for the range on screen. */
  perPage: number
  /** More results than this on a page and the pages show above them too: two rows of the widest card grid by
   *  default, fewer for tall rows. */
  topAfter?: number
  disabled?: boolean
}>(), {
  topAfter: 10,
  disabled: false,
})

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const { locale } = useI18n()
const number = computed(() => new Intl.NumberFormat(locale.value))

/**
 * The count line: just the total when every result is on this page, else the range on screen and the total
 * ("Showing 51–100 of 1,873 records"), a single number when the page holds one. The numbers stand out of the words.
 */
const line = computed(() => {
  const from = (props.page - 1) * props.perPage + 1
  const to = from + props.count - 1
  const format = number.value.format
  if (props.count >= props.total) return { keypath: 'common.results_all', range: '', total: format(props.total) }
  return {
    keypath: from === to ? 'common.results_one' : 'common.results_range',
    range: from === to ? format(from) : `${format(from)}–${format(to)}`,
    total: format(props.total),
  }
})
</script>

<template>
  <div>
    <CommonPagination
      v-if="count > topAfter"
      class="mb-6"
      :page="page"
      :total-pages="totalPages"
      :disabled="disabled"
      @update:page="emit('update:page', $event)"
    >
      <template #summary>
        <i18n-t :keypath="line.keypath" scope="global">
          <template #range><span class="font-semibold text-body">{{ line.range }}</span></template>
          <template #total><span class="font-semibold text-body">{{ line.total }}</span></template>
        </i18n-t>
      </template>
    </CommonPagination>
    <slot />
    <CommonPagination
      v-if="count"
      class="mt-6"
      :page="page"
      :total-pages="totalPages"
      :disabled="disabled"
      @update:page="emit('update:page', $event)"
    >
      <template #summary>
        <i18n-t :keypath="line.keypath" scope="global">
          <template #range><span class="font-semibold text-body">{{ line.range }}</span></template>
          <template #total><span class="font-semibold text-body">{{ line.total }}</span></template>
        </i18n-t>
      </template>
    </CommonPagination>
  </div>
</template>
