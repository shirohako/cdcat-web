<script setup lang="ts">
import type { TracklistDensity, TracklistDisc } from '~/utils/tracklistView'

/**
 * Style C, 表格: like the editions table, one table per disc. 舒适 has one 参与人员 column with everyone credited,
 * roles left out, the 艺术家, 作曲, 编曲 and 演唱 first and TABLE_NAMES at most, the rest as +N (its names in a
 * tooltip); who did what is 完整's job, one AlbumTracklistTableFull per disc (pinned title and controls, a column
 * per credit group on two tracks or more, redone on 2026-11-11). On a narrow card each row turns into a block, in CSS
 * alone: number, title, lyrics, more, heart and length on the first line, the people under the title. The columns
 * change with the density, so that switch crossfades. Its 简洁 moved to 清单 on 2026-11-11.
 */
const props = defineProps<{ discs: TracklistDisc[], density: TracklistDensity }>()

const { t } = useI18n()

/** How many names 舒适's 参与人员 shows before the rest go behind a +N. */
const TABLE_NAMES = 4
const { separator } = useListPunctuation()

type Column = { kind: 'number' | 'title' | 'people' | 'lyrics' | 'more' | 'heart' | 'duration' }

const columnsOf = (disc: TracklistDisc): Column[] => {
  const columns: Column[] = [{ kind: 'number' }, { kind: 'title' }]
  if (disc.rows.some(row => row.everyone.length)) columns.push({ kind: 'people' })
  // On every disc, instrumentals and all (their button is greyed out), so all the tables have the same columns
  columns.push({ kind: 'lyrics' }, { kind: 'more' }, { kind: 'heart' }, { kind: 'duration' })
  return columns
}
const columns = computed(() => new Map(props.discs.map(disc => [disc.id, columnsOf(disc)])))

const CELL_CLASSES: Record<Column['kind'], string> = {
  number: 'c-number w-px whitespace-nowrap text-xs/5 tabular-nums text-meta',
  title: 'c-title',
  lyrics: 'c-lyrics w-px whitespace-nowrap',
  more: 'c-more w-px',
  heart: 'c-heart w-px',
  duration: 'c-duration w-px whitespace-nowrap text-right text-xs/5 tabular-nums',
  people: 'c-people text-13 text-title',
}
</script>

