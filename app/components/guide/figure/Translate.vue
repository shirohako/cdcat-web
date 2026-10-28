<script setup lang="ts">
/**
 * 翻译曲目表: the translator set to official English names, its progress in the corner, and the made-up album's rows,
 * each original above its box: three filled in, two left for later.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()
const { localeName } = useCatalogDisplay()

const ROWS = computed(() => [
  { heading: t('editor.translate.album_title'), number: '', original: '星屑のアトラス', name: 'Atlas of Stardust' },
  { heading: t('editor.album.disc_n', { n: 1 }), number: '01', original: '星屑のアトラス', name: 'Atlas of Stardust' },
  { number: '02', original: '夜明けのプラネタリウム', name: 'Planetarium at Dawn' },
  { number: '03', original: '銀河鉄道の切符', name: '' },
  { number: '04', original: '星屑のアトラス (Instrumental)', name: '' },
])
</script>

<template>
  <GuideMockPanel :title="t('editor.translate.title')" icon="lucide:languages" aria-hidden="true">
    <template #actions>
      <span class="text-[11px] text-meta">{{ t('editor.translate.progress', { done: 3, total: 5 }) }}</span>
    </template>
    <div class="flex flex-wrap items-end gap-2">
      <GuideMockField :n="1" :label="t('editor.translate.language')" :value="localeName('en')" select class="w-32" />
      <GuideMockField :n="2" :label="t('catalog.field.kind')" :value="t('catalog.title_kind.official')" select class="w-32" />
      <p class="min-w-40 flex-1 pb-1.5 text-[10px] leading-3.5 text-meta">{{ t('editor.translate.kind_hint.official') }}</p>
    </div>
    <div class="relative mt-3 divide-y divide-line rounded-md ring-1 ring-line">
      <GuideMockMarker :n="3" class="absolute -left-1.5 -top-1.5 z-10" />
      <div v-for="(row, index) in ROWS" :key="index">
        <p v-if="row.heading" class="bg-sunken px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-meta">{{ row.heading }}</p>
        <div class="px-2.5 py-1.5">
          <p class="flex items-center gap-2 text-[11px] text-meta">
            <span v-if="row.number" class="font-mono text-faint">{{ row.number }}</span>
            <span class="truncate">{{ row.original }}</span>
          </p>
          <GuideMockField :value="row.name" :placeholder="row.original" class="mt-1" />
        </div>
      </div>
    </div>
  </GuideMockPanel>
</template>
