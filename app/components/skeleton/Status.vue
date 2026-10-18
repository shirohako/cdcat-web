<template>
  <div aria-busy="true" :data-skeleton="page ? '' : undefined">
    <span class="sr-only">{{ $t('common.loading') }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * The frame of every loading placeholder: tells screen readers the region is loading. The skeleton that
 * stands in for a page's main data passes `page`; router.options.ts waits for it to go before restoring
 * a scroll position. Placeholder blocks are `<div class="skeleton …">` (assets/css/main.css).
 */
defineProps<{
  page?: boolean
}>()
</script>
