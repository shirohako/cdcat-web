<script setup lang="ts">
import type { TracklistDisc } from '~/utils/tracklistView'
import { ChevronDown } from '@lucide/vue'

/**
 * One disc of a tracklist style: its header and its rows (the default slot). The header sticks under the navbar while
 * the disc scrolls past and folds the disc when pressed, keeping itself where it is on screen; folded, it says how
 * many tracks are hidden. There is no floating 收起 button (the user had it removed on 2026-11-11); the header is the
 * way to fold. Albums with one plain CD show no header, so they don't fold. Every style wraps its discs in this, so a
 * new style gets folding and sticky headers for free. The header sticks at `--tl-top` (the navbar's 3.5rem, 0 in a
 * dialog), and the bar's height is `--tl-disc-head`, for what sticks under it (表格 · 完整's column header).
 */
const props = withDefaults(defineProps<{
  disc: TracklistDisc
  variant?: 'bar' | 'booklet'
  /** The `disc-{id}` anchor; off for a second copy, such as the full-screen dialog's */
  anchor?: boolean
}>(), { variant: 'bar', anchor: true })

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
  <!-- The last disc folded leaves its line to the tracklist's footer, whose line follows it right away -->
  <!-- The bar: 0.625rem above a 2.25rem button and a 1px line -->
  <section :id="anchor ? `disc-${disc.id}` : undefined" class="scroll-mt-14" :style="disc.showHeader && variant === 'bar' ? { '--tl-disc-head': 'calc(2.875rem + 1px)' } : undefined">
    <div
      v-if="disc.showHeader"
      ref="header"
      class="sticky top-[var(--tl-top,3.5rem)] z-10 bg-card"
      :class="variant === 'bar' ? ['border-b border-line px-2 pt-2.5 [section+section_&]:mt-1.5', isFolded && '[section:last-child>&]:border-b-transparent'] : 'pt-4 [section:first-child_&]:pt-1'"
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
          class="shrink-0 text-11 uppercase text-title"
          :class="variant === 'bar' ? 'font-bold tracking-[0.08em]' : 'font-semibold tracking-[0.16em]'"
        >{{ variant === 'booklet' ? `Disc ${String(disc.position).padStart(2, '0')}` : `Disc ${disc.position}` }}</span>
        <span v-if="disc.title" class="min-w-0 truncate" :class="variant === 'bar' ? 'text-xs text-meta' : 'text-13 font-semibold text-body'">{{ disc.title }}</span>
        <AlbumTracklistLabel v-if="disc.format">{{ disc.format }}</AlbumTracklistLabel>
        <UiTooltip v-if="disc.bonus" :text="disc.bonus.name" placement="bottom">
          <span class="inline-flex h-[1.125rem] shrink-0 items-center rounded-sm bg-pink-100 px-1.25 text-11 font-semibold leading-none text-pink-600 dark:bg-pink-400/20 dark:text-pink-200">{{ t('content_display.bonus') }}</span>
        </UiTooltip>
        <span v-if="variant === 'booklet'" class="h-px min-w-4 flex-1 bg-line" aria-hidden="true" />
        <span class="shrink-0 text-11 tabular-nums text-meta" :class="variant === 'bar' && 'ml-auto'">{{ meta }}</span>
        <ChevronDown :size="14" class="shrink-0 text-faint transition-[rotate,color] duration-200 group-hover/disc:text-title" :class="isFolded && '-rotate-90'" />
      </button>
    </div>
    <UiCollapse :id="bodyId" :open="!isFolded">
      <!-- Air under the bar's line, so the first row's hover fill doesn't touch it -->
      <div v-if="disc.showHeader && variant === 'bar'" class="h-1" aria-hidden="true" />
      <slot />
    </UiCollapse>
  </section>
</template>
