<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'
import { ArrowRight } from '@lucide/vue'

/** The track hover card, from what the page already has: other titles, length, credits, 原曲 and counts. */
const props = defineProps<{ row: TracklistRow }>()

const { t } = useI18n()
const MAX_GROUPS = 6
const groups = computed(() => props.row.groups.slice(0, MAX_GROUPS))
</script>

<template>
  <div class="text-[13px] leading-normal">
    <p class="text-[11px] font-semibold tracking-wide text-meta">Disc {{ row.discPosition }} · {{ row.number }}</p>
    <p class="text-[15px] font-bold leading-snug text-title">{{ row.title }}</p>
    <p v-if="row.subtitle" class="mt-0.5 text-[12.5px] text-body">{{ row.subtitle }}<span class="ml-2 text-[11px] text-meta">{{ t('album.tracklist.original_title') }}</span></p>
    <p v-for="title in row.otherTitles.filter(item => item.title !== row.title && item.title !== row.subtitle)" :key="title.title + title.label" class="mt-0.5 text-[12.5px] text-body">
      {{ title.title }}<span class="ml-2 text-[11px] text-meta">{{ title.label }}</span>
    </p>

    <p class="mt-2 text-xs text-meta">
      <span v-if="row.duration">{{ t('album.tracklist.columns.duration') }} <span class="tabular-nums text-body">{{ row.duration }}</span></span>
      <template v-if="row.instrumental"><span v-if="row.duration" class="mx-1.5 text-faint">·</span>{{ t('content_display.instrumental') }}</template>
      <template v-for="attribute in row.attributes" :key="attribute.key"><span class="mx-1.5 text-faint">·</span>{{ attribute.label }} <span class="text-body">{{ attribute.value }}</span></template>
      <template v-if="row.isrc"><span class="mx-1.5 text-faint">·</span>ISRC <span class="font-mono text-body">{{ row.isrc }}</span></template>
    </p>

    <div v-if="groups.length" class="mt-2.5 grid gap-1.5">
      <div v-for="group in groups" :key="group.role" class="flex min-w-0 items-start gap-2 text-[12.5px] leading-[1.125rem] text-title">
        <CatalogRoleTag :label="group.label" :category="group.category" />
        <span class="min-w-0">
          <template v-for="(person, index) in group.people" :key="index">{{ person.name }}<span v-if="person.detail" class="text-meta"> ({{ person.detail }})</span><span v-if="index < group.people.length - 1">, </span></template>
        </span>
      </div>
      <p v-if="row.groups.length > MAX_GROUPS" class="text-xs text-meta">…</p>
    </div>

    <p v-if="row.originals.length" class="mt-2 flex items-center gap-2 text-xs text-meta">
      <AlbumTracklistLabel>{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel>
      <AlbumTracklistOriginals :originals="row.originals" class="text-body" />
    </p>

    <div class="mt-3 flex items-center gap-2 border-t border-line pt-2.5">
      <AlbumTracklistLyrics :row="row" />
      <AlbumTracklistFavorite :row="row" chip />
      <NuxtLink :to="`/tracks/${row.id}`" class="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-title hover:underline">
        {{ t('album.tracklist.open_track') }}<ArrowRight :size="13" />
      </NuxtLink>
    </div>
  </div>
</template>
