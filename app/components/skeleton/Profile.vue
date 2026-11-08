<!-- The placeholder for a public profile: the banner card, then the two-column body. -->
<template>
  <SkeletonStatus page>
    <div class="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
      <div class="card overflow-hidden">
        <div class="page-hero-banner skeleton" />
        <div class="relative h-12.5 md:h-17">
          <div class="page-hero-avatar absolute left-4 top-0 -translate-y-1/2 rounded-full border-4 border-card bg-card md:left-6">
            <div class="skeleton size-full rounded-full" />
          </div>
        </div>
        <div class="space-y-2.5 p-4 pt-3 sm:p-5 sm:pt-3 md:p-6 md:pt-3">
          <div class="skeleton h-6 w-40 rounded-md" />
          <div class="skeleton h-3.5 w-24 rounded-full" />
          <div class="skeleton h-3 w-2/3 rounded-full" />
        </div>
      </div>
    </div>
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <div v-for="card in 2" :key="card" class="card p-5">
            <div class="skeleton h-4 w-28 rounded-full" />
            <div class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              <div v-for="cover in 5" :key="cover" class="skeleton aspect-square rounded-lg" :class="cover > 3 ? 'hidden sm:block' : ''" />
            </div>
          </div>
        </div>
        <div class="space-y-6">
          <div v-for="card in 2" :key="card" class="card p-5">
            <div class="skeleton h-4 w-20 rounded-full" />
            <div class="mt-4 space-y-2.5">
              <div class="skeleton h-3 w-full rounded-full" />
              <div class="skeleton h-3 w-3/4 rounded-full" />
              <div class="skeleton h-3 w-1/2 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </SkeletonStatus>
</template>

