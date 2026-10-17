<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
      <div v-if="pending" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg" /></div>
      <div v-else-if="error || !work" class="alert alert-error mx-auto max-w-md"><span>{{ $t('works.not_found') }}</span></div>

      <template v-else>
        <CatalogPendingBanner inline :pending="work.is_pending" :revision="work.pending_revision" />
        <header class="mb-6 flex flex-wrap items-start gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><Music :size="26" /></div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-indigo-500">{{ $t('works.label') }}</p>
            <h1 class="text-2xl font-bold text-gray-900">{{ shownTitle }}</h1>
            <p v-if="shownTitle !== work.title" class="text-sm text-gray-500">{{ work.title }}</p>
            <p class="mt-2 flex flex-wrap gap-x-4 text-sm text-gray-500">
              <span>{{ $t('works.recordings', { count: work.tracks_count }) }}</span>
              <span v-if="work.lyrics_count">{{ $t('works.lyrics_count', { count: work.lyrics_count }) }}</span>
            </p>
          </div>
          <div class="flex gap-2">
            <NuxtLink :to="`/works/${work.id}/versions`" class="btn btn-sm btn-ghost gap-1"><History :size="14" />{{ $t('versions.short', { version: work.version }) }}</NuxtLink>
            <NuxtLink :to="`/contribute/work/${work.id}`" class="btn btn-sm btn-outline gap-1"><Edit :size="14" />{{ $t('common.edit') }}</NuxtLink>
          </div>
        </header>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <CatalogSection :title="$t('works.recordings_title')" :icon="Disc3" tone="indigo">
              <ul class="divide-y divide-gray-50">
                <li v-for="track in work.tracks" :key="track.id">
                  <NuxtLink :to="`/albums/${track.album.id}#track-${track.id}`" class="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50">
                    <img v-if="track.album.image_url" :src="track.album.image_url" :alt="track.album.title" class="h-10 w-10 shrink-0 rounded object-cover">
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-800">{{ track.title }}</p>
                      <p class="truncate text-[11px] text-gray-400">
                        {{ track.album.title }} · {{ formatDate(track.album.release_date, track.album.release_date_precision) }}
                        · <template v-if="track.disc_number && track.album.disc_count > 1">{{ track.disc_number }}-</template>{{ track.number_label || track.track_number }}
                      </p>
                    </div>
                    <span class="shrink-0 text-xs tabular-nums text-gray-400">{{ formatDuration(track.duration) }}</span>
                  </NuxtLink>
                </li>
              </ul>
              <p v-if="!work.tracks.length" class="px-5 py-6 text-center text-sm text-gray-400">{{ $t('works.no_recordings') }}</p>
            </CatalogSection>

            <CatalogSection :title="$t('lyrics_ui.lyrics_and_translations')" :icon="FileText" tone="sky">
              <div class="px-5 py-4"><LyricsPanel :work-id="work.id" /></div>
            </CatalogSection>
          </div>

          <aside class="space-y-6">
            <CatalogSection v-if="credits.length" :title="$t('works.credits')" :icon="Users" tone="emerald">
              <ul class="space-y-1.5 px-5 py-4 text-sm">
                <li v-for="(credit, index) in credits" :key="index" class="flex items-baseline gap-2">
                  <span class="w-20 shrink-0 text-xs text-gray-400">{{ roleName(credit.role) }}</span>
                  <NuxtLink v-if="credit.artist" :to="`/artists/${credit.artist.id}`" class="hover:underline">{{ credit.credited_as || credit.artist.name }}</NuxtLink>
                  <span v-else>{{ credit.credited_as }}</span>
                </li>
              </ul>
            </CatalogSection>

            <CatalogSection v-if="work.relations.length" :title="$t('works.relations')" :icon="GitBranch" tone="purple">
              <ul class="divide-y divide-gray-50">
                <li v-for="relation in work.relations" :key="`${relation.work.id}-${relation.relation_type}`">
                  <NuxtLink :to="`/works/${relation.work.id}`" class="block px-5 py-2.5 hover:bg-gray-50">
                    <p class="text-[11px] text-gray-400">{{ enumLabel('work_relation', relation.relation_type) }}</p>
                    <p class="truncate text-sm font-medium text-gray-800">{{ relation.work.title }}</p>
                  </NuxtLink>
                </li>
              </ul>
            </CatalogSection>

            <CatalogSection v-if="work.entries.length" :title="$t('works.entries')" :icon="Clapperboard" tone="amber">
              <ul class="space-y-1.5 px-5 py-4 text-sm">
                <li v-for="entry in work.entries" :key="`${entry.id}-${entry.relation_type}`" class="flex items-baseline gap-2">
                  <NuxtLink :to="`/entries/${entry.id}`" class="min-w-0 truncate hover:underline">{{ entry.name }}</NuxtLink>
                  <span class="shrink-0 text-[11px] text-gray-400">{{ enumLabel('entry_work_relation', entry.relation_type) }}<template v-if="entry.episode"> · {{ $t('catalog.episode_n', { n: entry.episode }) }}</template></span>
                </li>
              </ul>
            </CatalogSection>

            <CatalogSection v-if="work.titles.length || work.attributes.length || work.description" :title="$t('album.section.information')" :icon="Info" tone="sky">
              <div class="space-y-4 px-5 py-4 text-sm">
                <p v-if="work.description" class="whitespace-pre-line text-gray-600">{{ work.description }}</p>
                <CatalogTitleList v-if="work.titles.length" :titles="work.titles" />
                <CatalogAttributeList v-if="work.attributes.length" :attributes="work.attributes" />
              </div>
            </CatalogSection>

            <AlbumLinks v-if="work.links.length" :links="work.links" />
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Work } from '~/types/work'
import { Clapperboard, Disc3, Edit, FileText, GitBranch, History, Info, Music, Users } from '@lucide/vue'

const route = useRoute()
const { localName, formatDate, formatDuration, enumLabel } = useCatalogDisplay()
const { roleName } = useCatalogSchema()

const { data: work, pending, error } = await useAPI<Work>(`/v1/works/${route.params.id}`)

const shownTitle = computed(() => work.value ? localName(work.value.title, work.value.titles) : '')
/** Credits on the work itself, then those found on its recordings. */
const credits = computed(() => {
  if (!work.value) return []
  const seen = new Set<string>()
  return [...work.value.credits, ...work.value.track_credits].filter((credit) => {
    const key = `${credit.role}|${credit.artist?.id ?? credit.credited_as}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

useHead({ title: computed(() => shownTitle.value || 'Work') })
</script>
