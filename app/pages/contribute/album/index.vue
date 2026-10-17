<template>
  <EditorAlbumEditor :key="String(route.query.revision ?? '')" :revision-id="revisionId" />
</template>

<script setup lang="ts">
// A new album; ?revision=<id> continues a saved draft of one.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.album.new_title'), robots: 'noindex' })
</script>
