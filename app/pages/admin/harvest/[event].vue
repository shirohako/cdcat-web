<script setup lang="ts">
// Harvesting no longer has a page per event: old links open the review queue, or the overview's tab, filtered by the event.
definePageMeta({
  validate: route => /^\d+$/.test(String(route.params.event)),
  middleware: (to) => {
    const event_id = String(to.params.event)
    const tab = to.query.tab
    return navigateTo(tab && tab !== 'candidates'
      ? { path: '/admin/harvest', query: { event_id, tab } }
      : { path: '/admin/harvest/candidates', query: { event_id } }, { replace: true })
  },
})
</script>

<template>
  <div />
</template>
