<script setup lang="ts">
import type { TracklistDensity, TracklistDisc, TracklistRow } from '~/utils/tracklistView'

/**
 * Style B, 内页: laid out like a CD booklet, offered as 内页 · 完整 only (its 简洁 and 舒适 went on 2026-11-11). Light
 * large numbers, and a liner block per track: credits on the left as role tags, notes (原曲, attributes, ISRC, lyrics)
 * on the right, each joined to its value by a dotted leader. `density` is always `full`; it is taken so every style
 * has the same props.
 */
defineProps<{ discs: TracklistDisc[], density: TracklistDensity }>()

const { t } = useI18n()

const hasNotes = (row: TracklistRow) => Boolean(row.originals.length || row.attributes.length || row.isrc)
const hasLiner = (row: TracklistRow) => Boolean(row.groups.length || row.subtitle || hasNotes(row))
// With no liner, the lyrics buttons go to the end of the title line instead of a block holding only them.
const lyricsInline = (row: TracklistRow) => !row.instrumental && !hasLiner(row)
</script>

<template>
  <div class="px-5 pb-2">
    <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc" variant="booklet">
      <div
        v-for="row in disc.rows"
        :id="`track-${row.id}`"
        :key="row.id"
        :data-track-id="row.id"
        class="tl-row group relative -mx-2 grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-x-2.5 rounded-sm px-2 py-2 transition-colors duration-150 @lg:grid-cols-[2.25rem_minmax(0,1fr)_auto] hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
      >
        <span class="text-[1.0625rem] font-light leading-6 tracking-tight tabular-nums text-faint @lg:text-xl">{{ row.number }}</span>
        <span class="flex h-6 min-w-0 items-baseline gap-2.5">
          <AlbumTracklistTitle :row="row" class="min-w-0 truncate text-15 font-semibold leading-6" />
          <span v-if="row.instrumental" class="shrink-0 text-11 font-medium tracking-[0.12em] text-meta">{{ t('content_display.instrumental') }}</span>
          <AlbumTracklistLyrics v-if="lyricsInline(row)" :row="row" class="ml-auto self-center" />
        </span>
        <!-- The heart right against the length, both at the end of the first line -->
        <span class="flex h-6 items-center justify-end gap-0.5">
          <AlbumTracklistFavorite :row="row" />
          <span class="text-13 leading-6 tabular-nums" :class="row.duration ? 'text-body' : 'text-faint'">{{ row.duration || '—' }}</span>
        </span>

        <div v-if="hasLiner(row)" class="col-[2/-1]">
          <p v-if="row.subtitle" class="pt-1 text-xs text-meta">
            <span class="mr-1 text-faint">{{ t('album.tracklist.original_title') }}</span>{{ row.subtitle }}
          </p>
          <div class="grid gap-x-7 pb-1 pt-1.5 @xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div v-if="row.groups.length">
              <div v-for="group in row.groups" :key="group.key" class="liner-line">
                <CatalogRoleTag :label="group.label" :tip="group.tip" :category="group.category" />
                <span class="leader" aria-hidden="true" />
                <AlbumTracklistPeople :people="group.people" stack end class="value mt-0.5" />
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
        </div>
      </div>
    </AlbumTracklistDisc>
  </div>
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
  font-size: 0.8125rem;
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

/* A rule between tracks, hidden around the hovered one */
.tl-row + .tl-row::before {
  position: absolute;
  top: 0;
  inset-inline: 0.5rem;
  height: 1px;
  background: var(--line);
  content: "";
  transition: opacity 200ms ease-out;
}

.tl-row:hover::before,
.tl-row:hover + .tl-row::before {
  opacity: 0;
}
</style>
