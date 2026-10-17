<script setup lang="ts">
import { Boxes, Disc3, ExternalLink, Film, Layers, Pencil } from '@lucide/vue'
import type { FranchiseDetail } from '~/types/entry'

const route = useRoute()
const { t } = useI18n()
const { displayName, originalName } = useEntryDisplay()

const { data: series, pending, error } = await useAPI<FranchiseDetail>(() => `/v1/franchises/${route.params.id}`)

useHead({ title: computed(() => series.value ? displayName(series.value) : '') })

const tabs = computed(() => [
  { id: 'entries', label: t('catalog.series_entries') },
  { id: 'albums', label: t('catalog.series_albums') },
])
const currentTab = ref('entries')

const providerLabel = (name?: string) => (name || '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="pending" class="flex min-h-screen items-center justify-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error || !series" class="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Boxes :size="56" class="text-gray-300" />
      <p>{{ $t('catalog.not_found') }}</p>
    </div>

    <template v-else>
      <div class="relative h-80 overflow-hidden bg-linear-to-br from-emerald-600 to-slate-800">
        <img v-if="series.banner_url || series.image_url" :src="series.banner_url || series.image_url!" alt="" class="h-full w-full object-cover opacity-40" >
        <div class="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

        <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div class="container mx-auto max-w-6xl 2xl:max-w-7xl">
            <NuxtLink v-if="series.parent" :to="`/franchises/${series.parent.id}`" class="mb-2 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white">
              <Layers class="h-4 w-4" />
              {{ series.parent.name }} ›
            </NuxtLink>
            <h1 class="text-3xl font-bold text-white md:text-4xl">{{ displayName(series) }}</h1>
            <p v-if="originalName(series)" class="mt-1 text-white/75">{{ originalName(series) }}</p>
            <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/90">
              <span v-if="series.children_count" class="flex items-center gap-2"><Layers class="h-5 w-5" />{{ $t('catalog.children_count', { count: series.children_count }) }}</span>
              <span class="flex items-center gap-2"><Film class="h-5 w-5" />{{ $t('catalog.entries_count', { count: series.entries_count ?? 0 }) }}</span>
              <span class="flex items-center gap-2"><Disc3 class="h-5 w-5" />{{ $t('catalog.albums_count', { count: series.albums_count ?? 0 }) }}</span>
              <NuxtLink :to="`/contribute/franchise/${series.id}`" class="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25">
                <Pencil class="h-4 w-4" />
                {{ $t('catalog.edit') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div v-if="series.description || series.links.length" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section v-if="series.description" class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 class="mb-3 text-lg font-bold">{{ $t('catalog.description') }}</h2>
            <p class="whitespace-pre-wrap leading-relaxed text-gray-700">{{ series.description }}</p>
          </section>
          <section v-if="series.links.length" class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 class="mb-3 text-lg font-bold">{{ $t('catalog.links') }}</h2>
            <a
              v-for="link in series.links"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
            >
              <ExternalLink :size="16" class="text-gray-400 group-hover:text-emerald-700" />
              <span class="truncate text-gray-700 group-hover:text-emerald-700">{{ providerLabel(link.provider?.name) || link.url }}</span>
            </a>
          </section>
        </div>

        <FranchiseContentTabs v-model="currentTab" :tabs="tabs" />

        <div v-show="currentTab === 'entries'" class="space-y-6">
          <!-- Sub-series first, each with its own entries -->
          <section
            v-for="child in series.children"
            :key="child.id"
            class="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm"
          >
            <NuxtLink :to="`/franchises/${child.id}`" class="group flex flex-wrap items-center gap-3">
              <span class="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700">{{ $t('catalog.sub_series') }}</span>
              <h2 class="text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700">{{ displayName(child) }}</h2>
              <span class="text-xs text-slate-500">
                {{ $t('catalog.entries_count', { count: child.entries_count ?? 0 }) }} · {{ $t('catalog.albums_count', { count: child.albums_count ?? 0 }) }}
              </span>
            </NuxtLink>
            <FranchiseEntriesSection :entries="child.entries" />
          </section>

          <section v-if="series.entries.length || !series.children.length" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <FranchiseEntriesSection :entries="series.entries" />
          </section>

          <section v-if="series.albums.length" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Disc3 class="h-4 w-4 text-emerald-600" />
              {{ $t('catalog.whole_series_albums') }}
            </h2>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              <NuxtLink v-for="album in series.albums" :key="album.id" :to="`/albums/${album.id}`" class="group">
                <div class="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img v-if="album.image_url" :src="album.image_url" :alt="album.title" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" >
                  <div v-else class="flex h-full items-center justify-center"><Disc3 class="h-8 w-8 text-gray-300" /></div>
                </div>
                <h3 class="mt-2 line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-emerald-700">{{ album.title }}</h3>
              </NuxtLink>
            </div>
          </section>

          <ArticleRelatedArticles :id="series.id" type="franchise" />
          <DiscussionRelatedDiscussions :id="series.id" type="franchise" />
        </div>

        <section v-if="currentTab === 'albums'" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <FranchiseAlbumsSection :franchise-id="series.id" />
        </section>
      </div>
    </template>
  </div>
</template>
