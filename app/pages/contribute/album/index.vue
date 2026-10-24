<template>
  <div>
    <!-- One root element for the page transition; ClientOnly swaps its fallback for the editor inside it. -->
    <ClientOnly>
      <LazyEditorAlbumEditor :key="`${route.query.revision ?? ''}:${draftScope ?? ''}`" :revision-id="revisionId" :draft-scope="draftScope" />
      <template #fallback>
        <!-- The editor's own loading state, so nothing moves when it takes over. -->
        <div class="min-h-screen">
          <div class="container mx-auto max-w-7xl px-3 py-6 md:px-6">
            <SkeletonForm :fields="5" class="min-h-96" />
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// The editor loads in the browser only (it keeps its drafts there): the server renders its spinner,
// so the navbar and the rest of the page become usable without waiting for the editor's code.
// A new album; ?revision=<id> continues a revision sent back, ?draft=<scope> a draft kept in this browser.
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const revisionId = computed(() => Number(route.query.revision) || null)
const draftScope = computed(() => typeof route.query.draft === 'string' ? route.query.draft : null)

useSeoMeta({ title: () => t('editor.album.new_title'), robots: 'noindex' })
</script>
