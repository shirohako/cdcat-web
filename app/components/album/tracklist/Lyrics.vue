<script setup lang="ts">
import type { TracklistRow } from '~/utils/tracklistView'
import { FileText, Languages } from '@lucide/vue'

/**
 * Lyrics and translations as icon-and-count buttons that open the lyrics dialog, the second on a translation. With
 * `merged` (the table's narrow column) it is one button counting both. A sung track without lyrics keeps a faint
 * lyrics button without a number, the way in to add them; instrumentals have none.
 */
const props = defineProps<{ row: TracklistRow, merged?: boolean }>()

const { t } = useI18n()
const { openLyrics } = useTracklist()
const lyricsTip = computed(() => (props.row.lyrics ? t('album.tracklist.lyrics_count', { count: props.row.lyrics }) : t('album.tracklist.lyrics_none')))
/** Merged: lyrics and translations together, both named in the tooltip. */
const total = computed(() => props.row.lyrics + (props.merged ? props.row.translations : 0))
const mergedTip = computed(() => (props.row.translations ? `${lyricsTip.value} · ${t('album.tracklist.translation_with_count', { count: props.row.translations })}` : lyricsTip.value))
const translationsTip = computed(() => t('album.tracklist.translation_with_count', { count: props.row.translations }))

const CHIP = 'inline-flex h-[1.375rem] items-center gap-[3px] rounded-[5px] px-1.5 text-[11.5px] font-semibold leading-none tabular-nums transition-colors duration-150'
const FILLED = 'bg-black/[0.05] text-body hover:bg-black/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.13] [&_svg]:text-meta'
</script>

<template>
  <span v-if="!row.instrumental" class="inline-flex shrink-0 items-center gap-1">
    <UiTooltip :text="merged ? mergedTip : lyricsTip">
      <button
        type="button"
        :class="[CHIP, total ? FILLED : 'bg-black/[0.03] text-faint hover:bg-black/[0.07] hover:text-meta dark:bg-white/[0.05] dark:hover:bg-white/[0.1]']"
        :aria-label="merged ? mergedTip : lyricsTip"
        @click="openLyrics(row, 'original')"
      >
        <FileText :size="13" />
        <span v-if="total">{{ total }}</span>
      </button>
    </UiTooltip>
    <UiTooltip v-if="!merged && row.translations" :text="translationsTip">
      <button type="button" :class="[CHIP, FILLED]" :aria-label="translationsTip" @click="openLyrics(row, 'translation')">
        <Languages :size="13" />
        <span>{{ row.translations }}</span>
      </button>
    </UiTooltip>
  </span>
</template>
