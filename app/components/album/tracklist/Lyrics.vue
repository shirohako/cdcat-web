<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'
import { FileText, Languages } from '@lucide/vue'

/**
 * Lyrics and translations as icon-and-count buttons that open the lyrics dialog, the second on a translation. With
 * `merged` (the table's narrow column) it is one button counting both. A sung track without lyrics keeps a faint
 * lyrics button without a number, the way in to add them; instrumentals have none. `small` is 20px with a 12px icon,
 * for a line of 20px buttons: everywhere in 清单 (the first line beside the length, the 舒适 line, the 完整 block).
 */
const props = defineProps<{ row: TracklistRow, merged?: boolean, small?: boolean }>()

const { t } = useI18n()
const { openLyrics } = useTracklist()
const lyricsTip = computed(() => (props.row.lyrics ? t('album.tracklist.lyrics_count', { count: props.row.lyrics }) : t('album.tracklist.lyrics_none')))
/** Merged: lyrics and translations together, both named in the tooltip. */
const total = computed(() => props.row.lyrics + (props.merged ? props.row.translations : 0))
const mergedTip = computed(() => (props.row.translations ? `${lyricsTip.value} · ${t('album.tracklist.translation_with_count', { count: props.row.translations })}` : lyricsTip.value))
const translationsTip = computed(() => t('album.tracklist.translation_with_count', { count: props.row.translations }))

const CHIP = 'inline-flex items-center gap-0.75 rounded-[0.3125rem] font-semibold leading-none tabular-nums transition-colors duration-150'
const SIZE = computed(() => (props.small ? 'h-5 px-1.25 text-11' : 'h-[1.375rem] px-1.5 text-xs'))
const icon = computed(() => (props.small ? 12 : 13))
const FILLED = 'bg-black/[0.05] text-body hover:bg-black/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.13] [&_svg]:text-meta'
</script>

<template>
  <span v-if="!row.instrumental" class="inline-flex shrink-0 items-center gap-1">
    <UiTooltip :text="merged ? mergedTip : lyricsTip">
      <button
        type="button"
        :class="[CHIP, SIZE, total ? FILLED : 'bg-black/[0.03] text-faint hover:bg-black/[0.07] hover:text-meta dark:bg-white/[0.05] dark:hover:bg-white/[0.1]']"
        :aria-label="merged ? mergedTip : lyricsTip"
        @click="openLyrics(row, 'original')"
      >
        <FileText :size="icon" />
        <span v-if="total">{{ total }}</span>
      </button>
    </UiTooltip>
    <UiTooltip v-if="!merged && row.translations" :text="translationsTip">
      <button type="button" :class="[CHIP, SIZE, FILLED]" :aria-label="translationsTip" @click="openLyrics(row, 'translation')">
        <Languages :size="icon" />
        <span>{{ row.translations }}</span>
      </button>
    </UiTooltip>
  </span>
</template>
