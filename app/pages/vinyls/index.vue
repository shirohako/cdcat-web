<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader :title="$t('menu.vinyl')" :description="$t('albums.vinyl_subtitle')" icon="lucide:disc" />
        </template>

        <CommonLoadError v-if="status === 'error'" class="mb-4" @retry="refresh()" />
        <CollectionLoadingSkeleton v-if="loading" variant="covers" />
        <CommonPagedList
          v-else-if="data"
          :page="page"
          :total-pages="lastPage"
          :total="data.pagination.total"
          :count="albums.length"
          :per-page="data.pagination.per_page"
          :disabled="refetching"
          @update:page="page = $event"
        >
          <div
            :key="revealKey"
            class="grid grid-cols-2 gap-5 transition-opacity sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5"
            :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]"
            :inert="refetching"
          >
            <AlbumCard v-for="album in albums" :key="album.id" :album="album" />
          </div>
          <p v-if="!albums.length" class="py-16 text-center text-sm text-meta">{{ $t('albums.no_results') }}</p>
        </CommonPagedList>
      </CollectionPageCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'

const { t } = useI18n()
// In the URL, so going back returns to the same page.
const page = useQueryPage()
/** Vinyl is not an album type: an LP is its own album whose discs have the vinyl format. */
const { data, status, refresh, loading, refetching, revealKey, revealClass } = await usePageAPI<{ albums: AlbumSimple[], pagination: { last_page: number, total: number, per_page: number } }>('/v1/albums', {
  query: computed(() => ({ format: 'vinyl', page: page.value })),
})
const albums = computed(() => data.value?.albums ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)
usePageSeo({ title: () => t('menu.vinyl'), description: () => t('seo.pages.vinyls') })
</script>
