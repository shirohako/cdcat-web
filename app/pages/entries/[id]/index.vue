<script setup lang="ts">
import { Calendar, Disc, ExternalLink, Film, Layers, Link2, Music2, Pencil } from '@lucide/vue'
import { ENTRY_RELATIONS, ENTRY_ALBUM_RELATIONS, type EntryDetail, type EntryAlbum, type RelatedEntry } from '~/types/entry'

const route = useRoute()
const { languageName } = useLocaleFormatting()
const { displayName, originalName, typeLabel, formatLabel, typeWithFormat, relationLabel, albumRelationLabel, typeIcon, formatReleaseDate } = useEntryDisplay()

const { data: entry, pending, error } = await useAPI<EntryDetail>(() => `/v1/entries/${route.params.id}`)

useHead({ title: computed(() => entry.value ? displayName(entry.value) : '') })

const name = computed(() => displayName(entry.value))
const subtitle = computed(() => originalName(entry.value))
// Every name except the one in the heading.
const otherTitles = computed(() => (entry.value?.titles || []).filter(title => title.title !== name.value))

const groupBy = <T extends { relation_type: string }>(items: T[], order: readonly string[]) => {
  const groups = new Map<string, T[]>()
  for (const item of items) groups.set(item.relation_type, [...(groups.get(item.relation_type) || []), item])
  return [...groups.entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
}
const albumGroups = computed(() => groupBy<EntryAlbum>(entry.value?.albums || [], ENTRY_ALBUM_RELATIONS))
const relationGroups = computed(() => groupBy<RelatedEntry>(entry.value?.related_entries || [], ENTRY_RELATIONS))

const providerLabel = (name?: string) => (name || '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <div v-if="pending" class="flex min-h-screen items-center justify-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error || !entry" class="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Film :size="56" class="text-gray-300" />
      <p>{{ $t('catalog.not_found') }}</p>
    </div>

    <template v-else>
      <!-- Hero -->
      <div class="relative h-96 w-full overflow-hidden bg-slate-900">
        <img v-if="entry.banner_url || entry.image_url" :src="entry.banner_url || entry.image_url!" alt="" class="absolute inset-0 h-full w-full object-cover" :class="{ 'scale-110 opacity-40 blur-2xl': !entry.banner_url }" >
        <div class="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />

        <div class="container relative z-10 mx-auto h-full max-w-6xl px-4 md:px-8 2xl:max-w-7xl">
          <div class="flex h-full items-end gap-6 pb-8">
            <div class="hidden w-40 shrink-0 sm:block md:w-48">
              <div class="aspect-2/3 overflow-hidden rounded-xl border-4 border-white/10 shadow-2xl">
                <img v-if="entry.image_url" :src="entry.image_url" :alt="name" class="h-full w-full object-cover" >
                <div v-else class="flex h-full w-full items-center justify-center bg-gray-700">
                  <Film :size="56" class="text-gray-500" />
                </div>
              </div>
            </div>

            <div class="min-w-0 flex-1 pb-2 text-white">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  <Icon :name="typeIcon(entry.type)" class="h-4 w-4" />
                  {{ typeWithFormat(entry.type, entry.format) }}
                </span>
                <NuxtLink
                  v-for="franchise in entry.franchises"
                  :key="franchise.id"
                  :to="`/franchises/${franchise.id}`"
                  class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 px-3 py-1 text-sm backdrop-blur-sm hover:bg-emerald-500/50"
                >
                  <Layers class="h-3.5 w-3.5" />
                  <template v-if="franchise.parent">{{ franchise.parent.name }} › </template>{{ franchise.name }}
                </NuxtLink>
              </div>

              <h1 class="text-3xl font-bold drop-shadow-lg md:text-5xl">{{ name }}</h1>
              <p v-if="subtitle" class="mt-2 text-lg text-white/80">{{ subtitle }}</p>

              <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/85">
                <span v-if="entry.release_date" class="flex items-center gap-2">
                  <Calendar :size="18" />
                  {{ formatReleaseDate(entry.release_date, entry.release_date_precision) }}
                </span>
                <span v-if="entry.episodes" class="flex items-center gap-2">
                  <Film :size="18" />
                  {{ $t('catalog.episodes_count', { count: entry.episodes }) }}
                </span>
                <span class="flex items-center gap-2">
                  <Music2 :size="18" />
                  {{ $t('catalog.albums_count', { count: entry.albums_count ?? entry.albums.length }) }}
                </span>
                <NuxtLink :to="`/contribute/entry/${entry.id}`" class="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25">
                  <Pencil class="h-4 w-4" />
                  {{ $t('catalog.edit') }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div class="space-y-8 lg:col-span-2">
            <section v-if="entry.description" class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-xl font-bold">{{ $t('catalog.description') }}</h2>
              <p class="whitespace-pre-wrap leading-relaxed text-gray-700">{{ entry.description }}</p>
            </section>

            <!-- Related music, grouped by relation -->
            <section class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 class="mb-6 flex items-center gap-2 text-xl font-bold">
                <Music2 :size="22" />
                {{ $t('catalog.related_albums') }}
              </h2>
              <div v-if="albumGroups.length" class="space-y-6">
                <div v-for="[relation, albums] in albumGroups" :key="relation">
                  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{{ albumRelationLabel(relation) }}</h3>
                  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    <NuxtLink v-for="album in albums" :key="album.id" :to="`/albums/${album.id}`" class="group">
                      <div class="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-shadow hover:shadow-md">
                        <div class="flex aspect-square items-center justify-center overflow-hidden bg-gray-100">
                          <img v-if="album.image_url" :src="album.image_url" :alt="album.title" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" >
                          <Disc v-else :size="44" class="text-gray-400" />
                        </div>
                        <div class="p-3">
                          <h4 class="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">{{ album.title }}</h4>
                          <p class="mt-1 truncate text-xs text-gray-500">
                            {{ [album.character_name, album.episode ? $t('catalog.episode_n', { n: album.episode }) : null, album.release_date].filter(Boolean).join(' · ') }}
                          </p>
                          <p v-if="album.note" class="mt-0.5 truncate text-xs text-gray-400">{{ album.note }}</p>
                        </div>
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </div>
              <div v-else class="py-8 text-center text-gray-500">
                <Disc :size="44" class="mx-auto mb-3 text-gray-300" />
                <p>{{ $t('catalog.no_albums') }}</p>
              </div>
            </section>

            <!-- Related entries, both directions -->
            <section v-if="relationGroups.length" class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 class="mb-6 flex items-center gap-2 text-xl font-bold">
                <Link2 :size="22" />
                {{ $t('catalog.related_entries') }}
              </h2>
              <div class="space-y-5">
                <div v-for="[relation, items] in relationGroups" :key="relation">
                  <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{{ relationLabel(relation) }}</h3>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NuxtLink
                      v-for="related in items"
                      :key="related.id"
                      :to="`/entries/${related.id}`"
                      class="group flex gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-primary/40"
                    >
                      <div class="h-20 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
                        <img v-if="related.image_url" :src="related.image_url" :alt="related.name" class="h-full w-full object-cover" loading="lazy" >
                        <div v-else class="flex h-full items-center justify-center text-gray-300"><Film :size="22" /></div>
                      </div>
                      <div class="min-w-0">
                        <p class="line-clamp-2 font-semibold text-gray-900 group-hover:text-primary">{{ related.name }}</p>
                        <p class="mt-1 text-xs text-gray-500">
                          {{ [typeWithFormat(related.type, related.format), formatReleaseDate(related.release_date, related.release_date_precision)].filter(Boolean).join(' · ') }}
                        </p>
                        <p v-if="related.note" class="mt-0.5 truncate text-xs text-gray-400">{{ related.note }}</p>
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside class="space-y-6">
            <section class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-lg font-bold">{{ $t('catalog.information') }}</h3>
              <dl class="space-y-3 text-sm">
                <div>
                  <dt class="text-gray-500">{{ $t('catalog.type') }}</dt>
                  <dd class="font-medium">{{ typeLabel(entry.type) }}</dd>
                </div>
                <div v-if="entry.format">
                  <dt class="text-gray-500">{{ $t('catalog.format_label') }}</dt>
                  <dd class="font-medium">{{ formatLabel(entry.format) }}</dd>
                </div>
                <div v-if="entry.release_date">
                  <dt class="text-gray-500">{{ $t('catalog.release_date') }}</dt>
                  <dd class="font-medium">{{ formatReleaseDate(entry.release_date, entry.release_date_precision) }}</dd>
                </div>
                <div v-if="entry.episodes">
                  <dt class="text-gray-500">{{ $t('catalog.episodes') }}</dt>
                  <dd class="font-medium">{{ entry.episodes }}</dd>
                </div>
                <div v-if="entry.platforms?.length">
                  <dt class="text-gray-500">{{ $t('catalog.platforms') }}</dt>
                  <dd class="mt-1 flex flex-wrap gap-1.5">
                    <span v-for="platform in entry.platforms" :key="platform" class="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{{ platform }}</span>
                  </dd>
                </div>
              </dl>
            </section>

            <section v-if="otherTitles.length" class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-lg font-bold">{{ $t('catalog.other_names') }}</h3>
              <ul class="space-y-2.5 text-sm">
                <li v-for="(title, index) in otherTitles" :key="index">
                  <p class="font-medium text-gray-900">{{ title.title }}</p>
                  <p class="text-xs text-gray-500">
                    {{ [title.locale ? languageName(title.locale) : null, $t(`catalog.title_kind.${title.kind}`)].filter(Boolean).join(' · ') }}
                  </p>
                </li>
              </ul>
            </section>

            <section v-if="entry.links.length" class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 class="mb-4 text-lg font-bold">{{ $t('catalog.links') }}</h3>
              <div class="space-y-1">
                <a
                  v-for="link in entry.links"
                  :key="link.id"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-gray-50"
                >
                  <ExternalLink :size="16" class="text-gray-400 group-hover:text-primary" />
                  <span class="flex-1 truncate text-gray-700 group-hover:text-primary">{{ providerLabel(link.provider?.name) || link.url }}</span>
                </a>
              </div>
            </section>

            <ArticleRelatedArticles :id="entry.id" type="entry" />
            <DiscussionRelatedDiscussions :id="entry.id" type="entry" />
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>
