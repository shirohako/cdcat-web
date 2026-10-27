<template>
  <!-- The article grid counts columns by its own width (container queries), so the frame is the container. -->
  <SkeletonStatus page :class="{ '@container': variant === 'articles' }">
    <div v-if="variant === 'artists'" class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <div v-for="item in total" :key="item" class="flex items-center gap-2.5 rounded-lg bg-black/[0.025] px-3 py-2.5 dark:bg-white/[0.04]">
        <div class="skeleton size-6 shrink-0 rounded-full" />
        <div class="skeleton h-3 w-3/5 rounded-full" />
      </div>
    </div>

    <div v-else-if="variant === 'list'" class="space-y-3">
      <div v-for="item in total" :key="item" class="flex gap-4 rounded-xl bg-sunken p-4">
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
      <div v-for="item in total" :key="item" class="card flex items-center gap-3 p-4">
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
        class="flex flex-col overflow-hidden"
        :class="variant === 'events' ? '@container rounded-[14px] bg-card p-1.5 ring-1 ring-line' : variant === 'articles' ? 'rounded-[14px] bg-card p-1.5 ring-1 ring-line' : variant === 'covers' ? 'rounded-xl bg-black/[0.035] dark:bg-white/[0.04]' : 'rounded-xl bg-sunken'"
      >
        <div class="skeleton" :class="mediaClass" />

        <!-- AlbumCard: fixed-height rows. -->
        <div v-if="variant === 'covers'" class="flex flex-col gap-2 p-4">
          <div class="flex h-5 items-center"><div class="skeleton h-3.5 w-4/5 rounded-full" /></div>
          <div class="flex h-4 items-center"><div class="skeleton h-3 w-1/2 rounded-full" /></div>
          <div class="flex h-4 items-center"><div class="skeleton h-3 w-2/5 rounded-full" /></div>
          <div class="flex h-6 items-end border-t border-line"><div class="skeleton h-3 w-1/4 rounded-full" /></div>
        </div>

        <!-- ArticleCard: an inset cover, then type, title, summary, and the poster with the date under the name. -->
        <div v-else-if="variant === 'articles'" class="flex flex-1 flex-col px-2.5 pb-2.5 pt-3">
          <div class="skeleton mb-2.5 h-2.5 w-12 rounded-full" />
          <div class="space-y-2">
            <div class="skeleton h-3.5 w-full rounded-full" />
            <div class="skeleton h-3.5 w-3/5 rounded-full" />
          </div>
          <div class="mt-3 space-y-1.5">
            <div class="skeleton h-2.5 w-full rounded-full" />
            <div class="skeleton h-2.5 w-2/3 rounded-full" />
          </div>
          <div class="mt-auto flex items-center gap-2.5 pt-4">
            <div class="skeleton size-8 shrink-0 rounded-full" />
            <div class="flex-1 space-y-1.5">
              <div class="skeleton h-2.5 w-20 rounded-full" />
              <div class="skeleton h-2 w-14 rounded-full" />
            </div>
          </div>
        </div>

        <!-- Event cards: an inset visual, then the code, the name, and the date and album rows at the foot. -->
        <div v-else-if="variant === 'events'" class="flex flex-1 flex-col px-1 pb-1 pt-2 @min-[9rem]:px-2.5 @min-[9rem]:pb-2.5 @min-[9rem]:pt-3">
          <div class="skeleton mb-2 h-2.5 w-10 rounded-full" />
          <div class="skeleton h-3.5 w-4/5 rounded-full" />
          <div class="mt-auto space-y-1.5 pt-3.5">
            <div class="skeleton h-2.5 w-3/4 rounded-full" />
            <div class="skeleton h-2.5 w-1/2 rounded-full" />
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
 * - `events`: the event cards of a series (cards on the page), `portrait` (5:7) or landscape
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

const COUNTS: Record<Variant, number> = { covers: 10, artists: 30, list: 4, wide: 8, articles: 8, events: 8, labels: 12 }

const total = computed(() => props.count ?? COUNTS[props.variant])

const defaultGrid = computed(() => {
  switch (props.variant) {
    case 'wide': return 'grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4'
    case 'articles': return 'grid-cols-1 gap-5 @lg:grid-cols-2 @4xl:grid-cols-3'
    case 'events': return props.portrait ? 'grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'
    default: return 'grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5'
  }
})

const mediaClass = computed(() => {
  if (props.variant === 'covers') return 'aspect-square'
  if (props.variant === 'events') return props.portrait ? 'aspect-[5/7] rounded-lg' : 'aspect-video rounded-lg'
  if (props.variant === 'articles') return 'aspect-video rounded-lg'
  return 'aspect-video'
})
</script>
