<script setup lang="ts">
/**
 * 活动: a series (M3) and a row of its editions, the latest one opened up into what its page has: a venue map with
 * booths coloured by genre family, the circles at their booths, and the albums first released there.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const EDITIONS = [
  { name: 'M3-2025春', date: '2025-04-27' },
  { name: 'M3-2025秋', date: '2025-10-26' },
  { name: 'M3-2026春', date: '2026-04-26' },
  { name: 'M3-2026秋', date: '2026-10-25', current: true },
]

/** Hue turns of the three genre families the venue map colours booths by (music, anime and games, other). */
const FAMILIES = [200, 80, -40]
/** Two islands of booths, four rows each, with an aisle between them; one booth is the circle picked below. */
const BOOTHS = Array.from({ length: 4 }, (_, row) => Array.from({ length: 12 }, (_, col) => ({
  x: 12 + col * 8 + (col >= 6 ? 6 : 0),
  y: 14 + row * 12 + (row >= 2 ? 4 : 0),
  family: (row * 5 + col * 3 + (col % 4)) % 3,
  picked: row === 1 && col === 3,
}))).flat()

const CIRCLES = [
  { space: 'A-01a', name: 'ステラノート', family: 0, wanted: true },
  { space: 'A-02b', name: 'ルミナス楽団', family: 1 },
  { space: 'C-15a', name: 'ミッドナイト放送部', family: 2 },
]
</script>

<template>
  <div aria-hidden="true">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <div class="flex shrink-0 items-center gap-2.5 rounded-lg bg-card p-2.5 ring-1 ring-line sm:w-40">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-(--accent) font-mono text-sm font-bold text-(--on-accent)">M3</span>
        <span class="min-w-0">
          <span class="block text-xs font-semibold text-title">M3</span>
          <span class="block text-[11px] text-meta">{{ text.series_note }}</span>
        </span>
      </div>
      <ol class="relative flex flex-1 items-center gap-1.5 overflow-hidden rounded-lg bg-card p-2.5 ring-1 ring-line">
        <span class="absolute inset-x-4 top-1/2 border-t border-dashed border-line" />
        <li
          v-for="edition in EDITIONS"
          :key="edition.name"
          class="relative min-w-0 flex-1 rounded-md px-2 py-1.5 text-center"
          :class="edition.current ? 'bg-(--accent-soft) ring-1 ring-(--accent)/50' : 'bg-sunken'"
        >
          <span class="block truncate text-[11px] font-semibold" :class="edition.current ? 'text-(--accent)' : 'text-body'">{{ edition.name }}</span>
          <span class="block truncate font-mono text-[10px] text-meta">{{ edition.date }}</span>
        </li>
      </ol>
    </div>

    <div class="mt-3 rounded-lg bg-card p-3 ring-1 ring-(--accent)/40">
      <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-meta">
        <span class="text-[13px] font-bold text-title">M3-2026秋</span>
        <span class="inline-flex items-center gap-1"><Icon name="lucide:calendar" class="size-3" />2026-10-25 10:30–15:30</span>
        <span class="inline-flex items-center gap-1"><Icon name="lucide:map-pin" class="size-3" />{{ text.venue }}</span>
        <span class="ml-auto rounded-sm bg-sunken px-1.5 py-0.5">{{ text.edition_note }}</span>
      </p>

      <div class="mt-3 grid gap-3 sm:grid-cols-3">
        <div class="rounded-md bg-sunken p-2">
          <p class="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-title"><Icon name="lucide:map" class="size-3 text-meta" />{{ t('event_page.map.title') }}</p>
          <svg viewBox="0 0 120 72" class="w-full rounded-sm bg-card">
            <rect x="4" y="6" width="112" height="62" rx="2" class="fill-none stroke-line" stroke-width="1" />
            <rect x="52" y="6" width="16" height="4" class="fill-line" />
            <rect
              v-for="(booth, index) in BOOTHS"
              :key="index"
              :x="booth.x"
              :y="booth.y"
              width="7"
              height="5"
              rx="0.8"
              class="accent"
              :class="booth.picked ? 'fill-primary' : 'fill-(--accent) opacity-55'"
              :style="{ '--shift': FAMILIES[booth.family] }"
            />
            <circle :cx="BOOTHS.find(booth => booth.picked)!.x + 3.5" :cy="BOOTHS.find(booth => booth.picked)!.y + 2.5" r="6" class="fill-none stroke-primary" stroke-width="1" />
          </svg>
        </div>

        <div class="rounded-md bg-sunken p-2">
          <p class="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-title"><Icon name="lucide:users-round" class="size-3 text-meta" />{{ t('event_page.stats.circles') }}</p>
          <ul class="space-y-1">
            <li v-for="circle in CIRCLES" :key="circle.space" class="flex items-center gap-1.5 rounded-sm bg-card px-1.5 py-1">
              <span class="accent size-5 shrink-0 rounded-[3px] bg-(--accent) opacity-70" :style="{ '--shift': FAMILIES[circle.family] }" />
              <span class="w-9 shrink-0 font-mono text-[10px] text-meta">{{ circle.space }}</span>
              <span class="min-w-0 flex-1 truncate text-[11px] text-title">{{ circle.name }}</span>
              <Icon v-if="circle.wanted" name="lucide:heart" class="size-3 shrink-0 fill-current text-danger" />
            </li>
          </ul>
        </div>

        <div class="rounded-md bg-sunken p-2">
          <p class="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-title"><Icon name="lucide:disc-3" class="size-3 text-meta" />{{ t('event_page.stats.albums') }}</p>
          <div class="grid grid-cols-2 gap-1.5">
            <div v-for="(album, index) in ['星屑のアトラス', '真夜中ラジオ']" :key="album" class="min-w-0">
              <GuideFigureSampleCover class="aspect-square w-full rounded-sm" :style="index ? { '--shift': 20 } : undefined" />
              <p class="mt-0.5 truncate text-[10px] text-title">{{ album }}</p>
              <p class="font-mono text-[9px] text-primary">{{ index ? 'C-15a' : 'A-01a' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
