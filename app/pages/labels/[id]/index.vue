<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <div v-if="pending" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg" /></div>
      <div v-else-if="error || !label" class="alert alert-error mx-auto max-w-md"><span>{{ $t('labels.not_found') }}</span></div>

      <template v-else>
        <CatalogPendingBanner inline :pending="label.is_pending" :revision="label.pending_revision" />
        <header class="mb-6 flex flex-wrap items-start gap-4">
          <div class="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
            <img v-if="label.image_url" :src="label.image_url" :alt="label.name" class="h-full w-full object-contain">
            <div v-else class="flex h-full w-full items-center justify-center text-gray-300"><Building2 :size="28" /></div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-sky-600">{{ $t('labels.label') }}</p>
            <h1 class="text-2xl font-bold text-gray-900">{{ shownName }}</h1>
            <p v-if="shownName !== label.name" class="text-sm text-gray-500">{{ label.name }}</p>
            <p class="mt-2 flex flex-wrap gap-x-4 text-sm text-gray-500">
              <span>{{ $t('artists.detail.albums', { count: label.albums_count }) }}</span>
              <span v-if="label.country">{{ regionName(label.country) }}</span>
              <span v-if="label.begin_date">{{ formatDate(label.begin_date, label.begin_date_precision) }} – {{ label.end_date ? formatDate(label.end_date, label.end_date_precision) : '' }}</span>
              <span v-if="label.parent">{{ $t('labels.parent') }}: <NuxtLink :to="`/labels/${label.parent.id}`" class="link">{{ label.parent.name }}</NuxtLink></span>
            </p>
          </div>
          <div class="flex gap-2">
            <NuxtLink :to="`/labels/${label.id}/versions`" class="btn btn-sm btn-ghost gap-1"><History :size="14" />{{ $t('versions.short', { version: label.version }) }}</NuxtLink>
            <NuxtLink :to="`/contribute/label/${label.id}`" class="btn btn-sm btn-outline gap-1"><Edit :size="14" />{{ $t('common.edit') }}</NuxtLink>
          </div>
        </header>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section class="lg:col-span-2">
            <div v-if="albumsPending" class="flex justify-center py-10"><span class="loading loading-spinner" /></div>
            <div v-else-if="albums.length" class="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-3">
              <AlbumCard v-for="album in albums" :key="album.id" :album="album" />
            </div>
            <p v-else class="py-10 text-center text-sm text-gray-400">{{ $t('artists.detail.no_releases') }}</p>
            <CommonPagination class="mt-6" :page="page" :total-pages="lastPage" :disabled="albumsPending" @update:page="page = $event" />
          </section>
          <aside class="space-y-6">
            <CatalogSection :title="$t('album.section.information')" :icon="Info" tone="sky">
              <div class="space-y-4 px-5 py-4 text-sm">
                <p v-if="label.description" class="whitespace-pre-line text-gray-600">{{ label.description }}</p>
                <div v-if="label.catalog_prefixes.length">
                  <h3 class="mb-1 text-xs font-semibold text-gray-400">{{ $t('labels.catalog_prefixes') }}</h3>
                  <p class="flex flex-wrap gap-1.5 font-mono text-xs"><span v-for="prefix in label.catalog_prefixes" :key="prefix" class="rounded bg-gray-100 px-1.5 py-0.5">{{ prefix }}</span></p>
                </div>
                <div v-if="label.children?.length">
                  <h3 class="mb-1 text-xs font-semibold text-gray-400">{{ $t('labels.children') }}</h3>
                  <p class="flex flex-wrap gap-x-3"><NuxtLink v-for="child in label.children" :key="child.id" :to="`/labels/${child.id}`" class="hover:underline">{{ child.name }}</NuxtLink></p>
                </div>
                <CatalogTitleList v-if="label.titles?.length" :titles="label.titles" />
                <CatalogAttributeList v-if="label.attributes?.length" :attributes="label.attributes" />
              </div>
            </CatalogSection>
            <AlbumLinks :links="label.links ?? []" />
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'
import type { Label } from '~/types/label'
import { Building2, Edit, History, Info } from '@lucide/vue'

const route = useRoute()
const { $api } = useNuxtApp()
const { regionName } = useLocaleFormatting()
const { localName, formatDate } = useCatalogDisplay()

const labelId = Number(route.params.id)
const { data: label, pending, error } = await useAPI<Label>(`/v1/labels/${labelId}`)
const shownName = computed(() => label.value ? localName(label.value.name, label.value.titles) : '')

const page = ref(1)
const { data: albumData, pending: albumsPending } = useAsyncData(
  () => `label:${labelId}:albums:${page.value}`,
  () => $api<{ albums: AlbumSimple[], pagination: { last_page: number } }>(`/v1/labels/${labelId}/albums`, { params: { page: page.value } }),
  { watch: [page] },
)
const albums = computed(() => albumData.value?.albums ?? [])
const lastPage = computed(() => albumData.value?.pagination.last_page ?? 1)

useHead({ title: computed(() => shownName.value || 'Label') })
</script>
