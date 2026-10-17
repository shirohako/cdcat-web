<template>
  <EditorEntityEditor :key="String(route.query.revision ?? '')" type="label" :revision-id="revisionId">
    <EditorEntityLabelFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// A new label; ?revision=<id> continues a saved draft.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.new_title', { type: t('catalog.catalog_type.label') }), robots: 'noindex' })
</script>
