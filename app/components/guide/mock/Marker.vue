<script setup lang="ts">
/** A numbered marker on a mock-up, matching the ::: steps list under the figure that explains it. */
defineProps<{ n: number }>()
</script>

<template>
  <span class="inline-grid size-4 shrink-0 place-items-center rounded-full bg-primary font-mono text-[10px] font-bold leading-none text-on-primary ring-2 ring-card">{{ n }}</span>
</template>
