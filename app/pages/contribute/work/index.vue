<template>
  <EditorEntityEditor :key="String(route.query.revision ?? '')" type="work" :revision-id="revisionId">
    <EditorEntityWorkFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// A new work; ?revision=<id> continues a saved draft.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.new_title', { type: t('catalog.catalog_type.work') }), robots: 'noindex' })
</script>
