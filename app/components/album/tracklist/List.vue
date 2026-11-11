<script setup lang="ts">
import type { TracklistDensity, TracklistDisc, TracklistRow } from '~/utils/tracklistView'
import { ChevronDown } from '@lucide/vue'

/**
 * Style A, 清单: one row per track. 简洁 is ruled rows (until 2026-11-11 this was 表格 · 简洁; the old 清单 · 简洁
 * went): number and title, then on the right the people button (opens the credits), the more menu, the heart and the
 * length, in fixed columns so they line up down the list. 舒适 and 完整 are like a music app: the first line (number,
 * title, then at the right the more menu, the heart, the lyrics buttons and the length, the same on every track) is
 * the same in both, so switching only opens and folds what is under it: the 舒适 line (who sings, who arranged,
 * 原曲) and the 完整 block (every credit as a role tag, notes, counts), which mounts the first time it opens. 简洁 and
 * the others differ in structure, so that switch crossfades. The 舒适 line and the 完整 block share one place under
 * the title: the block opens over the line while the line fades, so a row grows once rather than one part closing
 * while the other opens. A track with neither is one line. In 舒适 a light arrow at the right end of that line, under
 * the length, opens that one track as in 完整, turning round; changing the density folds them all. (User picks,
 * 2026-11-11: the lyrics buttons and a 展开更多 chip used to sit at the right of the second line, the lyrics jumping
 * between the two lines; an arrow on the first line, shown only on tracks with credits, dotted the column.)
 */
const props = defineProps<{ discs: TracklistDisc[], density: TracklistDensity }>()

const { t } = useI18n()

const { separator } = useListPunctuation()
const hasNotes = (row: TracklistRow) => Boolean(row.originals.length || row.attributes.length || row.isrc)
// What the 舒适 line and the 完整 block hold (a track has both or neither). With nothing, the track is one line.
const hasFull = (row: TracklistRow) => Boolean(row.groups.length || row.subtitle || hasNotes(row))

// Tracks opened as in 完整 from 舒适
const expanded = ref(new Set<number>())
const toggleMore = (row: TracklistRow) => {
  const next = new Set(expanded.value)
  if (next.has(row.id)) next.delete(row.id)
  else next.add(row.id)
  expanded.value = next
}
watch(() => props.density, () => {
  expanded.value = new Set()
})
const showsFull = (row: TracklistRow, density: TracklistDensity) => density === 'full' || (density === 'comfy' && expanded.value.has(row.id))

/** 展开更多 / 收起: a light 20px arrow with no outline (like the more button), centred on the 舒适 line */
const ARROW = 'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[0.3125rem] text-meta transition-colors duration-150 hover:bg-black/[0.06] hover:text-title dark:hover:bg-white/[0.1]'
</script>

