<template>
  <EditorEntityEditor :key="String(route.query.revision ?? '')" type="artist" :revision-id="revisionId">
    <EditorEntityArtistFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// A new artist; ?revision=<id> continues a saved draft.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.entity.new_title', { type: t('catalog.catalog_type.artist') }), robots: 'noindex' })
</script>
