<!-- The placeholder for a revision page: header, the changed items and the sidebar. -->
<template>
  <SkeletonStatus page>
    <div class="mb-5 space-y-2.5">
      <div class="skeleton h-7 w-1/2 rounded-md" />
      <div class="flex gap-2">
        <div class="skeleton h-5 w-16 rounded-full" />
        <div class="skeleton h-5 w-24 rounded-full" />
      </div>
    </div>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div class="space-y-4">
        <div v-for="item in 3" :key="item" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="skeleton h-4 w-1/3 rounded-full" />
          <div class="mt-4 space-y-2.5">
            <div class="skeleton h-3 w-full rounded-full" />
            <div class="skeleton h-3 w-5/6 rounded-full" />
            <div class="skeleton h-3 w-2/3 rounded-full" />
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <div v-for="card in 2" :key="card" class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="skeleton h-3.5 w-20 rounded-full" />
          <div class="mt-3 space-y-2">
            <div class="skeleton h-3 w-full rounded-full" />
            <div class="skeleton h-3 w-2/3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </SkeletonStatus>
</template>

