<script setup lang="ts">
/** The heading of an auth page or step: 第 n 步，共 m 步 when it is one of several, the title (the page's h1) and a lead. */
defineProps<{
  title: string
  lead?: string
  step?: number
  total?: number
}>()
</script>

<template>
  <header class="flex flex-col gap-1.5">
    <p v-if="step && total" class="text-xs font-semibold tracking-wide text-meta">{{ $t('auth.steps.step_of', { n: step, total }) }}</p>
    <h1 class="text-balance text-[1.65rem] font-black leading-tight text-title">{{ title }}</h1>
    <p v-if="lead" class="text-sm leading-relaxed text-body">{{ lead }}</p>
  </header>
</template>
