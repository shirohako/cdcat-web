<template>
  <EditorAlbumEditor
    :key="`${albumId}:${route.query.revision ?? ''}`"
    :album-id="albumId"
    :revision-id="revisionId"
    :mode="route.query.mode === 'translate' ? 'translate' : 'edit'"
    :locale="typeof route.query.locale === 'string' ? route.query.locale : undefined"
  />
</template>

<script setup lang="ts">
// Edits an album: ?revision=<id> continues a revision sent back for changes, ?mode=translate&locale=en opens the tracklist translator.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const albumId = computed(() => Number(route.params.id))
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.album.edit_title'), robots: 'noindex' })
</script>
