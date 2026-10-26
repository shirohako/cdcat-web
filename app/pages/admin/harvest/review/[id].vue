<script setup lang="ts">
// The review page moved under the candidate list; old links keep their filters.
definePageMeta({
  middleware: to => navigateTo({ path: `/admin/harvest/candidates/${String(to.params.id)}`, query: to.query }, { replace: true }),
})
</script>

<template>
  <div />
</template>
