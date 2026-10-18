<template>
  <SkeletonStatus page>
    <div v-if="variant === 'artists'" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="item in total" :key="item" class="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white p-2.5">
        <div class="skeleton size-12 shrink-0 rounded-full" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="skeleton h-3.5 w-3/5 rounded-full" />
          <div class="skeleton h-2.5 w-2/5 rounded-full" />
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'list'" class="space-y-3">
      <div v-for="item in total" :key="item" class="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div class="skeleton h-32 w-22 shrink-0 rounded-lg" />
        <div class="flex flex-1 flex-col py-1">
          <div class="skeleton h-5 w-20 rounded-full" />
          <div class="skeleton mt-3 h-5 w-2/5 rounded-full" />
          <div class="skeleton mt-3 h-3 w-full rounded-full" />
          <div class="skeleton mt-2 h-3 w-4/5 rounded-full" />
          <div class="mt-auto flex gap-3">
            <div class="skeleton h-3 w-24 rounded-full" />
            <div class="skeleton h-3 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'labels'" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="item in total" :key="item" class="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div class="skeleton size-10 shrink-0 rounded-lg" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="skeleton h-3.5 w-3/5 rounded-full" />
          <div class="skeleton h-2.5 w-1/3 rounded-full" />
        </div>
      </div>
    </div>

    <div v-else class="grid" :class="gridClass ?? defaultGrid">
      <div
        v-for="item in total"
        :key="item"
        class="flex flex-col overflow-hidden border border-gray-100 bg-white shadow-sm"
        :class="variant === 'articles' ? 'rounded-2xl' : 'rounded-xl'"
      >
        <div class="skeleton" :class="mediaClass" />

        <!-- AlbumCard: fixed-height rows. -->
        <div v-if="variant === 'covers'" class="flex flex-col gap-2 p-4">
          <div class="flex h-5 items-center"><div class="skeleton h-3.5 w-4/5 rounded-full" /></div>
          <div class="flex h-4 items-center"><div class="skeleton h-3 w-1/2 rounded-full" /></div>
          <div class="flex h-4 items-center"><div class="skeleton h-3 w-2/5 rounded-full" /></div>
          <div class="flex h-6 items-end border-t border-gray-100"><div class="skeleton h-3 w-1/4 rounded-full" /></div>
        </div>

        <!-- ArticleCard: title, summary and the author footer. -->
        <div v-else-if="variant === 'articles'" class="flex flex-1 flex-col p-4">
          <div class="space-y-2">
            <div class="skeleton h-3.5 w-full rounded-full" />
            <div class="skeleton h-3.5 w-3/5 rounded-full" />
          </div>
          <div class="mb-3 mt-3 space-y-1.5">
            <div class="skeleton h-2.5 w-full rounded-full" />
            <div class="skeleton h-2.5 w-full rounded-full" />
            <div class="skeleton h-2.5 w-2/3 rounded-full" />
          </div>
          <div class="mt-auto flex items-center gap-2 border-t border-gray-50 pt-3">
            <div class="skeleton size-5 shrink-0 rounded-full" />
            <div class="skeleton h-2.5 w-16 rounded-full" />
            <div class="skeleton ml-auto h-2.5 w-12 rounded-full" />
          </div>
        </div>

        <div v-else class="space-y-2 p-4">
          <div class="skeleton h-4 w-3/4 rounded-full" />
          <div class="skeleton h-3 w-1/2 rounded-full" />
          <div class="skeleton h-3 w-2/5 rounded-full" />
        </div>
      </div>
    </div>
  </SkeletonStatus>
</template>

<script setup lang="ts">
/**
 * Placeholders for the collection pages, shaped like their items:
 * - `covers`: AlbumCard
 * - `artists`: the artist rows
 * - `list`: the entry cards
 * - `wide`: franchise and event cards
 * - `articles`: ArticleCard
 * - `events`: the event cards of a series, `portrait` (5:7) or landscape
 * - `labels`: the label cards
 */
type Variant = 'covers' | 'artists' | 'list' | 'wide' | 'articles' | 'events' | 'labels'

const props = withDefaults(defineProps<{
  variant?: Variant
  /** How many items; each variant has a default that fills a screen or two. */
  count?: number
  /** Grid classes when the page's grid differs from the variant's usual one. */
  gridClass?: string
  /** For `events`: the series uses portrait (5:7) images. */
  portrait?: boolean
}>(), {
  variant: 'covers',
  count: undefined,
  gridClass: undefined,
})

const COUNTS: Record<Variant, number> = { covers: 10, artists: 12, list: 4, wide: 8, articles: 8, events: 8, labels: 12 }

const total = computed(() => props.count ?? COUNTS[props.variant])

const defaultGrid = computed(() => {
  switch (props.variant) {
    case 'wide': return 'grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4'
    case 'articles': return 'grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    case 'events': return props.portrait ? 'grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
    default: return 'grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5'
  }
})

const mediaClass = computed(() => {
  if (props.variant === 'covers') return 'aspect-square'
  if (props.variant === 'events' && props.portrait) return 'aspect-[5/7]'
  return 'aspect-video'
})
</script>
