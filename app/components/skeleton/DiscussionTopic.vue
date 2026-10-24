<template>
  <SkeletonStatus page>
    <div class="mb-3 flex gap-2">
      <div class="skeleton h-3 w-16 rounded-full" />
      <div class="skeleton h-3 w-20 rounded-full" />
    </div>
    <div class="card p-5">
      <div class="skeleton h-7 w-2/3 rounded-md" />
      <div class="mt-3 flex gap-3">
        <div class="skeleton h-3 w-24 rounded-full" />
        <div class="skeleton h-3 w-16 rounded-full" />
        <div class="skeleton h-3 w-20 rounded-full" />
      </div>
    </div>
    <div class="mt-4 space-y-3">
      <div v-for="floor in 3" :key="floor" class="card p-4 sm:p-5">
        <div class="flex gap-3 sm:gap-4">
          <div class="skeleton size-9 shrink-0 rounded-full" />
          <div class="min-w-0 flex-1">
            <div class="flex gap-2">
              <div class="skeleton h-3.5 w-24 rounded-full" />
              <div class="skeleton h-3.5 w-14 rounded-full" />
            </div>
            <div class="mt-4 space-y-2.5">
              <div class="skeleton h-3 w-full rounded-full" />
              <div class="skeleton h-3 w-full rounded-full" />
              <div class="skeleton h-3 rounded-full" :class="LAST_LINES[floor % LAST_LINES.length]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </SkeletonStatus>
</template>

<script setup lang="ts">
/** The placeholder for a discussion topic: breadcrumb, the header card and a few floors. */
const LAST_LINES = ['w-2/3', 'w-1/2', 'w-3/4']
</script>
