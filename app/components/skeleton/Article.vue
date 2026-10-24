<template>
  <SkeletonStatus page>
    <div class="skeleton h-72 w-full md:h-96" />
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-6 2xl:max-w-7xl">
      <div class="flex items-start gap-6">
        <div class="min-w-0 flex-1 space-y-4">
          <div class="flex items-center gap-3 card px-5 py-3">
            <div class="skeleton h-3 w-20 rounded-full" />
            <div class="skeleton h-3 w-16 rounded-full" />
            <div class="skeleton ml-auto h-3 w-24 rounded-full" />
          </div>
          <div class="card space-y-6 p-6 md:p-8">
            <div v-for="paragraph in 3" :key="paragraph" class="space-y-2.5">
              <div v-for="line in 4" :key="line" class="skeleton h-3.5 rounded-full" :class="line === 4 ? LAST_LINES[paragraph % LAST_LINES.length] : 'w-full'" />
            </div>
          </div>
        </div>
        <div class="hidden w-64 shrink-0 space-y-4 lg:block xl:w-72">
          <div class="card flex items-center gap-3 p-5">
            <div class="skeleton size-12 shrink-0 rounded-full" />
            <div class="flex-1 space-y-2">
              <div class="skeleton h-3.5 w-24 rounded-full" />
              <div class="skeleton h-2.5 w-16 rounded-full" />
            </div>
          </div>
          <div class="card space-y-3 p-5">
            <div class="skeleton h-3.5 w-20 rounded-full" />
            <div v-for="item in 5" :key="item" class="skeleton h-3 rounded-full" :class="LAST_LINES[item % LAST_LINES.length]" />
          </div>
        </div>
      </div>
    </div>
  </SkeletonStatus>
</template>

<script setup lang="ts">
/** The placeholder for an article page: banner, body and the sidebar with the author and contents. */
const LAST_LINES = ['w-2/3', 'w-1/2', 'w-3/4', 'w-2/5']
</script>
