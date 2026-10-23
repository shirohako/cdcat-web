<!-- The placeholder for a public profile: the banner card, then the two-column body. -->
<template>
  <SkeletonStatus page>
    <div class="container mx-auto max-w-6xl px-4 pb-2 pt-8 md:px-6 2xl:max-w-7xl">
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div class="skeleton h-38 sm:h-44 md:h-52" />
        <div class="relative border-t border-slate-100 bg-white px-4 pb-4 sm:px-6 sm:pb-6">
          <div class="skeleton absolute -top-22 left-4 size-30 rounded-full border-3 border-white sm:-top-28 sm:left-6 sm:size-38 sm:border-4" />
          <div class="space-y-2.5 pt-12 sm:pl-44 sm:pt-4">
            <div class="skeleton h-6 w-40 rounded-md" />
            <div class="skeleton h-3.5 w-24 rounded-full" />
            <div class="skeleton h-3 w-2/3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <div v-for="card in 2" :key="card" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div class="skeleton h-4 w-28 rounded-full" />
            <div class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              <div v-for="cover in 5" :key="cover" class="skeleton aspect-square rounded-lg" :class="cover > 3 ? 'hidden sm:block' : ''" />
            </div>
          </div>
        </div>
        <div class="space-y-6">
          <div v-for="card in 2" :key="card" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
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

