<script setup lang="ts">
/**
 * 专辑标题和曲目翻译: the album's translations as tabs (official English open, a Chinese one beside it) with 新建翻译 and the
 * language and kind it asks for, the progress in the corner, and the made-up album's rows, each original above its
 * box: three filled in, two left for later.
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
      <span class="text-11 text-meta">{{ t('editor.translate.progress', { done: 3, total: 5 }) }}</span>
    </template>
    <div class="flex flex-wrap items-center gap-1.5 text-11">
      <span class="inline-flex h-6 items-center gap-1.5 rounded-md bg-primary/12 px-2 font-semibold text-primary ring-1 ring-inset ring-primary/30">
        {{ localeName('en') }}<span class="font-normal opacity-75">· {{ t('catalog.title_kind.official') }} 3/5</span>
      </span>
      <span class="inline-flex h-6 items-center gap-1.5 rounded-md bg-btn px-2 text-body">
        {{ localeName('zh-Hans') }}<span class="opacity-75">· {{ t('catalog.title_kind.translation') }} 5/5</span>
      </span>
      <span class="relative inline-flex h-6 items-center gap-1 rounded-md border border-dashed border-primary/40 px-2 font-semibold text-primary">
        <GuideMockMarker :n="1" class="absolute -left-1.5 -top-1.5" />
        <Icon name="lucide:plus" class="size-3" />{{ t('editor.translate.new') }}
      </span>
    </div>
    <div class="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-sunken/60 p-2">
      <GuideMockField :n="2" :label="t('editor.names.question')" :value="t('editor.names.official')" select class="w-36" />
      <GuideMockField :n="3" :label="t('editor.translate.language')" :value="localeName('en')" select class="w-32" />
      <p class="min-w-40 flex-1 pb-1.5 text-10 leading-3.5 text-meta">{{ t('editor.translate.kind_hint.official') }}</p>
    </div>
    <div class="relative mt-3 divide-y divide-line rounded-md ring-1 ring-line">
      <GuideMockMarker :n="4" class="absolute -left-1.5 -top-1.5 z-10" />
      <div v-for="(row, index) in ROWS" :key="index">
        <p v-if="row.heading" class="bg-sunken px-2.5 py-1 text-10 font-bold uppercase tracking-wider text-meta">{{ row.heading }}</p>
        <div class="px-2.5 py-1.5">
          <p class="flex items-center gap-2 text-11 text-meta">
            <span v-if="row.number" class="font-mono text-faint">{{ row.number }}</span>
            <span class="truncate">{{ row.original }}</span>
          </p>
          <GuideMockField :value="row.name" :placeholder="row.original" class="mt-1" />
        </div>
      </div>
    </div>
  </GuideMockPanel>
</template>
