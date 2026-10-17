<template>
  <EditorEntityEditor :id="id" :key="`${id}:${route.query.revision ?? ''}`" type="artist" :revision-id="revisionId">
    <EditorEntityArtistFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// Edits a artist; ?revision=<id> continues a draft.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const id = computed(() => Number(route.params.id))
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.edit_title', { type: t('catalog.catalog_type.artist') }), robots: 'noindex' })
</script>
