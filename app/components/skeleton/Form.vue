<template>
  <SkeletonStatus page>
    <div class="space-y-6">
      <div v-for="field in fields" :key="field" class="space-y-2">
        <div class="skeleton h-3 rounded-full" :class="LABEL_WIDTHS[field % LABEL_WIDTHS.length]" />
        <div class="skeleton h-10 w-full rounded-lg" />
      </div>
      <div class="space-y-2">
        <div class="skeleton h-3 w-28 rounded-full" />
        <div class="skeleton h-28 w-full rounded-lg" />
      </div>
    </div>
  </SkeletonStatus>
</template>

<script setup lang="ts">
/** The placeholder for a form (editors, account settings) while its current values load. */
withDefaults(defineProps<{
  /** Single-line fields before the closing text area. */
  fields?: number
}>(), {
  fields: 4,
})

const LABEL_WIDTHS = ['w-24', 'w-20', 'w-32', 'w-16']
</script>
