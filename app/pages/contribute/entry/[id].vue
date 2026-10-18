<template>
  <EditorEntityEditor :id="id" :key="`${id}:${route.query.revision ?? ''}`" type="entry" :revision-id="revisionId">
    <EditorEntityEntryFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// Edits an entry; ?revision=<id> continues a revision sent back for changes.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const id = computed(() => Number(route.params.id))
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.edit_title', { type: t('catalog.catalog_type.entry') }), robots: 'noindex' })
</script>
