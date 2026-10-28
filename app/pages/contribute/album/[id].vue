<template>
  <div>
    <!-- One root element for the page transition; ClientOnly swaps its fallback for the editor inside it. -->
    <ClientOnly>
      <LazyEditorAlbumEditor
        :key="`${albumId}:${route.query.revision ?? ''}`"
        :album-id="albumId"
        :revision-id="revisionId"
        :mode="route.query.mode === 'translate' ? 'translate' : 'edit'"
        :locale="typeof route.query.locale === 'string' ? route.query.locale : undefined"
      />
      <template #fallback>
        <!-- The editor's own loading state, so nothing moves when it takes over. -->
        <div class="cards-raised min-h-screen">
          <div class="container mx-auto max-w-7xl px-3 py-6 md:px-6">
            <SkeletonAlbumEditor />
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// The editor loads in the browser only (it keeps its drafts there): the server renders its spinner,
// so the navbar and the rest of the page become usable without waiting for the editor's code.
// Edits an album: ?revision=<id> continues a revision sent back for changes, ?mode=translate&locale=en opens the tracklist translator.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const albumId = computed(() => Number(route.params.id))
const revisionId = computed(() => Number(route.query.revision) || null)

useSeoMeta({ title: () => t('editor.album.edit_title'), robots: 'noindex' })
</script>
