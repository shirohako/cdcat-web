<template>
  <SkeletonStatus :page="page">
    <div :class="cards ? 'space-y-3' : 'card divide-y divide-line overflow-hidden'">
      <div
        v-for="row in count"
        :key="row"
        class="flex items-center gap-3"
        :class="cards ? 'card p-4' : 'px-4 py-3'"
      >
        <div v-if="thumb === 'square'" class="skeleton size-12 shrink-0 rounded-lg" />
        <div v-else-if="thumb === 'round'" class="skeleton size-10 shrink-0 rounded-full" />
        <div v-else-if="thumb === 'dot'" class="skeleton size-2 shrink-0 self-start rounded-full mt-1.5" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="skeleton h-3.5 rounded-full" :class="TITLE_WIDTHS[row % TITLE_WIDTHS.length]" />
          <div class="skeleton h-2.5 rounded-full" :class="META_WIDTHS[row % META_WIDTHS.length]" />
          <div v-if="cards" class="skeleton h-2.5 w-1/4 rounded-full" />
        </div>
      </div>
    </div>
  </SkeletonStatus>
</template>

<script setup lang="ts">
/** Placeholder rows for a list: in one bordered box with dividers, or (`cards`) as separate cards. */
withDefaults(defineProps<{
  count?: number
  thumb?: 'none' | 'square' | 'round' | 'dot'
  cards?: boolean
  /** The list is the page's main data. */
  page?: boolean
}>(), {
  count: 5,
  thumb: 'none',
})

const TITLE_WIDTHS = ['w-2/5', 'w-3/5', 'w-1/2', 'w-2/3', 'w-1/3']
const META_WIDTHS = ['w-1/4', 'w-1/3', 'w-1/5', 'w-2/5', 'w-1/4']
</script>
