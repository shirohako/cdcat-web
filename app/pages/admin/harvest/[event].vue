<script setup lang="ts">
// Harvesting no longer has a page per event: old links open the review queue filtered by the event.
definePageMeta({
  validate: route => /^\d+$/.test(String(route.params.event)),
  middleware: to => navigateTo({ path: '/admin/harvest', query: { event_id: String(to.params.event), tab: to.query.tab === 'candidates' ? undefined : to.query.tab } }, { replace: true }),
})
</script>

<template>
  <div />
</template>
