<script setup lang="ts">
import type { TracklistDensity, TracklistDisc, TracklistRow } from '~/utils/tracklistView'
import { mergeSamePeople } from '~/utils/tracklistView'

/**
 * Style B, 内页: laid out like a CD booklet, offered as 内页 · 完整 only (its 简洁 and 舒适 went on 2026-11-11). Light
 * large numbers; the first line ends as in 清单: the more menu (on hover), the heart, the lyrics buttons and the
 * length. Under it a liner per track: every credit as role tag, dotted leader and names, roles held by the same people
 * on one line (作曲 编曲 高田暁), then the notes (原曲, attributes, ISRC), all in one flow that fills two columns on a
 * wide card, like a booklet's staff list. Tracks are set apart by space and their numbers, with no rules between them
 * (2026-11-11). `density` is always `full`; it is taken so every style has the same props.
 */
defineProps<{ discs: TracklistDisc[], density: TracklistDensity }>()

const { t } = useI18n()

const hasLiner = (row: TracklistRow) => Boolean(row.groups.length || row.subtitle || row.originals.length || row.attributes.length || row.isrc)
</script>

<template>
  <div class="px-5 pb-2">
    <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc" variant="booklet">
      <div
        v-for="row in disc.rows"
        :id="`track-${row.id}`"
        :key="row.id"
        :data-track-id="row.id"
        class="tl-row group relative -mx-2 grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-x-2.5 rounded-sm px-2 py-3.5 transition-colors duration-150 @lg:grid-cols-[2.25rem_minmax(0,1fr)_auto] hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
      >
        <span class="text-[1.0625rem] font-light leading-6 tracking-tight tabular-nums text-faint @lg:text-xl">{{ row.number }}</span>
        <span class="flex h-6 min-w-0 items-baseline gap-2.5">
          <AlbumTracklistTitle :row="row" class="min-w-0 truncate text-15 font-semibold leading-6" />
          <span v-if="row.instrumental" class="shrink-0 text-11 font-medium tracking-[0.12em] text-meta">{{ t('content_display.instrumental') }}</span>
        </span>
        <!-- As in 清单: the more menu, the heart (none on albums awaiting review), the lyrics buttons (none for
             instrumentals) and the length, which keeps a width so a "—" doesn't move the buttons before it -->
        <span class="flex h-6 items-center gap-1">
          <AlbumTracklistMoreButton :row="row" />
          <span class="flex items-center gap-0.5">
            <AlbumTracklistFavorite :row="row" />
            <AlbumTracklistLyrics :row="row" small class="ml-0.5" />
            <span class="min-w-[2.25em] text-right text-13 leading-6 tabular-nums" :class="row.duration ? 'text-body' : 'text-faint'">{{ row.duration || '—' }}</span>
          </span>
        </span>

        <div v-if="hasLiner(row)" class="col-[2/-1]">
          <p v-if="row.subtitle" class="pt-1 text-xs text-meta">
            <span class="mr-1 text-faint">{{ t('album.tracklist.original_title') }}</span>{{ row.subtitle }}
          </p>
          <!-- One flow over two columns on a wide card: the credits, roles held by the same people on one line, then
               the notes; a line never breaks across the columns -->
          <div class="gap-x-7 pb-1 pt-1.5 @xl:columns-2">
            <div v-for="credit in mergeSamePeople(row.groups)" :key="credit.key" class="liner-line break-inside-avoid">
              <span class="flex flex-wrap gap-0.75">
                <CatalogRoleTag v-for="role in credit.roles" :key="role.key" :label="role.label" :tip="role.tip" :category="role.category" />
              </span>
              <span class="leader" aria-hidden="true" />
              <AlbumTracklistPeople :people="credit.people" stack end class="value mt-0.5" />
            </div>
            <div v-if="row.originals.length" class="liner-line break-inside-avoid">
              <AlbumTracklistLabel>{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel>
              <span class="leader" aria-hidden="true" />
              <AlbumTracklistOriginals :originals="row.originals" stack class="value text-title" />
            </div>
            <div v-for="attribute in row.attributes" :key="attribute.key" class="liner-line break-inside-avoid">
              <AlbumTracklistLabel>{{ attribute.label }}</AlbumTracklistLabel>
              <span class="leader" aria-hidden="true" />
              <span class="text-title">{{ attribute.value }}</span>
            </div>
            <div v-if="row.isrc" class="liner-line break-inside-avoid">
              <AlbumTracklistLabel>ISRC</AlbumTracklistLabel>
              <span class="leader" aria-hidden="true" />
              <span class="font-mono text-title">{{ row.isrc }}</span>
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
</style>
