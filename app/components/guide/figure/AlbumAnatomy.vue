<script setup lang="ts">
/**
 * 专辑: one album taken apart. Its header, then three columns: the editions with the discs each one includes, the
 * discs with their tracks, and the bonuses with a bonus disc that belongs to no edition. Each disc keeps one colour
 * everywhere it appears, so the eye can follow which edition includes what. Sample data is the guide's made-up album.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

/** Hue turns for discs 1–3 (see .accent in ui.css); the bonus disc wears the editor's pink bonus colour instead. */
const DISC_SHIFTS: Record<number, number> = { 1: 200, 2: -40, 3: 110 }

const discs = computed(() => [
  { n: 1, format: t('catalog.disc_format.cd'), tracks: [['星屑のアトラス', '4:12'], ['夜明けのプラネタリウム', '3:58'], ['銀河鉄道の切符', '5:01']] },
  { n: 2, format: t('catalog.disc_format.bd'), tracks: [['星屑のアトラス (Music Clip)', '4:20']] },
  { n: 3, format: t('catalog.disc_format.digital'), tracks: [['流れ星の約束 (Bonus Track)', '4:40']] },
])
const editions = computed(() => [
  { name: '初回限定盤', type: t('catalog.edition_type.limited'), format: 'CD+BD', discs: [1, 2] },
  { name: '通常盤', type: t('catalog.edition_type.regular'), format: 'CD', discs: [1] },
  { name: '配信版', type: t('catalog.product_medium.digital'), format: 'DL', discs: [1, 3] },
])
</script>

<template>
  <div aria-hidden="true">
    <div class="flex items-center gap-3 rounded-lg bg-card p-3 shadow-xs ring-1 ring-line">
      <GuideFigureSampleCover class="size-14 shrink-0 rounded-md" />
      <div class="min-w-0">
        <p class="truncate text-[15px] font-bold text-title">星屑のアトラス</p>
        <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-meta">
          <GuideMockChip :label="t('albums.type.album')" tone="soft" />
          <span class="font-mono">STNT-0012~3</span>
          <span>2026-10-25</span>
          <span class="inline-flex items-center gap-1"><Icon name="lucide:calendar" class="size-3" />M3-2026秋</span>
        </p>
      </div>
    </div>

    <!-- The three parts hang off the album like a tree. -->
    <div class="relative hidden h-4 sm:block">
      <span class="absolute inset-x-[16.67%] top-1/2 border-t border-faint/60" />
      <span v-for="left in ['16.67%', '50%', '83.33%']" :key="left" class="absolute top-1/2 h-2 border-l border-faint/60" :style="{ left }" />
      <span class="absolute left-1/2 top-0 h-2 border-l border-faint/60" />
    </div>

    <div class="mt-3 grid gap-3 sm:mt-0 sm:grid-cols-3">
      <div class="rounded-lg bg-card p-3 ring-1 ring-line">
        <p class="flex items-center gap-1.5 text-xs font-semibold text-title"><Icon name="lucide:package" class="size-3.5 text-meta" />{{ t('editor.album.section.editions') }}</p>
        <p class="mt-0.5 text-[11px] leading-4 text-meta">{{ text.editions_note }}</p>
        <ul class="mt-2.5 space-y-2">
          <li v-for="edition in editions" :key="edition.name" class="rounded-md bg-sunken px-2 py-1.5">
            <p class="flex items-center gap-1.5 text-xs">
              <span class="min-w-0 flex-1 truncate font-semibold text-title">{{ edition.name }}</span>
              <span class="shrink-0 font-mono text-[10px] text-meta">{{ edition.format }}</span>
            </p>
            <p class="mt-1 flex flex-wrap items-center gap-1">
              <GuideMockChip :label="edition.type" />
              <span
                v-for="n in edition.discs"
                :key="n"
                class="accent inline-flex h-5 items-center gap-1 rounded-md bg-(--accent-soft) px-1.5 text-[10px] font-semibold text-(--accent)"
                :style="{ '--shift': DISC_SHIFTS[n] }"
              ><Icon name="lucide:check" class="size-2.5" />{{ t('editor.album.disc_n', { n }) }}</span>
            </p>
          </li>
        </ul>
      </div>

      <div class="rounded-lg bg-card p-3 ring-1 ring-line">
        <p class="flex items-center gap-1.5 text-xs font-semibold text-title"><Icon name="lucide:list-music" class="size-3.5 text-meta" />{{ t('editor.album.section.tracks') }}</p>
        <p class="mt-0.5 text-[11px] leading-4 text-meta">{{ text.discs_note }}</p>
        <div class="mt-2.5 space-y-2">
          <div v-for="disc in discs" :key="disc.n" class="accent overflow-hidden rounded-md ring-1 ring-(--accent)/35" :style="{ '--shift': DISC_SHIFTS[disc.n] }">
            <p class="flex items-center gap-1.5 bg-(--accent)/10 px-2 py-1 text-[11px] font-semibold text-(--accent)">
              <Icon name="lucide:disc-3" class="size-3" />{{ t('editor.album.disc_n', { n: disc.n }) }} · {{ disc.format }}
            </p>
            <ol class="px-2 py-1">
              <li v-for="([title, time], index) in disc.tracks" :key="title" class="flex items-center gap-2 py-0.5 text-[11px]">
                <span class="w-4 shrink-0 font-mono text-faint">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="min-w-0 flex-1 truncate text-body">{{ title }}</span>
                <span class="shrink-0 font-mono text-meta">{{ time }}</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-card p-3 ring-1 ring-line">
        <p class="flex items-center gap-1.5 text-xs font-semibold text-title"><Icon name="lucide:gift" class="size-3.5 text-meta" />{{ t('editor.album.section.bonuses') }}</p>
        <p class="mt-0.5 text-[11px] leading-4 text-meta">{{ text.bonuses_note }}</p>
        <ul class="mt-2.5 space-y-2">
          <li class="rounded-md bg-sunken px-2 py-1.5">
            <p class="truncate text-xs font-semibold text-title">{{ text.bonus_shop }}</p>
            <p class="mt-1 flex flex-wrap items-center gap-1">
              <GuideMockChip :label="t('catalog.bonus_type.bonus_disc')" />
              <GuideMockChip :label="t('catalog.limited_rule.shop')" />
            </p>
            <div class="mt-1.5 overflow-hidden rounded-md ring-1 ring-pink-300/70 dark:ring-pink-400/40">
              <p class="flex items-center gap-1.5 bg-pink-100/70 px-2 py-1 text-[11px] font-semibold text-pink-600 dark:bg-pink-400/15 dark:text-pink-200">
                <Icon name="lucide:disc-3" class="size-3" />{{ t('editor.album.disc_n', { n: 4 }) }} · {{ t('catalog.disc_format.cd') }}
              </p>
              <p class="flex items-center gap-2 px-2 py-1 text-[11px]">
                <span class="w-4 shrink-0 font-mono text-faint">01</span>
                <span class="min-w-0 flex-1 truncate text-body">星屑のアトラス (Acoustic)</span>
              </p>
            </div>
          </li>
          <li class="rounded-md bg-sunken px-2 py-1.5">
            <p class="truncate text-xs font-semibold text-title">{{ text.bonus_goods }}</p>
            <p class="mt-1 flex flex-wrap items-center gap-1">
              <GuideMockChip :label="t('catalog.bonus_type.goods')" />
              <GuideMockChip :label="t('catalog.limited_rule.event')" />
            </p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
