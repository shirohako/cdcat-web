<template>
  <EditorEntityEditor :key="`${route.query.revision ?? ''}:${draftScope ?? ''}`" type="artist" :revision-id="revisionId" :draft-scope="draftScope" :initial="initial">
    <EditorEntityArtistFields />
  </EditorEntityEditor>
</template>

<script setup lang="ts">
// A new artist; ?revision=<id> continues a revision sent back, ?draft=<scope> a draft kept in this browser, ?name= starts
// with that name (from a search that found nothing).
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const revisionId = computed(() => Number(route.query.revision) || null)
const draftScope = computed(() => typeof route.query.draft === 'string' ? route.query.draft : null)

const initial = computed(() => typeof route.query.name === 'string' && route.query.name.trim() ? { name: route.query.name.trim() } : null)

useSeoMeta({ title: () => t('editor.entity.new_title', { type: t('catalog.catalog_type.artist') }), robots: 'noindex' })
</script>