<template>
  <Transition mode="out-in" enter-active-class="transition-opacity duration-[180ms]" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-100" leave-to-class="opacity-0">
    <div v-if="density === 'compact'" key="ruled" class="px-3 pb-1.5">
      <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc">
        <!-- A hairline between rows; the hovered row gets a rounded fill and the lines next to it step aside -->
        <div
          v-for="row in disc.rows"
          :id="`track-${row.id}`"
          :key="row.id"
          :data-track-id="row.id"
          class="tl-ruled group relative grid scroll-mt-24 grid-cols-[1.125rem_minmax(0,1fr)_auto] items-start gap-x-2 rounded-md px-2 py-1.5 text-13 leading-5 transition-colors duration-150 max-sm:grid-cols-[0.875rem_minmax(0,1fr)_auto] max-sm:gap-x-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
        >
          <!-- A column just wide enough for two digits; on phones the number and length are 11px (the smallest for
               words) and the columns closer, so more of the title fits. Titles are 13px in every style, phones and
               desktop alike (user picks, 2026-11-11: one size, a step above the 12px credits under them; it was 11px
               here on phones, 14px in 舒适/完整 and 15px in 内页). -->
          <span class="text-xs/5 tabular-nums text-meta max-sm:text-11/5">{{ row.number }}</span>
          <!-- In a box of its own, so the link is only as wide as the title's text, not its whole column: only the title
               opens the track page (user ask, 2026-11-11) -->
          <span class="min-w-0"><AlbumTracklistTitle :row="row" class="font-medium" /></span>
          <!-- People, "…", heart and length close together at the right (albums awaiting review have no heart). The
               length keeps a width, so a "—" doesn't move the buttons before it out of line. -->
          <span class="flex items-center gap-1">
            <AlbumTracklistPeopleButton :row="row" />
            <AlbumTracklistMoreButton :row="row" />
            <span class="flex items-center gap-0.5">
              <AlbumTracklistFavorite :row="row" />
              <span class="min-w-[2.25em] text-right text-xs/5 tabular-nums max-sm:text-11/5" :class="row.duration ? 'text-meta' : 'text-faint'">{{ row.duration || '—' }}</span>
            </span>
          </span>
        </div>
      </AlbumTracklistDisc>
    </div>

    <div v-else key="rows" class="tl-list px-3 pb-1.5" :class="`is-${density}`">
      <AlbumTracklistDisc v-for="disc in discs" :key="disc.id" :disc="disc">
        <div
          v-for="row in disc.rows"
          :id="`track-${row.id}`"
          :key="row.id"
          :data-track-id="row.id"
          class="tl-row group relative grid scroll-mt-24 grid-cols-[1.125rem_minmax(0,1fr)_auto] items-start gap-x-2 rounded-md px-2 transition-[color,background-color,padding] duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
          :class="density === 'comfy' ? 'py-2.5' : 'py-2'"
        >
          <!-- 舒适 rows stand further apart than 完整's (user ask, 2026-11-11), whose open blocks already set them apart -->
          <!-- A column just wide enough for two digits, centred on the 24px first line -->
          <span class="flex h-6 items-center text-xs tabular-nums text-meta">{{ row.number }}</span>
          <!-- One line cut with … ; on phones, where the buttons leave the title little room, long titles wrap instead
               (user ask, 2026-11-11), the buttons staying on their first line and 纯音乐 centred on it -->
          <span class="flex h-6 min-w-0 items-center gap-1.5 max-sm:h-auto max-sm:items-start">
            <AlbumTracklistTitle :row="row" class="min-w-0 truncate text-13 font-medium leading-6 max-sm:whitespace-normal max-sm:wrap-break-word" />
            <AlbumTracklistLabel v-if="row.instrumental" size="flag" class="max-sm:mt-1">{{ t('content_display.instrumental') }}</AlbumTracklistLabel>
          </span>
          <!-- At the right, close together and all 20px as in 简洁: the more menu, the heart (none on albums
               awaiting review), the lyrics buttons (greyed out and not pressable on instrumentals, as in the tables;
               user ask, 2026-11-11), and last the length, at the edge as in every style. The length keeps a width, so a "—" doesn't move the buttons before it out of line. The same
               on every track, so the column reads evenly down the list. -->
          <span class="flex h-6 items-center gap-1">
            <AlbumTracklistMoreButton :row="row" />
            <span class="flex items-center gap-0.5">
              <AlbumTracklistFavorite :row="row" />
              <AlbumTracklistLyrics :row="row" small always class="ml-0.5" />
              <span class="min-w-[2.25em] text-right text-xs leading-6 tabular-nums" :class="row.duration ? 'text-meta' : 'text-faint'">{{ row.duration || '—' }}</span>
            </span>
          </span>

          <div v-if="hasFull(row)" class="col-[2/-1] flex items-start gap-3 max-sm:gap-2">
            <!-- The 舒适 line and the 完整 block in one cell: the block opens over the line as the line fades -->
            <div class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)]">
              <!-- 舒适: roles as tags (原曲 as a grey one), the names after them as grey tags, on one line that fades out at the
                   right when it runs long (an ellipsis would sit loose after the last whole tag) -->
              <p
                class="col-start-1 row-start-1 mt-px min-w-0 overflow-hidden whitespace-nowrap py-px text-xs leading-5 text-body transition-opacity [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]"
                :class="showsFull(row, density) ? 'pointer-events-none opacity-0 duration-100' : 'opacity-100 delay-150 duration-200'"
                :inert="showsFull(row, density)"
                :aria-hidden="showsFull(row, density)"
              >
                <!-- 艺术家, 作曲, 编曲, 演唱: roles held by the same people side by side before their names, two names
                     at most and the rest as +N, its names in a tooltip -->
                <template v-for="(credit, index) in row.key" :key="credit.key">
                  <CatalogRoleTag
                    v-for="(role, at) in credit.roles"
                    :key="role.key"
                    :label="role.label"
                    :tip="role.tip"
                    :category="role.category"
                    class="align-middle"
                    :class="[at === credit.roles.length - 1 ? 'mr-1' : 'mr-0.5', index > 0 && at === 0 && 'ml-3']"
                  />
                  <AlbumTracklistPeople :people="credit.people" inline />
                  <UiTooltip v-if="credit.more.length" :text="credit.more.map(person => person.name).join(separator)">
                    <AlbumTracklistLabel size="md" class="ml-1 align-middle tabular-nums">+{{ credit.more.length }}</AlbumTracklistLabel>
                  </UiTooltip>
                </template>
                <template v-if="row.originals.length">
                  <AlbumTracklistLabel size="md" class="mr-1 align-middle" :class="row.key.length > 0 && 'ml-3'">{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel>
                  <AlbumTracklistOriginals :originals="row.originals" />
                </template>
              </p>
              <UiCollapse class="col-start-1 row-start-1" :open="showsFull(row, density)" lazy>
                <div class="pb-1.5 pt-1">
                  <p v-if="row.subtitle" class="mb-1.5 flex min-w-0 items-center gap-2 text-xs leading-[1.125rem] text-title">
                    <AlbumTracklistLabel size="md">{{ t('album.tracklist.original_title') }}</AlbumTracklistLabel><span class="min-w-0 truncate">{{ row.subtitle }}</span>
                  </p>
                  <!-- One role per line, its people after its tag -->
                  <div v-if="row.groups.length" class="grid gap-y-1.5">
                    <div v-for="group in row.groups" :key="group.key" class="flex min-w-0 items-start gap-2 text-13 leading-[1.125rem] text-title">
                      <CatalogRoleTag :label="group.label" :tip="group.tip" :category="group.category" />
                      <AlbumTracklistPeople :people="group.people" class="min-w-0" />
                    </div>
                  </div>
                  <!-- The notes, each behind a grey label tag like the roles above: 原曲, attributes (BPM …), ISRC -->
                  <!-- 12px like the names above (user ask, 2026-11-11); a note that wraps keeps its label on its first line -->
                  <div v-if="hasNotes(row)" class="flex flex-wrap items-start gap-x-4 gap-y-1.5 text-xs leading-5 text-title" :class="row.groups.length > 0 && 'mt-2'">
                    <span v-if="row.originals.length" class="inline-flex min-w-0 items-start gap-2"><AlbumTracklistLabel size="md" class="mt-px">{{ t('album.tracklist.original_song') }}</AlbumTracklistLabel><AlbumTracklistOriginals :originals="row.originals" /></span>
                    <span v-for="attribute in row.attributes" :key="attribute.key" class="inline-flex min-w-0 items-start gap-2"><AlbumTracklistLabel size="md" class="mt-px">{{ attribute.label }}</AlbumTracklistLabel>{{ attribute.value }}</span>
                    <span v-if="row.isrc" class="inline-flex items-start gap-2"><AlbumTracklistLabel size="md" class="mt-px">ISRC</AlbumTracklistLabel><span class="font-mono">{{ row.isrc }}</span></span>
                  </div>
                </div>
              </UiCollapse>
            </div>
            <!-- 舒适: 展开更多 / 收起 at the right end of this line, under the length, turning as the track opens; it stays
                 put at the top while the block opens. Only a track with this line has one, so the arrows go with the
                 credits rather than dotting the first line's column (user pick, 2026-11-11). -->
            <UiTooltip v-if="density === 'comfy'" :text="t(expanded.has(row.id) ? 'album.tracklist.show_less' : 'album.tracklist.show_more')">
              <button
                type="button"
                :class="ARROW"
                :aria-expanded="expanded.has(row.id)"
                :aria-label="t(expanded.has(row.id) ? 'album.tracklist.show_less' : 'album.tracklist.show_more')"
                @click="toggleMore(row)"
              >
                <ChevronDown :size="14" class="transition-[rotate] duration-300 ease-out" :class="expanded.has(row.id) && 'rotate-180'" />
              </button>
            </UiTooltip>
          </div>
        </div>
      </AlbumTracklistDisc>
    </div>
  </Transition>
</template>

<style scoped>
/* 简洁: hairlines between tracks; none next to the row under the pointer, so its rounded fill stands free. */
.tl-ruled + .tl-ruled::before {
  position: absolute;
  top: 0;
  inset-inline: 0.5rem;
  height: 1px;
  background: var(--line);
  content: "";
  transition: opacity 150ms ease-out;
}

.tl-ruled:hover::before,
.tl-ruled:hover + .tl-ruled::before {
  opacity: 0;
}
/* 舒适 and 完整 have no hairlines between tracks (完整's went on 2026-11-11): space sets them apart. */
</style>
