<template>
  <EditorEntityEditor :id="id" :key="`${id}:${route.query.revision ?? ''}`" type="label" :revision-id="revisionId">
    <EditorEntityLabelFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// Edits a label; ?revision=<id> continues a draft.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const id = computed(() => Number(route.params.id))
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.edit_title', { type: t('catalog.catalog_type.label') }), robots: 'noindex' })
</script>
