<template>
  <EditorEntityEditor :key="String(route.query.revision ?? '')" type="franchise" :revision-id="revisionId">
    <EditorEntityFranchiseFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// A new franchise; ?revision=<id> continues a saved draft.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.new_title', { type: t('catalog.catalog_type.franchise') }), robots: 'noindex' })
</script>
