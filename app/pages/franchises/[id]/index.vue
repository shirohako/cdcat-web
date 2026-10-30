<script setup lang="ts">
import { Boxes, Disc3, ExternalLink, Film, Layers, Pencil } from '@lucide/vue'
import type { FranchiseDetail } from '~/types/entry'
import { namedLd } from '~/utils/structuredData'
import { composeDescription, descriptionLength, plainText } from '~/utils/seoText'

const route = useRoute()
const { t, locale } = useI18n()
const { displayName, originalName } = useEntryDisplay()

const { data: series, status, error, revealClass } = await usePageAPI<FranchiseDetail>(() => `/v1/franchises/${route.params.id}`, { notFound: true })

const { withOriginal, sentence, count } = useSeoText()
const absolute = useSiteUrl()
const seriesName = computed(() => displayName(series.value))
usePageSeo({
  title: () => series.value ? withOriginal(seriesName.value, series.value.name) : undefined,
  description: () => series.value
    ? composeDescription(
        sentence([
          t('seo.franchise.lead'),
          count('seo.franchise.entries', series.value.entries_count ?? series.value.entries.length),
          count('seo.entry.albums', series.value.albums_count ?? series.value.albums.length),
        ]),
        plainText(series.value.description),
        descriptionLength(locale.value),
      )
    : undefined,
  image: () => series.value?.banner_url || series.value?.image_url,
  wideImage: true,
  noindex: () => series.value?.is_pending,
  error,
  breadcrumbs: () => series.value ? [{ name: t('menu.series'), path: '/franchises' }, { name: seriesName.value, path: `/franchises/${series.value.id}` }] : null,
  jsonLd: () => series.value && namedLd('CreativeWorkSeries', {
    name: seriesName.value,
    alternateNames: [series.value.name, ...(series.value.titles ?? []).map(title => title.title)],
    url: absolute(`/franchises/${series.value.id}`),
    image: series.value.image_url || series.value.banner_url,
    description: plainText(series.value.description),
    sameAs: series.value.links.map(link => link.url),
  }),
})

const tabs = computed(() => [
  { id: 'entries', label: t('catalog.series_entries') },
  { id: 'albums', label: t('catalog.series_albums') },
])
const currentTab = ref('entries')

const providerLabel = (name?: string) => (name || '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
</script>

<template>
  <div class="min-h-screen">
    <div v-if="series" :class="revealClass">
      <!-- Hero: the theme colour fading into the always-dark hero colour, the banner under a black scrim -->
      <div class="relative h-80 overflow-hidden bg-linear-to-br from-primary-strong to-hero">
        <img v-if="series.banner_url || series.image_url" v-img-fade :src="series.banner_url || series.image_url!" alt="" class="h-full w-full object-cover opacity-40" >
        <div class="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

        <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div class="container mx-auto max-w-6xl 2xl:max-w-7xl">
            <NuxtLink v-if="series.parent" :to="`/franchises/${series.parent.id}`" class="mb-2 inline-flex items-center gap-1.5 text-sm text-on-media/80 transition-colors duration-150 ease-out hover:text-on-media">
              <Layers class="h-4 w-4" />
              {{ series.parent.name }} ›
            </NuxtLink>
            <h1 class="text-3xl font-bold text-on-media md:text-4xl">{{ displayName(series) }}</h1>
            <p v-if="originalName(series)" class="mt-1 text-on-media/75">{{ originalName(series) }}</p>
            <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-on-media/90">
              <span v-if="series.children_count" class="flex items-center gap-2"><Layers class="h-5 w-5" />{{ $t('catalog.children_count', { count: series.children_count }) }}</span>
              <span class="flex items-center gap-2"><Film class="h-5 w-5" />{{ $t('catalog.entries_count', { count: series.entries_count ?? 0 }) }}</span>
              <span class="flex items-center gap-2"><Disc3 class="h-5 w-5" />{{ $t('catalog.albums_count', { count: series.albums_count ?? 0 }) }}</span>
              <UiButton :to="`/contribute/franchise/${series.id}`" size="sm" :icon="Pencil" class="ml-auto">
                {{ $t('catalog.edit') }}
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <CatalogPendingBanner :pending="series.is_pending" :revision="series.pending_revision" />

      <div class="container mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div v-if="series.description || series.links.length" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section v-if="series.description" class="card p-6 lg:col-span-2">
            <h2 class="mb-3 text-lg font-bold text-title">{{ $t('catalog.description') }}</h2>
            <p class="whitespace-pre-wrap leading-relaxed text-body">{{ series.description }}</p>
          </section>
          <section v-if="series.links.length" class="card p-6">
            <h2 class="mb-3 text-lg font-bold text-title">{{ $t('catalog.links') }}</h2>
            <a
              v-for="link in series.links"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center gap-3 rounded-lg p-2 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
            >
              <ExternalLink :size="16" class="text-meta transition-colors group-hover:text-primary" />
              <span class="truncate text-body transition-colors group-hover:text-primary">{{ providerLabel(link.provider?.name) || link.url }}</span>
            </a>
          </section>
        </div>

        <FranchiseContentTabs v-model="currentTab" :tabs="tabs" />

        <div v-show="currentTab === 'entries'" class="space-y-6">
          <!-- Sub-series first, each with its own entries -->
          <section
            v-for="child in series.children"
            :key="child.id"
            class="card space-y-4 p-5"
          >
            <NuxtLink :to="`/franchises/${child.id}`" class="group flex flex-wrap items-center gap-3">
              <span class="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{{ $t('catalog.sub_series') }}</span>
              <h2 class="text-lg font-bold tracking-tight text-title transition-colors group-hover:text-primary">{{ displayName(child) }}</h2>
              <span class="text-xs text-meta">
                {{ $t('catalog.entries_count', { count: child.entries_count ?? 0 }) }} · {{ $t('catalog.albums_count', { count: child.albums_count ?? 0 }) }}
              </span>
            </NuxtLink>
            <FranchiseEntriesSection :entries="child.entries" />
          </section>

          <section v-if="series.entries.length || !series.children.length" class="card p-5">
            <FranchiseEntriesSection :entries="series.entries" />
          </section>

          <section v-if="series.albums.length" class="card p-5">
            <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-body">
              <Disc3 class="h-4 w-4 text-primary" />
              {{ $t('catalog.whole_series_albums') }}
            </h2>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              <NuxtLink v-for="album in series.albums" :key="album.id" :to="`/albums/${album.id}`" class="group">
                <div class="aspect-square overflow-hidden rounded-lg bg-sunken">
                  <img v-if="album.image_url" :src="album.image_url" :alt="album.title" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" >
                  <div v-else class="flex h-full items-center justify-center"><Disc3 class="h-8 w-8 text-faint" /></div>
                </div>
                <h3 class="mt-2 line-clamp-2 text-sm font-medium text-title transition-colors duration-150 ease-out group-hover:text-primary">{{ album.title }}</h3>
              </NuxtLink>
            </div>
          </section>

          <template v-if="!series.is_pending">
            <ArticleRelatedArticles :id="series.id" type="franchise" />
            <DiscussionRelatedDiscussions :id="series.id" type="franchise" />
          </template>
        </div>

        <section v-if="currentTab === 'albums'" class="card p-5">
          <FranchiseAlbumsSection :franchise-id="series.id" />
        </section>
      </div>
    </div>

    <div v-else-if="status === 'error'" class="flex min-h-[60vh] items-center justify-center">
      <UiEmpty :title="$t('common.load_failed')" :icon="Boxes" />
    </div>

    <SkeletonCatalogDetail v-else hero="gradient" />
  </div>
</template>
