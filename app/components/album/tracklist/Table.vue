<script setup lang="ts">
import type { TracklistDensity, TracklistDisc, TracklistRoleGroup, TracklistRow } from '~/utils/tracklistView'

/**
 * Style C, 表格: like the editions table, one table per disc with role tags as column heads. 舒适 has a column for
 * who performs and one for who arranged (a cell whose role differs from its head, say a composer under 编曲, shows
 * its own small tag). 完整 has fixed columns, one for each core category on that disc (作曲, 作词, 编曲, 演唱, in the
 * dictionary's order), and one 其他人员 column for every other role, as role tags with names, so a disc with dozens of
 * roles stays a few columns wide. On a narrow card each row turns into a block, in CSS alone, with a role tag in each
 * cell. The columns change with the density, so that switch crossfades.
 */
const props = defineProps<{ discs: TracklistDisc[], density: TracklistDensity }>()

const { t } = useI18n()

/** The role categories that get a column of their own in 完整; every other role goes to 其他人员. */
const CORE_CATEGORIES = ['composition', 'lyrics', 'arrangement', 'vocals']

type Head = { label: string, category: string, role: string }
type Column =
  | { kind: 'number' | 'title' | 'others' | 'lyrics' | 'heart' | 'favorites' | 'duration' }
  | { kind: 'key', which: 'lead' | 'maker', head: Head }
  | { kind: 'category', head: Head }

const keyHead = (disc: TracklistDisc, which: 'lead' | 'maker') => {
  const group = disc.rows.find(row => row[which])?.[which]
  return group ? { label: group.label, category: group.category, role: group.role } : null
}

const columnsOf = (disc: TracklistDisc): Column[] => {
  const columns: Column[] = [{ kind: 'number' }, { kind: 'title' }]
  const sung = disc.rows.some(row => !row.instrumental)
  if (props.density === 'comfy') {
    for (const which of ['lead', 'maker'] as const) {
      const head = keyHead(disc, which)
      if (head) columns.push({ kind: 'key', which, head })
    }
  }
  if (props.density === 'full') {
    // Headed by the category's first role on the disc; the roles come in the dictionary's order.
    const seen = new Set<string>()
    for (const role of disc.roles) {
      if (!CORE_CATEGORIES.includes(role.category) || seen.has(role.category)) continue
      seen.add(role.category)
      columns.push({ kind: 'category', head: role })
    }
    if (disc.roles.some(role => !CORE_CATEGORIES.includes(role.category))) columns.push({ kind: 'others' })
  }
  if (props.density !== 'compact' && sung) columns.push({ kind: 'lyrics' })
  columns.push({ kind: props.density === 'full' ? 'favorites' : 'heart' }, { kind: 'duration' })
  return columns
}
const columns = computed(() => new Map(props.discs.map(disc => [disc.id, columnsOf(disc)])))

const groupsOf = (row: TracklistRow, column: Column): TracklistRoleGroup[] => {
  if (column.kind === 'key') return row[column.which] ? [row[column.which]!] : []
  if (column.kind === 'category') return row.groups.filter(group => group.category === column.head.category)
  if (column.kind === 'others') return row.groups.filter(group => !CORE_CATEGORIES.includes(group.category))
  return []
}
const columnKey = (column: Column) => ('head' in column ? `${column.kind}-${column.head.category}-${column.head.role}` : column.kind)
const CELL_CLASSES: Record<string, string> = {
  number: 'c-number w-px whitespace-nowrap text-xs/5 tabular-nums text-meta',
  title: 'c-title',
  lyrics: 'c-lyrics w-px whitespace-nowrap',
  heart: 'c-heart w-px !px-0.5',
  favorites: 'c-heart w-px whitespace-nowrap',
  duration: 'c-duration w-px whitespace-nowrap text-right text-xs/5 tabular-nums',
  key: 'c-people text-[12.5px] text-title',
  category: 'c-people text-[12.5px] text-title',
  others: 'c-people c-others text-[12.5px] text-title',
}
</script>

