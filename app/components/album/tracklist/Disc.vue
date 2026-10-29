<script setup lang="ts">
import type { TracklistDisc } from '~/utils/tracklistView'
import { ChevronDown } from '@lucide/vue'

/**
 * One disc of a tracklist style: its header and its rows (the default slot). The header sticks under the navbar while
 * the disc scrolls past and folds the disc when pressed, keeping itself where it is on screen; folded, it says how
 * many tracks are hidden. Albums with one plain CD show no header. Every style wraps its discs in this, so a new
 * style gets folding and sticky headers for free.
 */
const props = withDefaults(defineProps<{
  disc: TracklistDisc
  variant?: 'bar' | 'booklet'
}>(), { variant: 'bar' })

const { t } = useI18n()
const { folded, toggleDisc } = useTracklist()
const header = ref<HTMLElement | null>(null)
const bodyId = useId()

const isFolded = computed(() => folded.value.has(props.disc.id))
const count = computed(() => props.disc.rows.length)
const meta = computed(() => (isFolded.value
  ? t('album.tracklist.disc.folded', { count: count.value })
  : [t('album.tracklist.disc.tracks', { count: count.value }), props.disc.duration].filter(Boolean).join(' · ')))
</script>

<template>
  <section :id="`disc-${disc.id}`" class="scroll-mt-14">
    <div
      v-if="disc.showHeader"
      ref="header"
      class="sticky top-14 z-10 bg-card"
      :class="variant === 'bar' ? 'border-b border-line px-2 pt-2.5 [section+section_&]:mt-1.5' : 'pt-4 [section:first-child_&]:pt-1'"
    >
      <button
        type="button"
        class="group/disc flex h-9 w-full min-w-0 items-center text-left"
        :class="variant === 'bar' ? 'gap-2' : 'gap-2.5'"
        :aria-expanded="!isFolded"
        :aria-controls="bodyId"
        :aria-label="`Disc ${disc.position}${disc.title ? ` ${disc.title}` : ''}, ${t(isFolded ? 'album.tracklist.disc.unfold' : 'album.tracklist.disc.fold')}`"
        @click="toggleDisc(disc, header)"
      >
        <span
          class="shrink-0 text-[11px] uppercase text-title"
          :class="variant === 'bar' ? 'font-bold tracking-[0.08em]' : 'font-semibold tracking-[0.16em]'"
        >{{ variant === 'booklet' ? `Disc ${String(disc.position).padStart(2, '0')}` : `Disc ${disc.position}` }}</span>
        <span v-if="disc.title" class="min-w-0 truncate" :class="variant === 'bar' ? 'text-xs text-meta' : 'text-[12.5px] font-semibold text-body'">{{ disc.title }}</span>
        <AlbumTracklistLabel v-if="disc.format">{{ disc.format }}</AlbumTracklistLabel>
        <UiTooltip v-if="disc.bonus" :text="disc.bonus.name" placement="bottom">
          <span class="inline-flex h-[1.125rem] shrink-0 items-center rounded-[4px] bg-pink-100 px-[5px] text-[10.5px] font-semibold leading-none text-pink-600 dark:bg-pink-400/20 dark:text-pink-200">{{ t('content_display.bonus') }}</span>
        </UiTooltip>
        <span v-if="variant === 'booklet'" class="h-px min-w-4 flex-1 bg-line" aria-hidden="true" />
        <span class="shrink-0 text-[11px] tabular-nums text-meta" :class="variant === 'bar' && 'ml-auto'">{{ meta }}</span>
        <ChevronDown :size="14" class="shrink-0 text-faint transition-[rotate,color] duration-200 group-hover/disc:text-title" :class="isFolded && '-rotate-90'" />
      </button>
    </div>
    <UiCollapse :id="bodyId" :open="!isFolded">
      <slot />
    </UiCollapse>
  </section>
</template>
