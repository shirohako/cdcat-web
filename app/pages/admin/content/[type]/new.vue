<script setup lang="ts">
import { adminContentTypeOf, adminEditorPath } from '~/config/admin'

// New content is made in the same editors contributors use; with auto-approve it goes live at once.
definePageMeta({ layout: 'admin', middleware: 'admin', validate: route => !!adminEditorPath(adminContentTypeOf(route.params.type) ?? 'track') })

const route = useRoute()
await navigateTo(adminEditorPath(adminContentTypeOf(route.params.type)!)!, { replace: true })
</script>

<template>
  <div />
</template>