<template>
  <Transition mode="out-in" enter-active-class="transition-opacity duration-[180ms]" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
    <div :key="density" class="px-5 pb-1.5">
      <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc">
        <div class="table-scroll overflow-x-auto">
          <table class="tl-table w-full border-collapse text-[13px] leading-5" :class="`is-${density}`">
            <thead v-if="density !== 'compact'">
              <tr>
                <th v-for="column in columns.get(disc.id)" :key="columnKey(column)" :class="CELL_CLASSES[column.kind]">
                  <CatalogRoleTag v-if="'head' in column" :label="column.head.label" :category="column.head.category" />
                  <template v-else-if="column.kind === 'number'">#</template>
                  <template v-else-if="column.kind === 'title'">{{ t('album.tracklist.columns.title') }}</template>
                  <template v-else-if="column.kind === 'lyrics'">{{ t('album.tracklist.columns.lyrics') }}</template>
                  <template v-else-if="column.kind === 'favorites'">{{ t('album.tracklist.columns.favorites') }}</template>
                  <template v-else-if="column.kind === 'others'">{{ t('album.tracklist.columns.others') }}</template>
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
                <td v-for="column in columns.get(disc.id)" :key="columnKey(column)" :class="CELL_CLASSES[column.kind]">
                  <template v-if="column.kind === 'number'">{{ row.number }}</template>
                  <template v-else-if="column.kind === 'title'">
                    <AlbumTracklistTitle :row="row" class="font-medium" />
                    <AlbumTracklistLabel v-if="row.instrumental && density !== 'compact'" class="ml-1.5 align-[1px]">{{ t('content_display.instrumental') }}</AlbumTracklistLabel>
                    <span v-if="density !== 'compact' && (row.originals.length || (density === 'full' && (row.attributes.length || row.isrc || row.subtitle)))" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-meta">
                      <span v-if="density === 'full' && row.subtitle" class="inline-flex items-center gap-1.5"><AlbumTracklistLabel>{{ t('album.tracklist.original_title') }}</AlbumTracklistLabel>{{ row.subtitle }}</span>
                      <span v-if="row.originals.length" class="inline-flex items-center gap-1.5"><AlbumTracklistLabel>{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel><AlbumTracklistOriginals :originals="row.originals" /></span>
                      <template v-if="density === 'full'">
                        <span v-for="attribute in row.attributes" :key="attribute.key" class="inline-flex items-center gap-1.5"><AlbumTracklistLabel>{{ attribute.label }}</AlbumTracklistLabel>{{ attribute.value }}</span>
                        <span v-if="row.isrc" class="inline-flex items-center gap-1.5"><AlbumTracklistLabel>ISRC</AlbumTracklistLabel><span class="font-mono">{{ row.isrc }}</span></span>
                      </template>
                    </span>
                  </template>
                  <template v-else-if="column.kind === 'key' || column.kind === 'category'">
                    <span v-for="group in groupsOf(row, column)" :key="group.role" class="flex items-start gap-1.5 [&+&]:mt-1">
                      <!-- Its own tag when the role differs from the column's, and always once rows turn into blocks -->
                      <CatalogRoleTag :label="group.label" :category="group.category" size="xs" class="mt-0.5" :class="group.role === column.head.role && 'cell-tag'" />
                      <AlbumTracklistPeople :people="group.people" stack />
                    </span>
                  </template>
                  <template v-else-if="column.kind === 'others'">
                    <span v-for="group in groupsOf(row, column)" :key="group.role" class="flex items-start gap-1.5 [&+&]:mt-1">
                      <CatalogRoleTag :label="group.label" :category="group.category" size="xs" class="mt-0.5" />
                      <AlbumTracklistPeople :people="group.people" />
                    </span>
                  </template>
                  <AlbumTracklistLyrics v-else-if="column.kind === 'lyrics'" :row="row" merged />
                  <AlbumTracklistFavorite v-else-if="column.kind === 'heart'" :row="row" />
                  <AlbumTracklistFavorite v-else-if="column.kind === 'favorites'" :row="row" count />
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
/* A table wider than the card scrolls sideways; its scrollbar always shows (other boxes only show theirs while they
   scroll, see main.css), so it is plain that there is more to the right. Same colours as the site's scrollbars. */
.table-scroll::-webkit-scrollbar-thumb {
  background-color: color-mix(in oklab, var(--primary) 35%, transparent);
}

.table-scroll::-webkit-scrollbar-thumb:hover {
  background-color: color-mix(in oklab, var(--primary) 50%, transparent);
}

.table-scroll::-webkit-scrollbar-thumb:active {
  background-color: color-mix(in oklab, var(--primary) 65%, transparent);
}

@supports not selector(::-webkit-scrollbar) {
  .table-scroll {
    scrollbar-color: color-mix(in oklab, var(--primary) 35%, transparent) transparent;
  }
}

.tl-table th {
  padding: 0.4375rem 0.5rem;
  border-bottom: 1px solid var(--line);
  color: var(--meta);
  font-size: 11px;
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

.tl-table.is-compact td {
  padding-block: 0.375rem;
}

.tl-table tr:last-child td {
  border-bottom: 0;
}

.tl-table td.c-heart :deep(button) {
  vertical-align: top;
}

.tl-table th.c-duration {
  text-align: right;
}

/* The tag of a cell whose role matches its column only shows once rows become blocks. */
.cell-tag {
  display: none;
}

/* A narrow card: each row becomes a block, the number, title, heart and length on its first line and every other
   cell on a line of its own under the title, its role as a tag. */
@container (max-width: 40rem) {
  .tl-table thead {
    display: none;
  }

  .tl-table tbody {
    display: block;
  }

  .tl-table tr {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr) auto auto;
    column-gap: 0.5rem;
    padding-block: 0.5rem;
    border-bottom: 1px solid var(--line);
  }

  .tl-table tr:last-child {
    border-bottom: 0;
  }

  .tl-table td {
    display: block;
    padding: 0;
    border: 0;
  }

  .tl-table.is-compact td {
    padding: 0;
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

  /* The 20px heart centred on the 24px first line */
  .tl-table td.c-heart {
    grid-column: 3;
    grid-row: 1;
    padding: 0.125rem 0 0;
  }

  .tl-table td.c-duration {
    grid-column: 4;
    grid-row: 1;
    line-height: 1.5rem;
  }

  .tl-table td.c-people,
  .tl-table td.c-lyrics {
    grid-column: 2 / -1;
    margin-top: 0.25rem;
  }

  .tl-table td:empty {
    display: none;
  }

  .cell-tag {
    display: inline-flex;
  }
}
</style>
