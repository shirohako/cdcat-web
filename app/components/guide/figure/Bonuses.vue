<script setup lang="ts">
/**
 * 特典: two bonuses as the section lists them, a shop bonus with its bonus disc and an event bonus, then that bonus
 * disc as the tracks section shows it, marked in the editor's pink.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()
</script>

<template>
  <div class="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" aria-hidden="true">
    <GuideMockPanel :title="t('editor.album.section.bonuses')" icon="lucide:gift">
      <ul class="space-y-1.5">
        <li class="flex gap-2 rounded-md bg-sunken px-2 py-1.5">
          <span class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-pink-100 text-pink-600 dark:bg-pink-400/20 dark:text-pink-200"><Icon name="lucide:gift" class="size-3.5" /></span>
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-semibold text-title">とらのあな特典</span>
              <GuideMockChip :label="t('catalog.bonus_type.bonus_disc')" />
            </span>
            <span class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-meta">
              <span>とらのあな</span>
              <span>{{ t('catalog.limited_rule.shop') }}</span>
              <span>初回限定盤</span>
              <span class="inline-flex items-center gap-0.5 text-pink-600 dark:text-pink-200"><Icon name="lucide:disc-3" class="size-2.5" />{{ t('editor.album.disc_n', { n: 4 }) }}</span>
            </span>
          </span>
        </li>
        <li class="flex gap-2 rounded-md bg-sunken px-2 py-1.5">
          <span class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-pink-100 text-pink-600 dark:bg-pink-400/20 dark:text-pink-200"><Icon name="lucide:gift" class="size-3.5" /></span>
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-semibold text-title">会場限定 B2タペストリー</span>
              <GuideMockChip :label="t('catalog.bonus_type.goods')" />
            </span>
            <span class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-meta">
              <span>{{ t('catalog.limited_rule.event') }}</span>
              <span class="inline-flex items-center gap-0.5"><Icon name="lucide:calendar-days" class="size-2.5" />M3-2026秋</span>
              <span>{{ t('album.bonuses.all_editions') }}</span>
            </span>
          </span>
        </li>
      </ul>
      <p class="mt-2.5"><GuideMockButton :label="t('editor.bonuses.add')" icon="lucide:plus" variant="add" /></p>
    </GuideMockPanel>

    <div class="self-start overflow-hidden rounded-lg border border-pink-200 bg-card shadow-xs dark:border-pink-400/30">
      <p class="flex flex-wrap items-center gap-1.5 border-b border-line bg-sunken px-2.5 py-1.5">
        <Icon name="lucide:disc-3" class="size-3.5 text-meta" />
        <span class="text-xs font-bold text-body">{{ t('editor.album.disc_n', { n: 4 }) }}</span>
        <GuideMockField :value="t('catalog.disc_format.cd')" select class="w-18" />
        <span class="ml-auto rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-600 dark:bg-pink-400/20 dark:text-pink-200">{{ t('editor.album.bonus_disc', { name: 'とらのあな特典' }) }}</span>
      </p>
      <ol class="px-2.5 py-1.5">
        <li v-for="(title, index) in ['星屑のアトラス (Acoustic)', '夜明けのプラネタリウム (Piano)']" :key="title" class="flex items-center gap-2 py-1 text-[11px]">
          <span class="w-5 shrink-0 font-mono text-faint">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="min-w-0 flex-1 truncate text-title">{{ title }}</span>
        </li>
      </ol>
      <p class="border-t border-line px-2.5 py-1.5 text-[10px] text-meta">{{ t('editor.album.bonus_disc_hint') }}</p>
    </div>
  </div>
</template>
