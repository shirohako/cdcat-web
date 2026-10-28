<script setup lang="ts">
/**
 * 系列: a two-level tree, a series with a sub-series and entries, each entry carrying its albums, and one album
 * hung straight on the top series with a dashed line: the series' own album.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const game = computed(() => t('catalog.entry_type.game'))
const film = computed(() => `${t('catalog.entry_type.anime')} · ${t('catalog.format.movie')}`)
</script>

<template>
  <div aria-hidden="true">
    <div class="rounded-lg bg-card p-3 ring-1 ring-line">
      <p class="flex items-center gap-2">
        <span class="grid size-7 shrink-0 place-items-center rounded-md bg-(--accent) text-(--on-accent)"><Icon name="lucide:library" class="size-4" /></span>
        <span class="min-w-0 flex-1 truncate text-[13px] font-bold text-title">FINAL FANTASY</span>
        <GuideMockChip :label="t('menu.series')" tone="soft" />
      </p>

      <ul class="ml-3.5 mt-2 space-y-2 border-l border-faint/60 pl-4">
        <li class="relative">
          <span class="absolute -left-4 top-3.5 w-3 border-t border-faint/60" />
          <div class="rounded-md bg-sunken p-2">
            <p class="flex items-center gap-2">
              <span class="grid size-6 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)"><Icon name="lucide:library" class="size-3.5" /></span>
              <span class="min-w-0 flex-1 truncate text-xs font-semibold text-title">FINAL FANTASY VII</span>
              <GuideMockChip :label="t('catalog.sub_series')" />
            </p>
            <ul class="ml-3 mt-1.5 space-y-1 border-l border-faint/60 pl-3">
              <GuideFigureSeriesEntry title="FINAL FANTASY VII" :kind="game" icon="lucide:gamepad-2" album="Original Soundtrack" />
              <GuideFigureSeriesEntry title="ADVENT CHILDREN" :kind="film" icon="lucide:clapperboard" album="Original Soundtrack" :shift="60" />
            </ul>
          </div>
        </li>
        <GuideFigureSeriesEntry title="FINAL FANTASY X" :kind="game" icon="lucide:gamepad-2" album="Original Soundtrack" :shift="-60" top />
        <li class="relative">
          <span class="absolute -left-4 top-1/2 w-3 border-t border-dashed border-faint/60" />
          <p class="flex items-center gap-2 rounded-md border border-dashed border-(--accent)/50 px-2 py-1.5">
            <GuideFigureSampleCover class="size-6 shrink-0 rounded-[3px]" style="--shift: 140" />
            <span class="min-w-0 flex-1 truncate text-[11px] text-title">Anniversary Best</span>
            <GuideMockChip :label="t('catalog.whole_series_albums')" tone="soft" />
          </p>
        </li>
      </ul>
    </div>
    <p class="mt-2.5 text-center text-[11px] text-meta">{{ text.note }}</p>
  </div>
</template>
