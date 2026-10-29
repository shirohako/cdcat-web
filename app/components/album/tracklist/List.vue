<script setup lang="ts">
import type { TracklistDensity, TracklistDisc, TracklistRow } from '~/utils/tracklistView'

/**
 * Style A, 清单: like a music app, one row per track. The first line (number, heart, title, length) is the same in
 * every density, so switching only opens and folds what is under it: the 舒适 line (who sings, who arranged, 原曲,
 * lyrics) and the 完整 block (every credit as a role tag, notes, counts), which mounts the first time it opens.
 */
defineProps<{ discs: TracklistDisc[], density: TracklistDensity }>()

const { t } = useI18n()
// Albums awaiting review have no hearts, so no column for them either.
const { locked } = useTracklist()

const keyGroups = (row: TracklistRow) => [row.lead, row.maker].filter(group => group !== null)
// What the 舒适 line and the 完整 block have besides the lyrics buttons. With nothing else, the buttons move to the
// end of the first line instead, so a track without credits doesn't get a line holding only them.
const hasComfy = (row: TracklistRow) => Boolean(row.lead || row.maker || row.originals.length)
const hasNotes = (row: TracklistRow) => Boolean(row.originals.length || row.attributes.length || row.isrc || row.favorites)
const hasFull = (row: TracklistRow) => Boolean(row.groups.length || row.subtitle || hasNotes(row))
const lyricsInline = (row: TracklistRow, density: TracklistDensity) => !row.instrumental
  && ((density === 'comfy' && !hasComfy(row)) || (density === 'full' && !hasFull(row)))
</script>

<template>
  <div class="tl-list px-3 pb-1.5" :class="`is-${density}`">
    <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc">
      <div
        v-for="row in disc.rows"
        :id="`track-${row.id}`"
        :key="row.id"
        :data-track-id="row.id"
        :class="locked ? 'grid-cols-[1.375rem_0_minmax(0,1fr)_2.5rem]' : 'grid-cols-[1.375rem_1.25rem_minmax(0,1fr)_2.5rem]'"
        class="tl-row group relative grid scroll-mt-24 items-start gap-x-1.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
      >
        <!-- Right-aligned against the heart, both centred on the 24px first line -->
        <span class="flex h-6 items-center justify-end text-xs tabular-nums text-meta">{{ row.number }}</span>
        <!-- The heart has its own column after the number, the same place in every density -->
        <AlbumTracklistFavorite :row="row" class="mt-0.5" />
        <span class="flex h-6 min-w-0 items-center gap-1.5">
          <AlbumTracklistTitle :row="row" class="min-w-0 truncate text-sm font-medium leading-6" />
          <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
            <AlbumTracklistLabel v-if="row.instrumental && density !== 'compact'">{{ t('content_display.instrumental') }}</AlbumTracklistLabel>
          </Transition>
          <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
            <AlbumTracklistLyrics v-if="lyricsInline(row, density)" :row="row" class="ml-auto" />
          </Transition>
        </span>
        <span class="text-right text-xs leading-6 tabular-nums" :class="row.duration ? 'text-meta' : 'text-faint'">{{ row.duration || '—' }}</span>

        <UiCollapse v-if="hasComfy(row)" class="col-[3/-1]" :open="density === 'comfy'">
          <div class="flex min-h-[1.375rem] items-center gap-3 pt-px">
            <!-- Roles as tags (原曲 as a grey one), names after them; one line, cut with … when it runs long -->
            <p class="min-w-0 flex-1 truncate text-xs leading-5 text-body">
              <template v-for="(group, index) in keyGroups(row)" :key="group.role">
                <CatalogRoleTag :label="group.label" :category="group.category" size="xs" class="mr-1 align-[1px]" :class="index > 0 && 'ml-3'" />
                <AlbumTracklistPeople :people="group.people" />
              </template>
              <template v-if="row.originals.length">
                <AlbumTracklistLabel size="xs" class="mr-1 align-[1px]" :class="keyGroups(row).length > 0 && 'ml-3'">{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel>
                <AlbumTracklistOriginals :originals="row.originals" />
              </template>
            </p>
            <AlbumTracklistLyrics :row="row" />
          </div>
        </UiCollapse>

        <UiCollapse v-if="hasFull(row)" class="col-[3/-1]" :open="density === 'full'" lazy>
          <!-- Credits and notes on the left, the lyrics buttons at the top right beside them, so they never take a line
               of their own -->
          <div class="flex items-start gap-3 pb-1.5 pt-1">
            <div class="min-w-0 flex-1">
              <p v-if="row.subtitle" class="mb-1.5 flex min-w-0 items-center gap-2 text-[12.5px] leading-[1.125rem] text-title">
                <AlbumTracklistLabel>{{ t('album.tracklist.original_title') }}</AlbumTracklistLabel><span class="min-w-0 truncate">{{ row.subtitle }}</span>
              </p>
              <div v-if="row.groups.length" class="grid gap-x-5 gap-y-1.5 @xl:grid-cols-2">
                <div v-for="group in row.groups" :key="group.role" class="flex min-w-0 items-start gap-2 text-[12.5px] leading-[1.125rem] text-title">
                  <CatalogRoleTag :label="group.label" :category="group.category" />
                  <AlbumTracklistPeople :people="group.people" class="min-w-0" />
                </div>
              </div>
              <!-- The notes, each behind a grey label tag like the roles above: 原曲, attributes (BPM …), ISRC, 收藏 -->
              <div v-if="hasNotes(row)" class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] leading-[1.375rem] text-title" :class="row.groups.length > 0 && 'mt-2'">
                <span v-if="row.originals.length" class="inline-flex min-w-0 items-center gap-2"><AlbumTracklistLabel>{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel><AlbumTracklistOriginals :originals="row.originals" /></span>
                <span v-for="attribute in row.attributes" :key="attribute.key" class="inline-flex items-center gap-2"><AlbumTracklistLabel>{{ attribute.label }}</AlbumTracklistLabel>{{ attribute.value }}</span>
                <span v-if="row.isrc" class="inline-flex items-center gap-2"><AlbumTracklistLabel>ISRC</AlbumTracklistLabel><span class="font-mono text-xs">{{ row.isrc }}</span></span>
                <span v-if="row.favorites" class="inline-flex items-center gap-2"><AlbumTracklistLabel>{{ t('album.tracklist.columns.favorites') }}</AlbumTracklistLabel><span class="tabular-nums">{{ row.favorites }}</span></span>
              </div>
            </div>
            <AlbumTracklistLyrics :row="row" class="-mt-px" />
          </div>
        </UiCollapse>
      </div>
    </AlbumTracklistDisc>
  </div>
</template>

<style scoped>
/* 完整: hairlines between tracks, faded in with the switch; none next to the row under the pointer. */
.tl-row + .tl-row::before {
  position: absolute;
  top: 0;
  inset-inline: 0.5rem;
  height: 1px;
  background: var(--line);
  content: "";
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.is-full .tl-row + .tl-row::before {
  opacity: 1;
}

.is-full .tl-row:hover::before,
.is-full .tl-row:hover + .tl-row::before {
  opacity: 0;
}
</style>
