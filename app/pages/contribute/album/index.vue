<template>
  <EditorAlbumEditor :key="`${route.query.revision ?? ''}:${draftScope ?? ''}`" :revision-id="revisionId" :draft-scope="draftScope" />
</template>

<script setup lang="ts">
// A new album; ?revision=<id> continues a revision sent back, ?draft=<scope> a draft kept in this browser.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const revisionId = computed(() => Number(route.query.revision) || null)
const draftScope = computed(() => typeof route.query.draft === 'string' ? route.query.draft : null)

useSeoMeta({ title: () => t('editor.album.new_title'), robots: 'noindex' })
</script>
