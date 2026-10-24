<script setup lang="ts">
import { Calendar, Disc, ExternalLink, Film, Layers, Link2, Music2, Pencil } from '@lucide/vue'
import { ENTRY_RELATIONS, ENTRY_ALBUM_RELATIONS, type EntryDetail, type EntryAlbum, type RelatedEntry } from '~/types/entry'

const route = useRoute()
const { languageName } = useLocaleFormatting()
const { displayName, originalName, typeLabel, formatLabel, typeWithFormat, relationLabel, albumRelationLabel, typeIcon, formatReleaseDate } = useEntryDisplay()

const { data: entry, status, revealClass } = await usePageAPI<EntryDetail>(() => `/v1/entries/${route.params.id}`)

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
  <div class="min-h-screen">
    <div v-if="entry" :class="revealClass">
      <!-- Hero: always dark, the banner under a black scrim -->
      <div class="relative h-96 w-full overflow-hidden bg-hero">
        <img v-if="entry.banner_url || entry.image_url" v-img-fade :src="entry.banner_url || entry.image_url!" alt="" class="absolute inset-0 h-full w-full object-cover" :class="{ 'scale-110 opacity-40 blur-2xl': !entry.banner_url }" >
        <div class="absolute inset-0 bg-linear-to-t from-black via-black/60 to-transparent" />

        <div class="container relative z-10 mx-auto h-full max-w-6xl px-4 md:px-8 2xl:max-w-7xl">
          <div class="flex h-full items-end gap-6 pb-8">
            <div class="hidden w-40 shrink-0 sm:block md:w-48">
              <div class="aspect-2/3 overflow-hidden rounded-xl border-4 border-on-media/10">
                <img v-if="entry.image_url" v-img-fade :src="entry.image_url" :alt="name" class="h-full w-full object-cover" >
                <div v-else class="flex h-full w-full items-center justify-center bg-on-media/10">
                  <Film :size="56" class="text-on-media/40" />
                </div>
              </div>
            </div>

            <div class="min-w-0 flex-1 pb-2 text-on-media">
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-2 rounded-full bg-on-media/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  <Icon :name="typeIcon(entry.type)" class="h-4 w-4" />
                  {{ typeWithFormat(entry.type, entry.format) }}
                </span>
                <NuxtLink
                  v-for="franchise in entry.franchises"
                  :key="franchise.id"
                  :to="`/franchises/${franchise.id}`"
                  class="inline-flex items-center gap-1.5 rounded-full bg-primary/30 px-3 py-1 text-sm backdrop-blur-sm transition-colors duration-150 ease-out hover:bg-primary/50"
                >
                  <Layers class="h-3.5 w-3.5" />
                  <template v-if="franchise.parent">{{ franchise.parent.name }} › </template>{{ franchise.name }}
                </NuxtLink>
              </div>

              <h1 class="text-3xl font-bold md:text-5xl">{{ name }}</h1>
              <p v-if="subtitle" class="mt-2 text-lg text-on-media/80">{{ subtitle }}</p>

              <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-on-media/85">
                <span v-if="entry.release_date" class="flex items-center gap-2">
                  <Calendar :size="18" />
                  {{ formatReleaseDate(entry.release_date, entry.release_date_precision) }}
                </span>
                <span class="flex items-center gap-2">
                  <Music2 :size="18" />
                  {{ $t('catalog.albums_count', { count: entry.albums_count ?? entry.albums.length }) }}
                </span>
                <NuxtLink :to="`/contribute/entry/${entry.id}`" class="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-on-media/15 px-3 py-1.5 text-sm transition-colors duration-150 ease-out hover:bg-on-media/25">
                  <Pencil class="h-4 w-4" />
                  {{ $t('catalog.edit') }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CatalogPendingBanner :pending="entry.is_pending" :revision="entry.pending_revision" />

      <div class="container mx-auto max-w-6xl px-4 py-8 md:px-8 2xl:max-w-7xl">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div class="space-y-8 lg:col-span-2">
            <section v-if="entry.description" class="card p-6">
              <h2 class="mb-4 text-xl font-bold text-title">{{ $t('catalog.description') }}</h2>
              <p class="whitespace-pre-wrap leading-relaxed text-body">{{ entry.description }}</p>
            </section>

            <!-- Related music, grouped by relation -->
            <section class="card p-6">
              <h2 class="mb-6 flex items-center gap-2 text-xl font-bold text-title">
                <Music2 :size="22" />
                {{ $t('catalog.related_albums') }}
              </h2>
              <div v-if="albumGroups.length" class="space-y-6">
                <div v-for="[relation, albums] in albumGroups" :key="relation">
                  <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-meta">{{ albumRelationLabel(relation) }}</h3>
                  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    <NuxtLink v-for="album in albums" :key="album.id" :to="`/albums/${album.id}`" class="group">
                      <div class="overflow-hidden rounded-xl bg-sunken transition-colors duration-150 ease-out group-hover:bg-card-hover group-active:bg-card-active">
                        <div class="flex aspect-square items-center justify-center overflow-hidden">
                          <img v-if="album.image_url" :src="album.image_url" :alt="album.title" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" >
                          <Disc v-else :size="44" class="text-faint" />
                        </div>
                        <div class="p-3">
                          <h4 class="line-clamp-2 text-sm font-semibold text-title transition-colors group-hover:text-primary">{{ album.title }}</h4>
                          <p class="mt-1 truncate text-xs text-meta">
                            {{ album.release_date }}
                          </p>
                          <p v-if="album.note" class="mt-0.5 truncate text-xs text-meta">{{ album.note }}</p>
                        </div>
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </div>
              <UiEmpty v-else :title="$t('catalog.no_albums')" :icon="Disc" />
            </section>

            <!-- Related entries, both directions -->
            <section v-if="relationGroups.length" class="card p-6">
              <h2 class="mb-6 flex items-center gap-2 text-xl font-bold text-title">
                <Link2 :size="22" />
                {{ $t('catalog.related_entries') }}
              </h2>
              <div class="space-y-5">
                <div v-for="[relation, items] in relationGroups" :key="relation">
                  <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-meta">{{ relationLabel(relation) }}</h3>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NuxtLink
                      v-for="related in items"
                      :key="related.id"
                      :to="`/entries/${related.id}`"
                      class="group flex gap-3 rounded-xl bg-sunken p-3 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
                    >
                      <div class="h-20 w-14 shrink-0 overflow-hidden rounded bg-btn">
                        <img v-if="related.image_url" :src="related.image_url" :alt="related.name" class="h-full w-full object-cover" loading="lazy" >
                        <div v-else class="flex h-full items-center justify-center text-faint"><Film :size="22" /></div>
                      </div>
                      <div class="min-w-0">
                        <p class="line-clamp-2 font-semibold text-title transition-colors group-hover:text-primary">{{ related.name }}</p>
                        <p class="mt-1 text-xs text-meta">
                          {{ [typeWithFormat(related.type, related.format), formatReleaseDate(related.release_date, related.release_date_precision)].filter(Boolean).join(' · ') }}
                        </p>
                        <p v-if="related.note" class="mt-0.5 truncate text-xs text-meta">{{ related.note }}</p>
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside class="space-y-6">
            <section class="card p-6">
              <h3 class="mb-4 text-lg font-bold text-title">{{ $t('catalog.information') }}</h3>
              <dl class="space-y-3 text-sm">
                <div>
                  <dt class="text-meta">{{ $t('catalog.type') }}</dt>
                  <dd class="font-medium text-title">{{ typeLabel(entry.type) }}</dd>
                </div>
                <div v-if="entry.format">
                  <dt class="text-meta">{{ $t('catalog.format_label') }}</dt>
                  <dd class="font-medium text-title">{{ formatLabel(entry.format) }}</dd>
                </div>
                <div v-if="entry.release_date">
                  <dt class="text-meta">{{ $t('catalog.release_date') }}</dt>
                  <dd class="font-medium text-title">{{ formatReleaseDate(entry.release_date, entry.release_date_precision) }}</dd>
                </div>
                <div v-if="entry.platforms?.length">
                  <dt class="text-meta">{{ $t('catalog.platforms') }}</dt>
                  <dd class="mt-1 flex flex-wrap gap-1.5">
                    <span v-for="platform in entry.platforms" :key="platform" class="rounded-full bg-btn px-2 py-0.5 text-xs text-btn-content">{{ platform }}</span>
                  </dd>
                </div>
              </dl>
            </section>

            <section v-if="otherTitles.length" class="card p-6">
              <h3 class="mb-4 text-lg font-bold text-title">{{ $t('catalog.other_names') }}</h3>
              <ul class="space-y-2.5 text-sm">
                <li v-for="(title, index) in otherTitles" :key="index">
                  <p class="font-medium text-title">{{ title.title }}</p>
                  <p class="text-xs text-meta">
                    {{ [title.locale ? languageName(title.locale) : null, $t(`catalog.title_kind.${title.kind}`)].filter(Boolean).join(' · ') }}
                  </p>
                </li>
              </ul>
            </section>

            <section v-if="entry.links.length" class="card p-6">
              <h3 class="mb-4 text-lg font-bold text-title">{{ $t('catalog.links') }}</h3>
              <div class="space-y-1">
                <a
                  v-for="link in entry.links"
                  :key="link.id"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex items-center gap-3 rounded-lg p-2.5 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
                >
                  <ExternalLink :size="16" class="text-meta transition-colors group-hover:text-primary" />
                  <span class="flex-1 truncate text-body transition-colors group-hover:text-primary">{{ providerLabel(link.provider?.name) || link.url }}</span>
                </a>
              </div>
            </section>

            <template v-if="!entry.is_pending">
              <ArticleRelatedArticles :id="entry.id" type="entry" />
              <DiscussionRelatedDiscussions :id="entry.id" type="entry" />
            </template>
          </aside>
        </div>
      </div>
    </div>

    <div v-else-if="status === 'error'" class="flex min-h-[60vh] items-center justify-center">
      <UiEmpty :title="$t('catalog.not_found')" :icon="Film" />
    </div>

    <SkeletonCatalogDetail v-else hero="poster" />
  </div>
</template>