<template>
  <Transition mode="out-in" enter-active-class="transition-opacity duration-[180ms]" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
    <div :key="density" class="px-5 pb-1.5">
      <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc">
        <AlbumTracklistTableFull v-if="density === 'full'" :disc="disc" />
        <div v-else class="scrollbar-always overflow-x-auto">
          <table class="tl-table w-full border-collapse text-13 leading-5">
            <thead>
              <tr>
                <th v-for="column in columns.get(disc.id)" :key="column.kind" :class="CELL_CLASSES[column.kind]">
                  <template v-if="column.kind === 'number'">#</template>
                  <template v-else-if="column.kind === 'title'">{{ t('album.tracklist.columns.title') }}</template>
                  <template v-else-if="column.kind === 'lyrics'">{{ t('album.tracklist.columns.lyrics') }}</template>
                  <template v-else-if="column.kind === 'people'">{{ t('album.tracklist.columns.people') }}</template>
                  <template v-else-if="column.kind === 'duration'">{{ t('album.tracklist.columns.duration') }}</template>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in disc.rows"
                :id="`track-${row.id}`"
                :key="row.id"
                :data-track-id="row.id"
                class="group scroll-mt-24 transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
              >
                <td v-for="column in columns.get(disc.id)" :key="column.kind" :class="CELL_CLASSES[column.kind]">
                  <template v-if="column.kind === 'number'">{{ row.number }}</template>
                  <template v-else-if="column.kind === 'title'">
                    <AlbumTracklistTitle :row="row" class="font-medium" />
                    <AlbumTracklistLabel v-if="row.instrumental" class="ml-1.5 align-[1px]">{{ t('content_display.instrumental') }}</AlbumTracklistLabel>
                    <span v-if="row.originals.length" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-meta">
                      <span class="inline-flex items-center gap-1.5"><AlbumTracklistLabel size="md">{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel><AlbumTracklistOriginals :originals="row.originals" /></span>
                    </span>
                  </template>
                  <!-- 舒适: everyone, no roles; four names at most, the rest behind +N, which flows on after the last
                       name (the names' own box steps aside with display: contents) -->
                  <span v-else-if="column.kind === 'people'" class="flex flex-wrap items-center gap-1 pt-px">
                    <AlbumTracklistPeople :people="row.everyone.slice(0, TABLE_NAMES)" class="contents!" />
                    <UiTooltip v-if="row.everyone.length > TABLE_NAMES" :text="row.everyone.slice(TABLE_NAMES).map(person => person.name).join(separator)">
                      <AlbumTracklistLabel size="md" class="tabular-nums">+{{ row.everyone.length - TABLE_NAMES }}</AlbumTracklistLabel>
                    </UiTooltip>
                  </span>
                  <AlbumTracklistLyrics v-else-if="column.kind === 'lyrics'" :row="row" merged always />
                  <!-- Always shown here, as columns: the more menu and the heart -->
                  <AlbumTracklistMoreButton v-else-if="column.kind === 'more'" :row="row" always />
                  <AlbumTracklistFavorite v-else-if="column.kind === 'heart'" :row="row" always />
                  <span v-else-if="column.kind === 'duration'" :class="row.duration ? 'text-meta' : 'text-faint'">{{ row.duration || '—' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AlbumTracklistDisc>
    </div>
  </Transition>
</template>

<style scoped>
.tl-table th {
  padding: 0.4375rem 0.5rem;
  border-bottom: 1px solid var(--line);
  color: var(--meta);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.125rem;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.tl-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}

.tl-table tr:last-child td {
  border-bottom: 0;
}

.tl-table td.c-heart :deep(button),
.tl-table td.c-more :deep(button) {
  vertical-align: top;
}

.tl-table th.c-duration {
  text-align: right;
}

/* A narrow card: each row becomes a block, the number, title, more menu, heart and length on its first line and every other
   cell on a line of its own under the title, its role as a tag. */
/* The more menu and the heart sit close (in the CSS rather than as !px utilities, so the narrow card can change it) */
.tl-table .c-more,
.tl-table .c-heart {
  padding-left: 0.125rem;
  padding-right: 0.125rem;
}

@container (max-width: 40rem) {
  .tl-table thead {
    display: none;
  }

  .tl-table tbody {
    display: block;
  }

  .tl-table tr {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr) auto auto auto auto;
    column-gap: 0.25rem;
    padding-block: 0.5rem;
    border-bottom: 1px solid var(--line);
  }

  .tl-table tr:last-child {
    border-bottom: 0;
  }

  /* No widths: the table's 1px cells would let the buttons spill over each other and past the card */
  .tl-table td {
    display: block;
    width: auto;
    padding: 0;
    border: 0;
  }

  .tl-table td.c-number {
    grid-column: 1;
    grid-row: 1;
    line-height: 1.5rem;
  }

  .tl-table td.c-title {
    grid-column: 2;
    grid-row: 1;
    line-height: 1.5rem;
  }

  /* The first line ends with the lyrics, the more menu, the heart and the length, as the table's columns do; the
     22px lyrics button and the 20px ones centred on the 24px line */
  .tl-table td.c-lyrics {
    grid-column: 3;
    grid-row: 1;
    margin-left: 0.25rem;
    padding-top: 0.0625rem;
  }

  .tl-table td.c-more {
    grid-column: 4;
    grid-row: 1;
    padding: 0.125rem 0 0;
  }

  .tl-table td.c-heart {
    grid-column: 5;
    grid-row: 1;
    padding: 0.125rem 0 0;
  }

  .tl-table td.c-duration {
    grid-column: 6;
    grid-row: 1;
    min-width: 2.25em;
    margin-left: -0.125rem;
    line-height: 1.5rem;
  }

  .tl-table td.c-people {
    grid-column: 2 / -1;
    margin-top: 0.25rem;
  }

  .tl-table td:empty {
    display: none;
  }
}
</style>
