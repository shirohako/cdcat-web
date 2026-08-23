<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.28)]">
    <slot name="header" />
    <div class="min-h-80 p-4 sm:min-h-100 sm:p-5 lg:p-6">
      <slot />
    </div>
  </section>
</template>
