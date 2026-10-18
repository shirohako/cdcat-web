<template>
  <EditorEntityEditor :id="id" :key="`${id}:${route.query.revision ?? ''}`" type="franchise" :revision-id="revisionId">
    <EditorEntityFranchiseFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// Edits a franchise; ?revision=<id> continues a revision sent back for changes.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const id = computed(() => Number(route.params.id))
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.edit_title', { type: t('catalog.catalog_type.franchise') }), robots: 'noindex' })
</script>
