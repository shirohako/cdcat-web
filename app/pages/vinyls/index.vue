<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-28 -left-28 h-96 w-96 rounded-full bg-linear-to-br from-sky-200/45 to-indigo-200/20 blur-3xl" />
      <div class="absolute -top-20 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-amber-200/40 to-rose-200/15 blur-3xl" />
      <div class="absolute -bottom-44 left-1/3 h-96 w-96 rounded-full bg-linear-to-br from-emerald-200/35 to-cyan-200/15 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
    </div>

    <div class="relative container mx-auto max-w-5xl px-4 py-10 md:px-6">
      <ComingSoon />
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Vinyl | CDCAT'
})
</script>
