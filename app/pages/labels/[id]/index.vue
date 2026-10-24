<template>
  <div class="min-h-screen">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <div v-if="label" :class="revealClass">
        <CatalogPendingBanner inline :pending="label.is_pending" :revision="label.pending_revision" />
        <header class="mb-6 flex flex-wrap items-start gap-4">
          <div class="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-card">
            <img v-if="label.image_url" :src="label.image_url" :alt="label.name" class="h-full w-full object-contain">
            <div v-else class="flex h-full w-full items-center justify-center text-faint"><Building2 :size="28" /></div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-primary">{{ $t('labels.label') }}</p>
            <h1 class="text-2xl font-bold text-title">{{ shownName }}</h1>
            <p v-if="shownName !== label.name" class="text-sm text-meta">{{ label.name }}</p>
            <p class="mt-2 flex flex-wrap gap-x-4 text-sm text-meta">
              <span>{{ $t('artists.detail.albums', { count: label.albums_count }) }}</span>
              <span v-if="label.country">{{ regionName(label.country) }}</span>
              <span v-if="label.begin_date">{{ formatDate(label.begin_date, label.begin_date_precision) }} – {{ label.end_date ? formatDate(label.end_date, label.end_date_precision) : '' }}</span>
            </p>
          </div>
          <div class="flex gap-2">
            <NuxtLink :to="`/labels/${label.id}/versions`" class="btn btn-sm btn-ghost gap-1"><History :size="14" />{{ $t('versions.short', { version: label.version }) }}</NuxtLink>
            <NuxtLink :to="`/contribute/label/${label.id}`" class="btn btn-sm btn-outline gap-1"><Edit :size="14" />{{ $t('common.edit') }}</NuxtLink>
          </div>
        </header>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section class="lg:col-span-2">
            <CollectionLoadingSkeleton v-if="albumsLoading" grid-class="grid-cols-2 gap-5 sm:grid-cols-3" :count="6" />
            <div
              v-else-if="albums.length"
              :key="albumsRevealKey"
              class="grid grid-cols-2 gap-5 transition-opacity sm:grid-cols-3 lg:grid-cols-3"
              :class="[albumsRevealClass, { 'pointer-events-none opacity-60': albumsRefetching }]"
              :inert="albumsRefetching"
            >
              <AlbumCard v-for="album in albums" :key="album.id" :album="album" />
            </div>
            <p v-else class="py-10 text-center text-sm text-meta">{{ $t('artists.detail.no_releases') }}</p>
            <CommonPagination class="mt-6" :page="page" :total-pages="lastPage" :disabled="albumsRefetching" @update:page="page = $event" />
          </section>
          <aside class="space-y-6">
            <CatalogSection :title="$t('album.section.information')" :icon="Info">
              <div class="space-y-4 px-5 py-4 text-sm">
                <p v-if="label.description" class="whitespace-pre-line text-body">{{ label.description }}</p>
                <div v-if="label.catalog_prefixes.length">
                  <h3 class="mb-1 text-xs font-semibold text-meta">{{ $t('labels.catalog_prefixes') }}</h3>
                  <p class="flex flex-wrap gap-1.5 font-mono text-xs"><span v-for="prefix in label.catalog_prefixes" :key="prefix" class="rounded bg-btn px-1.5 py-0.5 text-btn-content">{{ prefix }}</span></p>
                </div>
                <CatalogTitleList v-if="label.titles?.length" :titles="label.titles" />
                <CatalogAttributeList v-if="label.attributes?.length" :attributes="label.attributes" />
              </div>
            </CatalogSection>
            <AlbumLinks :links="label.links ?? []" />
          </aside>
        </div>
      </div>
      <div v-else-if="status === 'error'" class="alert alert-error mx-auto max-w-md"><span>{{ $t('labels.not_found') }}</span></div>
      <SkeletonCatalogDetail v-else hero="tile" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumSimple } from '~/types/album'
import type { Label } from '~/types/label'
import { Building2, Edit, History, Info } from '@lucide/vue'
import { namedLd, ldDate } from '~/utils/structuredData'
import { composeDescription, descriptionLength, plainText } from '~/utils/seoText'

const route = useRoute()
const { $api } = useNuxtApp()
const { t, locale } = useI18n()
const { regionName } = useLocaleFormatting()
const { localName, formatDate } = useCatalogDisplay()

const labelId = Number(route.params.id)
const { data: label, status, error, revealClass } = await usePageAPI<Label>(`/v1/labels/${labelId}`)
const shownName = computed(() => label.value ? localName(label.value.name, label.value.titles) : '')

const page = useQueryPage()
const {
  data: albumData,
  loading: albumsLoading,
  refetching: albumsRefetching,
  revealKey: albumsRevealKey,
  revealClass: albumsRevealClass,
} = usePageData(
  () => `label:${labelId}:albums:${page.value}`,
  ({ signal, background }) => $api<{ albums: AlbumSimple[], pagination: { last_page: number } }>(`/v1/labels/${labelId}/albums`, { params: { page: page.value }, signal, progress: !background }),
)
const albums = computed(() => albumData.value?.albums ?? [])
const lastPage = computed(() => albumData.value?.pagination.last_page ?? 1)

const { withOriginal, sentence, count } = useSeoText()
const absolute = useSiteUrl()
usePageSeo({
  title: () => label.value ? withOriginal(shownName.value, label.value.name) : undefined,
  description: () => label.value
    ? composeDescription(
        sentence([
          t('seo.label.lead'),
          label.value.country && regionName(label.value.country),
          label.value.begin_date && t('seo.label.founded', { date: formatDate(label.value.begin_date, label.value.begin_date_precision) }),
          count('seo.albums_count', label.value.albums_count),
        ]),
        plainText(label.value.description),
        descriptionLength(locale.value),
      )
    : undefined,
  image: () => label.value?.image_url,
  noindex: () => label.value?.is_pending,
  error,
  breadcrumbs: () => label.value ? [{ name: t('labels.title'), path: '/labels' }, { name: shownName.value, path: `/labels/${label.value.id}` }] : null,
  jsonLd: () => label.value && namedLd('Organization', {
    name: shownName.value,
    alternateNames: [label.value.name, ...(label.value.titles ?? []).map(title => title.title)],
    url: absolute(`/labels/${label.value.id}`),
    logo: label.value.image_url,
    description: plainText(label.value.description),
    foundingDate: ldDate(label.value.begin_date, label.value.begin_date_precision),
    dissolutionDate: ldDate(label.value.end_date, label.value.end_date_precision),
    sameAs: (label.value.links ?? []).map(link => link.url),
  }),
})
</script>
