<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('menu.vinyl') }}</h1>
        <p class="text-sm text-gray-500">{{ $t('albums.vinyl_subtitle') }}</p>
      </header>
      <div v-if="pending" class="flex justify-center py-10"><span class="loading loading-spinner" /></div>
      <div v-else class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
        <AlbumCard v-for="album in albums" :key="album.id" :album="album" />
      </div>
      <p v-if="!pending && !albums.length" class="py-16 text-center text-sm text-gray-400">{{ $t('albums.no_results') }}</p>
      <CommonPagination class="mt-6" :page="page" :total-pages="lastPage" :disabled="pending" @update:page="page = $event" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'

const { t } = useI18n()
const page = ref(1)
/** Vinyl is not an album type: an LP is its own album whose discs have the vinyl format. */
const { data, pending } = await useAPI<{ albums: AlbumSimple[], pagination: { last_page: number } }>('/v1/albums', {
  query: computed(() => ({ format: 'vinyl', page: page.value })),
})
const albums = computed(() => data.value?.albums ?? [])
const lastPage = computed(() => data.value?.pagination.last_page ?? 1)
useHead({ title: computed(() => t('menu.vinyl')) })
</script>
