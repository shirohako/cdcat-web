<script setup lang="ts">
/**
 * 黑胶: the made-up album's CD tracklist beside its vinyl one, which drops a track and reorders the rest over sides A
 * and B; two albums, then. The vinyl rows show the printed number (A1 …) next to the plain track number.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const CD = ['星屑のアトラス', '夜明けのプラネタリウム', '銀河鉄道の切符', '流れ星の約束', '月面ラジオ', 'おやすみ、銀河']
const SIDES = [
  { side: 'A', tracks: ['星屑のアトラス', '銀河鉄道の切符', '夜明けのプラネタリウム'] },
  { side: 'B', tracks: ['月面ラジオ', 'おやすみ、銀河'] },
]
</script>

<template>
  <div aria-hidden="true">
    <div class="grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div class="rounded-lg bg-card p-3 ring-1 ring-line">
        <p class="flex items-center gap-2">
          <GuideFigureSampleCover class="size-9 shrink-0 rounded-[4px]" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-semibold text-title">星屑のアトラス</span>
            <span class="block text-[10px] text-meta">{{ text.cd }}</span>
          </span>
          <GuideMockChip :label="t('catalog.disc_format.cd')" />
        </p>
        <ol class="mt-2.5 space-y-0.5">
          <li v-for="(title, index) in CD" :key="title" class="flex items-center gap-2 text-[11px]">
            <span class="w-4 shrink-0 text-right font-mono text-faint">{{ index + 1 }}</span>
            <span class="min-w-0 truncate text-body">{{ title }}</span>
          </li>
        </ol>
      </div>

      <div class="flex items-center justify-center gap-1.5 text-[11px] font-medium text-(--accent) sm:flex-col sm:px-1">
        <Icon name="lucide:equal-not" class="size-4" />
        <span class="max-w-28 text-center leading-4">{{ text.note }}</span>
      </div>

      <div class="rounded-lg bg-card p-3 ring-1 ring-line">
        <p class="flex items-center gap-2">
          <!-- The record in the theme colour, like the vinyl list's header picture. -->
          <svg viewBox="0 0 36 36" class="size-9 shrink-0">
            <circle cx="18" cy="18" r="17.5" class="fill-primary" />
            <circle v-for="r in [14.5, 12, 9.5]" :key="r" cx="18" cy="18" :r="r" class="fill-none stroke-on-primary opacity-30" stroke-width="0.6" />
            <circle cx="18" cy="18" r="6.5" class="fill-(--accent)" />
            <circle cx="18" cy="18" r="1.2" class="fill-primary" />
          </svg>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-semibold text-title">星屑のアトラス</span>
            <span class="block text-[10px] text-meta">{{ text.vinyl }}</span>
          </span>
          <GuideMockChip :label="t('catalog.disc_format.vinyl')" tone="soft" />
        </p>
        <div class="mt-2.5 space-y-1.5">
          <div v-for="(side, at) in SIDES" :key="side.side">
            <p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-meta">Side {{ side.side }}</p>
            <ol class="space-y-0.5">
              <li v-for="(title, index) in side.tracks" :key="title" class="flex items-center gap-2 text-[11px]">
                <span class="w-4 shrink-0 text-right font-mono text-faint">{{ (at ? SIDES[0]!.tracks.length : 0) + index + 1 }}</span>
                <span class="w-6 shrink-0 rounded-sm bg-(--accent-soft) text-center font-mono text-[10px] font-semibold text-(--accent)">{{ side.side }}{{ index + 1 }}</span>
                <span class="min-w-0 truncate text-body">{{ title }}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
    <p class="mt-2.5 text-center text-[11px] text-meta">{{ text.numbers }}</p>
  </div>
</template>
