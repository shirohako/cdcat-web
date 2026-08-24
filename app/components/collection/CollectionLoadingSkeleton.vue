<script setup>
defineProps({
  variant: {
    type: String,
    default: 'covers',
  },
})
</script>

<template>
  <div role="status" aria-live="polite" aria-label="Loading" class="animate-pulse">
    <div v-if="variant === 'artists'" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="item in 12"
        :key="item"
        class="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5"
      >
        <div class="h-14 w-14 shrink-0 rounded-full bg-slate-100" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-3.5 w-3/5 rounded-full bg-slate-200/80" />
          <div class="h-2.5 w-2/5 rounded-full bg-slate-100" />
          <div class="h-2.5 w-1/2 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'list'" class="space-y-4">
      <div
        v-for="item in 4"
        :key="item"
        class="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
      >
        <div class="h-36 w-24 shrink-0 rounded-xl bg-slate-100" />
        <div class="flex flex-1 flex-col py-1">
          <div class="h-5 w-2/5 rounded-full bg-slate-200/80" />
          <div class="mt-4 h-3 w-full rounded-full bg-slate-100" />
          <div class="mt-2 h-3 w-4/5 rounded-full bg-slate-100" />
          <div class="mt-auto flex gap-3">
            <div class="h-3 w-24 rounded-full bg-slate-100" />
            <div class="h-3 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'sections'" class="space-y-6">
      <div v-for="section in 2" :key="section" class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div class="h-6 w-40 rounded-full bg-slate-200/80" />
        <div class="mt-3 h-3 w-2/3 rounded-full bg-slate-100" />
        <div class="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div v-for="card in 4" :key="card" class="h-36 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid gap-4"
      :class="variant === 'compact'
        ? 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8'
        : variant === 'wide'
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'"
    >
      <div
        v-for="item in variant === 'compact' ? 16 : 6"
        :key="item"
        class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      >
        <div
          class="bg-slate-100"
          :class="variant === 'wide' ? 'aspect-video' : 'aspect-square'"
        />
        <div class="space-y-2.5 p-3.5">
          <div class="h-3.5 w-3/4 rounded-full bg-slate-200/80" />
          <div class="h-2.5 w-1/2 rounded-full bg-slate-100" />
          <div v-if="variant !== 'compact'" class="h-2.5 w-full rounded-full bg-slate-100" />
        </div>
      </div>
    </div>

    <span class="sr-only">Loading</span>
  </div>
</template>
