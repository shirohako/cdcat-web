<script setup lang="ts">
import type { TracklistDensity, TracklistDisc, TracklistRow } from '~/utils/tracklistView'

/**
 * Style B, 内页: laid out like a CD booklet. 简洁 is two columns on a wide card (filling the left one first) with
 * dotted leaders to the length; 舒适 and 完整 have light large numbers, roles as tags, and in 完整 a liner block per
 * track: credits on the left, notes (原曲, attributes, ISRC, lyrics) on the right, each joined to its value by a
 * dotted leader. 简洁 and the others differ in structure, so that switch crossfades; 舒适 ↔ 完整 opens and folds.
 */
defineProps<{ discs: TracklistDisc[], density: TracklistDensity }>()

const { t } = useI18n()

const keyGroups = (row: TracklistRow) => [row.lead, row.maker].filter(group => group !== null)
// What the 舒适 line and the 完整 liner have besides the lyrics buttons. With nothing else, the buttons move to the
// end of the first line instead, so a track without credits doesn't get a line or a block holding only them.
const hasComfy = (row: TracklistRow) => Boolean(row.lead || row.maker || row.originals.length)
const hasNotes = (row: TracklistRow) => Boolean(row.originals.length || row.attributes.length || row.isrc)
const hasLiner = (row: TracklistRow) => Boolean(row.groups.length || row.subtitle || hasNotes(row))
const lyricsInline = (row: TracklistRow, density: TracklistDensity) => !row.instrumental
  && ((density === 'comfy' && !hasComfy(row)) || (density === 'full' && !hasLiner(row)))
</script>

