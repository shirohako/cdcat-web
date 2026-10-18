<template>
  <EditorEntityEditor :id="id" :key="`${id}:${route.query.revision ?? ''}`" type="work" :revision-id="revisionId">
    <EditorEntityWorkFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// Edits a work; ?revision=<id> continues a revision sent back for changes.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const id = computed(() => Number(route.params.id))
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.edit_title', { type: t('catalog.catalog_type.work') }), robots: 'noindex' })
</script>
