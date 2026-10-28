<script setup lang="ts">
import type { Component } from 'vue'
import {
  GuideFigureAlbumAnatomy,
  GuideFigureArticleCard,
  GuideFigureArtistKinds,
  GuideFigureBasicForm,
  GuideFigureBonuses,
  GuideFigureConflict,
  GuideFigureCredits,
  GuideFigureCreditsByTrack,
  GuideFigureCreditsPaste,
  GuideFigureEditions,
  GuideFigureEditorShell,
  GuideFigureEntryLinks,
  GuideFigureEventEditions,
  GuideFigureForumThread,
  GuideFigureImages,
  GuideFigureNamesDialog,
  GuideFigureNamesHistory,
  GuideFigureRelationMap,
  GuideFigureRelations,
  GuideFigureReviewStates,
  GuideFigureSeriesTree,
  GuideFigureSubmitFlow,
  GuideFigureSubmitPanel,
  GuideFigureTracklist,
  GuideFigureTranslate,
  GuideFigureVinylSides,
} from '#components'
import { sectionNumber, sectionShift } from '~/documents/sections'
import type { GuideSection } from '~/guides'
import type { GuideFigure, GuideFigureName } from '~/guides/types'

/**
 * One numbered section of a guide, on its own card: its badge and heading in the section's own colour, a button that
 * copies a link to it, the lead, the figure, then the text, which may hold more figures between its parts. `flash`
 * briefly lights the badge up after a jump from the table of contents. Figures are pictures for the eye: the text
 * says everything they show.
 */
const props = defineProps<{ section: GuideSection, index: number, flash: boolean }>()

const FIGURES: Record<GuideFigureName, Component> = {
  'relation-map': GuideFigureRelationMap,
  'album-anatomy': GuideFigureAlbumAnatomy,
  'artist-kinds': GuideFigureArtistKinds,
  'event-editions': GuideFigureEventEditions,
  'entry-links': GuideFigureEntryLinks,
  'series-tree': GuideFigureSeriesTree,
  'vinyl-sides': GuideFigureVinylSides,
  'forum-thread': GuideFigureForumThread,
  'article-card': GuideFigureArticleCard,
  'names-history': GuideFigureNamesHistory,
  'submit-flow': GuideFigureSubmitFlow,
  'editor-shell': GuideFigureEditorShell,
  'basic-form': GuideFigureBasicForm,
  'names-dialog': GuideFigureNamesDialog,
  'tracklist': GuideFigureTracklist,
  'credits': GuideFigureCredits,
  'credits-by-track': GuideFigureCreditsByTrack,
  'credits-paste': GuideFigureCreditsPaste,
  'editions': GuideFigureEditions,
  'bonuses': GuideFigureBonuses,
  'images': GuideFigureImages,
  'relations': GuideFigureRelations,
  'translate': GuideFigureTranslate,
  'submit-panel': GuideFigureSubmitPanel,
  'review-states': GuideFigureReviewStates,
  'conflict': GuideFigureConflict,
}

const { t } = useI18n()
const { showToast } = useToast()

const blocks = computed(() => (typeof props.section.body === 'string' ? [props.section.body] : props.section.body)
  .map(block => typeof block === 'string' ? { text: block } : { figure: block as GuideFigure }))

async function copyLink() {
  const url = `${window.location.origin}${window.location.pathname}#${props.section.id}`
  try {
    await navigator.clipboard.writeText(url)
    showToast(t('legal.link_copied'))
  }
  catch {
    showToast(t('legal.copy_failed', { url }), 'error')
  }
}
</script>

<template>
  <!-- Below lg the sticky contents bar (60px) sits under the navbar, so sections stop lower there. -->
  <section
    :id="section.id"
    class="group/section accent scroll-mt-36 rounded-lg bg-card p-5 md:p-7 lg:scroll-mt-20"
    :style="{ '--shift': sectionShift(index) }"
  >
    <header class="flex items-start gap-3">
      <span
        class="badge grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) font-mono text-sm font-semibold tabular-nums text-(--accent)"
        :class="{ 'is-flashing': flash }"
        aria-hidden="true"
      >
        {{ sectionNumber(index) }}
      </span>
      <h2 class="min-w-0 flex-1 pt-1 text-xl font-bold leading-7 text-title md:text-[22px]">{{ section.title }}</h2>
      <UiIconButton
        icon="lucide:link"
        :label="t('legal.copy_link')"
        size="sm"
        class="shrink-0 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover/section:opacity-100 lg:focus-visible:opacity-100"
        @click="copyLink"
      />
    </header>

    <p class="mt-3 text-[15px] leading-7 text-body md:pl-12">{{ section.lead }}</p>

    <figure v-if="section.figure" class="figure mt-5 overflow-hidden rounded-md bg-sunken p-3 ring-1 ring-line sm:p-5">
      <component :is="FIGURES[section.figure.name]" :text="section.figure.text ?? {}" />
    </figure>

    <template v-for="(block, at) in blocks" :key="at">
      <DocProse v-if="block.text !== undefined" :content="block.text" class="mt-5" />
      <figure v-else-if="block.figure" class="figure mt-5 overflow-hidden rounded-md bg-sunken p-3 ring-1 ring-line sm:p-5">
        <component :is="FIGURES[block.figure.name]" :text="block.figure.text ?? {}" />
      </figure>
    </template>
  </section>
</template>

<style scoped>
.badge {
  transition: background-color 200ms ease-out, color 200ms ease-out;
}

.badge.is-flashing {
  animation: flash 900ms ease-out;
}

@keyframes flash {
  20% {
    background-color: var(--accent);
    color: var(--on-accent);
    scale: 1.12;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge.is-flashing {
    animation: none;
  }

  .figure :deep(*) {
    transition: none !important;
    animation: none !important;
  }
}
</style>
