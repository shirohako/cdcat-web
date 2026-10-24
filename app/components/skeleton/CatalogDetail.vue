<template>
  <SkeletonStatus page>
    <!-- Full-width heroes (albums, tracks, entries, franchises) come with their own body container. -->
    <div v-if="hero === 'album' || hero === 'track'" class="bg-card">
      <div class="container mx-auto max-w-6xl px-4 pb-7 pt-5 md:px-12 md:py-10 lg:px-20 xl:px-8 2xl:max-w-7xl">
        <div class="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-10">
          <div v-if="hero === 'track'" class="skeleton size-36 shrink-0 rounded-md sm:size-44 md:size-48 lg:size-56" />
          <div v-else class="skeleton size-44 shrink-0 rounded-md sm:size-56 md:size-60 lg:size-72 xl:size-80 2xl:size-96" />
          <div class="flex w-full flex-1 flex-col items-center gap-3 rounded-lg bg-sunken p-3 sm:p-4 md:items-start md:p-6">
            <div class="skeleton h-7 w-3/5 rounded-md" />
            <div class="skeleton h-4 w-2/5 rounded-full" />
            <div class="skeleton mt-2 h-4 w-1/3 rounded-full" />
            <div class="mt-2 flex gap-2">
              <div class="skeleton h-6 w-16 rounded" />
              <div class="skeleton h-6 w-12 rounded" />
            </div>
            <div class="skeleton h-4 w-1/2 rounded-full" />
            <div class="skeleton h-4 w-2/5 rounded-full" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="hero === 'poster'" class="h-96 w-full bg-hero">
      <div class="container mx-auto flex h-full max-w-6xl items-end gap-6 px-4 pb-8 md:px-8 2xl:max-w-7xl">
        <div class="skeleton skeleton-dark hidden aspect-2/3 w-40 shrink-0 rounded-xl sm:block md:w-48" />
        <div class="flex-1 space-y-3">
          <div class="skeleton skeleton-dark h-5 w-24 rounded-full" />
          <div class="skeleton skeleton-dark h-9 w-3/5 rounded-md md:h-12" />
          <div class="skeleton skeleton-dark h-4 w-2/5 rounded-full" />
        </div>
      </div>
    </div>

    <div v-else-if="hero === 'gradient'" class="relative h-80 bg-linear-to-br from-primary-strong to-hero">
      <div class="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <div class="container mx-auto max-w-6xl space-y-3 2xl:max-w-7xl">
          <div class="skeleton skeleton-dark h-4 w-28 rounded-full" />
          <div class="skeleton skeleton-dark h-9 w-1/2 rounded-md" />
          <div class="skeleton skeleton-dark h-4 w-1/3 rounded-full" />
        </div>
      </div>
    </div>

    <!-- The other heroes sit inside the page's own container. -->
    <div v-else-if="hero === 'tile'" class="mb-6 flex items-start gap-4">
      <div class="skeleton size-14 shrink-0 rounded-2xl" />
      <div class="flex-1 space-y-2.5 pt-1">
        <div class="skeleton h-7 w-64 max-w-full rounded-md" />
        <div class="skeleton h-4 w-40 rounded-full" />
      </div>
    </div>

    <div v-else-if="hero === 'series'" class="card flex flex-col gap-6 p-6 md:flex-row md:p-8">
      <div class="skeleton aspect-video w-full shrink-0 rounded-xl md:w-80 lg:w-96" />
      <div class="flex-1 space-y-3">
        <div class="skeleton h-8 w-2/3 rounded-md" />
        <div class="skeleton h-4 w-1/3 rounded-full" />
        <div class="skeleton mt-4 h-3 w-full rounded-full" />
        <div class="skeleton h-3 w-4/5 rounded-full" />
      </div>
    </div>

    <div v-if="sections" :class="fullWidth ? 'container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl' : ''">
      <div class="grid grid-cols-1 lg:grid-cols-3" :class="fullWidth ? 'gap-8' : 'gap-6'">
        <div :class="[aside ? 'lg:col-span-2' : 'lg:col-span-3', fullWidth ? 'space-y-8' : 'space-y-6']">
          <section v-for="section in sections" :key="section" class="card overflow-hidden">
            <div class="flex items-center gap-2.5 px-5 pb-2 pt-4">
              <div class="skeleton size-4.5 rounded" />
              <div class="skeleton h-4 w-32 rounded-full" />
            </div>
            <div class="space-y-3.5 px-5 pb-5 pt-3">
              <div v-for="line in 4" :key="line" class="flex items-center gap-3">
                <div class="skeleton h-3.5 w-6 shrink-0 rounded" />
                <div class="skeleton h-3.5 rounded-full" :class="LINE_WIDTHS[(section + line) % LINE_WIDTHS.length]" />
              </div>
            </div>
          </section>
        </div>
        <div v-if="aside" class="space-y-6">
          <div v-for="card in 3" :key="card" class="card p-5">
            <div class="skeleton h-4 w-24 rounded-full" />
            <div class="mt-4 space-y-2.5">
              <div class="skeleton h-3 w-full rounded-full" />
              <div class="skeleton h-3 w-4/5 rounded-full" />
              <div class="skeleton h-3 w-3/5 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </SkeletonStatus>
</template>

<script setup lang="ts">
/**
 * The placeholder for a catalog detail page while its data loads. `hero` mirrors the page's header:
 * `album`, `track` (the album's banner with a smaller cover), `poster` (entries) and `gradient`
 * (franchises) span the full width and bring the body's container; `tile` (labels) and `series` go
 * inside the page's container; `none` is for a page that renders its own header (artists).
 */
const props = withDefaults(defineProps<{
  hero: 'album' | 'poster' | 'gradient' | 'tile' | 'track' | 'series' | 'none'
  /** Section cards in the main column; 0 leaves the body out. */
  sections?: number
  /** The narrow column on the right. */
  aside?: boolean
}>(), {
  sections: 3,
  aside: true,
})

const LINE_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/2', 'w-2/3', 'w-1/3']

const fullWidth = computed(() => ['album', 'track', 'poster', 'gradient'].includes(props.hero))
</script>
