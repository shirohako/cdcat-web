<template>
  <section class="card overflow-hidden">
    <slot name="header" />
    <div class="min-h-80 p-4 sm:min-h-100 sm:p-5 lg:p-6">
      <slot />
    </div>
  </section>
</template>