<template>
  <Transition mode="out-in" enter-active-class="transition-opacity duration-[180ms]" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
    <div v-if="density === 'compact'" key="columns" class="px-5 pb-2">
      <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc" variant="booklet">
        <div class="gap-x-9 pt-1 @2xl:columns-2">
          <div
            v-for="row in disc.rows"
            :id="`track-${row.id}`"
            :key="row.id"
            :data-track-id="row.id"
            class="group -mx-1.5 flex h-8 scroll-mt-24 break-inside-avoid items-baseline gap-2 rounded-[4px] px-1.5 leading-8 transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
          >
            <span class="w-[1.125rem] shrink-0 text-[11.5px] tabular-nums text-faint">{{ row.number }}</span>
            <AlbumTracklistTitle :row="row" class="min-w-0 truncate text-[13.5px]" />
            <span class="leader" aria-hidden="true" />
            <!-- The heart right against the length -->
            <span class="flex shrink-0 items-center gap-0.5 self-center">
              <AlbumTracklistFavorite :row="row" />
              <span class="text-xs tabular-nums" :class="row.duration ? 'text-body' : 'text-faint'">{{ row.duration || '—' }}</span>
            </span>
          </div>
        </div>
      </AlbumTracklistDisc>
    </div>

    <div v-else key="rows" class="tl-booklet px-5 pb-2" :class="`is-${density}`">
      <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc" variant="booklet">
        <div
          v-for="row in disc.rows"
          :id="`track-${row.id}`"
          :key="row.id"
          :data-track-id="row.id"
          class="tl-row group relative -mx-2 grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-x-2.5 rounded-[4px] px-2 py-2 transition-colors duration-150 @lg:grid-cols-[2.25rem_minmax(0,1fr)_auto] hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
        >
          <span class="text-[17px] font-light leading-6 tracking-tight tabular-nums text-faint @lg:text-xl">{{ row.number }}</span>
          <span class="flex h-6 min-w-0 items-baseline gap-2.5">
            <AlbumTracklistTitle :row="row" class="min-w-0 truncate text-[15px] font-semibold leading-6" />
            <span v-if="row.instrumental" class="shrink-0 text-[10.5px] font-medium tracking-[0.12em] text-meta">{{ t('content_display.instrumental') }}</span>
            <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
              <AlbumTracklistLyrics v-if="lyricsInline(row, density)" :row="row" class="ml-auto self-center" />
            </Transition>
          </span>
          <!-- The heart right against the length, both at the end of the first line -->
          <span class="flex h-6 items-center justify-end gap-0.5">
            <AlbumTracklistFavorite :row="row" />
            <span class="text-[13px] leading-6 tabular-nums" :class="row.duration ? 'text-body' : 'text-faint'">{{ row.duration || '—' }}</span>
          </span>

          <UiCollapse v-if="hasComfy(row)" class="col-[2/-1]" :open="density === 'comfy'">
            <div class="flex items-start gap-3 pt-1">
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] leading-[1.125rem] text-title">
                <span v-for="group in keyGroups(row)" :key="group.role" class="inline-flex min-w-0 items-center gap-1.5">
                  <CatalogRoleTag :label="group.label" :category="group.category" />
                  <AlbumTracklistPeople :people="group.people" />
                </span>
                <span v-if="row.originals.length" class="inline-flex min-w-0 items-center gap-1.5">
                  <AlbumTracklistLabel>{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel>
                  <AlbumTracklistOriginals :originals="row.originals" />
                </span>
              </div>
              <AlbumTracklistLyrics :row="row" />
            </div>
          </UiCollapse>

          <UiCollapse v-if="hasLiner(row)" class="col-[2/-1]" :open="density === 'full'" lazy>
            <p v-if="row.subtitle" class="pt-1 text-xs text-meta">
              <span class="mr-1 text-faint">{{ t('album.tracklist.original_title') }}</span>{{ row.subtitle }}
            </p>
            <div class="grid gap-x-7 pb-1 pt-1.5 @xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div v-if="row.groups.length">
                <div v-for="group in row.groups" :key="group.role" class="liner-line">
                  <CatalogRoleTag :label="group.label" :category="group.category" />
                  <span class="leader" aria-hidden="true" />
                  <AlbumTracklistPeople :people="group.people" stack class="value text-title" />
                </div>
              </div>
              <!-- Notes; the 歌词 line comes along whenever there is a liner at all -->
              <div v-if="hasNotes(row) || !row.instrumental">
                <div v-if="row.originals.length" class="liner-line">
                  <AlbumTracklistLabel>{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel>
                  <span class="leader" aria-hidden="true" />
                  <AlbumTracklistOriginals :originals="row.originals" stack class="value text-title" />
                </div>
                <div v-for="attribute in row.attributes" :key="attribute.key" class="liner-line">
                  <AlbumTracklistLabel>{{ attribute.label }}</AlbumTracklistLabel>
                  <span class="leader" aria-hidden="true" />
                  <span class="text-title">{{ attribute.value }}</span>
                </div>
                <div v-if="row.isrc" class="liner-line">
                  <AlbumTracklistLabel>ISRC</AlbumTracklistLabel>
                  <span class="leader" aria-hidden="true" />
                  <span class="font-mono text-title">{{ row.isrc }}</span>
                </div>
                <div v-if="!row.instrumental" class="liner-line">
                  <AlbumTracklistLabel>{{ t('album.tracklist.columns.lyrics') }}</AlbumTracklistLabel>
                  <span class="leader" aria-hidden="true" />
                  <AlbumTracklistLyrics :row="row" />
                </div>
              </div>
            </div>
          </UiCollapse>
        </div>
      </AlbumTracklistDisc>
    </div>
  </Transition>
</template>

<style scoped>
/* A dotted leader from a label (or a title) to its value, as in a booklet. */
.leader {
  flex: 1 1 0.75rem;
  min-width: 0.75rem;
  border-bottom: 1px dotted var(--faint);
  translate: 0 -0.25rem;
}

.liner-line {
  /* Label, leader, value. Everything lines up on the first line, so a value that runs to several lines (several
     原曲, several people, a long name) grows downwards instead of pushing the label and leader off centre. The
     leader keeps at least a short visible run. */
  display: grid;
  grid-template-columns: auto minmax(1.5rem, 1fr) auto;
  align-items: start;
  column-gap: 0.5rem;
  min-width: 0;
  padding-block: 0.1875rem;
  font-size: 12.5px;
  line-height: 1.375rem;
}

.liner-line > :first-child {
  margin-top: 0.125rem;
}

.liner-line .leader {
  margin-top: 0.875rem;
  translate: none;
}

.liner-line .value {
  min-width: 0;
  max-width: 100%;
  text-align: right;
  overflow-wrap: anywhere;
}

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
