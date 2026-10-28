<script setup lang="ts">
// Harvesting no longer has a page per event: old links open the review queue, the name map or the coverage, filtered by the event.
definePageMeta({
  validate: route => /^\d+$/.test(String(route.params.event)),
  middleware: (to) => {
    const event_id = String(to.params.event)
    const tab = String(to.query.tab ?? '')
    return navigateTo({ path: ['names', 'coverage'].includes(tab) ? `/admin/harvest/${tab}` : '/admin/harvest/candidates', query: { event_id } }, { replace: true })
  },
})
</script>

<template>
  <div />
</template>
