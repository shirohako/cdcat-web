<script setup lang="ts">
/**
 * 条目: a made-up TV anime in the middle, its related entries on one side (the manga it adapts, its sequel, a game
 * spun off from it) and its albums on the other, each labelled with how it relates.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const ENTRIES = computed(() => [
  { relation: 'source', kind: `${t('catalog.entry_type.manga')} · ${t('catalog.format.serial')}`, key: 'title', icon: 'lucide:book-open' },
  { relation: 'sequel', kind: `${t('catalog.entry_type.anime')} · ${t('catalog.format.tv')}`, key: 'sequel_title', icon: 'lucide:tv' },
  { relation: 'spin_off', kind: `${t('catalog.entry_type.game')} · ${t('catalog.format.full')}`, key: 'game_title', icon: 'lucide:gamepad-2' },
])
const ALBUMS = [
  { relation: 'opening', title: '放課後ステラ', shift: 0 },
  { relation: 'ending', title: '夜空のレシピ', shift: 60 },
  { relation: 'ost', title: 'Original Soundtrack', shift: 120 },
  { relation: 'character_song', title: 'Character Song Vol.1', shift: -60 },
]
</script>

<template>
  <div class="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1fr)]" aria-hidden="true">
    <div class="rounded-lg bg-card p-2.5 ring-1 ring-line">
      <p class="mb-2 text-[11px] font-semibold text-meta">{{ text.entries_title }}</p>
      <ul class="space-y-1.5">
        <li v-for="entry in ENTRIES" :key="entry.relation" class="flex items-center gap-2 rounded-md bg-sunken px-2 py-1.5">
          <Icon :name="entry.icon" class="size-3.5 shrink-0 text-meta" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[11px] text-title">{{ text[entry.key] }}</span>
            <span class="block truncate text-[10px] text-meta">{{ entry.kind }}</span>
          </span>
          <GuideMockChip :label="t(`catalog.relation.${entry.relation}`)" tone="soft" />
        </li>
      </ul>
    </div>

    <div class="relative order-first flex flex-col items-center rounded-lg bg-card p-3 text-center shadow-xs ring-1 ring-(--accent)/50 sm:order-none">
      <span class="grid size-12 place-items-center rounded-md bg-(--accent-soft) text-(--accent)">
        <Icon name="lucide:tv" class="size-6" />
      </span>
      <p class="mt-2 text-[13px] font-bold leading-5 text-title">{{ text.title }}</p>
      <p class="mt-1 flex flex-wrap justify-center gap-1">
        <GuideMockChip :label="t('catalog.entry_type.anime')" />
        <GuideMockChip :label="t('catalog.format.tv')" />
      </p>
      <!-- Arrows out to both sides, on wider screens where the lists sit beside it. -->
      <Icon name="lucide:move-horizontal" class="absolute -left-3 top-1/2 hidden size-4 -translate-x-1/2 -translate-y-1/2 text-faint sm:block" />
      <Icon name="lucide:move-horizontal" class="absolute -right-3 top-1/2 hidden size-4 translate-x-1/2 -translate-y-1/2 text-faint sm:block" />
    </div>

    <div class="rounded-lg bg-card p-2.5 ring-1 ring-line">
      <p class="mb-2 text-[11px] font-semibold text-meta">{{ text.albums_title }}</p>
      <ul class="space-y-1.5">
        <li v-for="album in ALBUMS" :key="album.relation" class="flex items-center gap-2 rounded-md bg-sunken px-2 py-1.5">
          <GuideFigureSampleCover class="size-6 shrink-0 rounded-[3px]" :style="{ '--shift': album.shift }" />
          <span class="min-w-0 flex-1 truncate text-[11px] text-title">{{ album.title }}</span>
          <GuideMockChip :label="t(`catalog.album_relation.${album.relation}`)" tone="soft" />
        </li>
      </ul>
    </div>
  </div>
</template>
