<script setup lang="ts">
/**
 * 基本信息: the section filled in for the made-up album, with the real labels and markers 1–8 matching the steps under
 * the figure: cover, title, date, type, first-release event, catalog number and barcode, categories, description.
 */
const props = defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const CATEGORIES = ['game', 'animation', 'publication', 'audio_drama', 'tokusatsu', 'live_action', 'doujin', 'event']
const description = computed(() => props.text.description ?? '')
</script>

<template>
  <GuideMockPanel :title="t('editor.album.section.basic')" icon="lucide:info" aria-hidden="true">
    <div class="grid gap-4 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
      <div>
        <p class="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-body">
          <GuideMockMarker :n="1" />{{ t('editor.album.cover') }}<span class="-ml-1 text-danger">*</span>
        </p>
        <GuideFigureSampleCover class="aspect-square w-full max-w-36 rounded-lg" />
        <p class="mt-1.5 flex gap-1">
          <GuideMockButton :label="t('editor.image.replace')" icon="lucide:upload" class="min-w-0 flex-1 justify-center" />
          <GuideMockButton icon="lucide:clipboard-paste" class="px-1.5!" />
          <GuideMockButton icon="lucide:link-2" class="px-1.5!" />
        </p>
        <p class="mt-1.5 text-[10px] leading-3.5 text-meta">{{ t('editor.image.cover_rules', { size: 500 }) }}</p>
      </div>

      <div class="min-w-0 space-y-3">
        <GuideMockField :n="2" :label="t('catalog.field.title')" value="星屑のアトラス" required />
        <div class="grid grid-cols-2 gap-3">
          <GuideMockField :n="3" :label="t('catalog.field.release_date')" value="2026-10-25" required mono />
          <GuideMockField :n="4" :label="t('catalog.field.type')" :value="t('albums.type.album')" required select />
        </div>
        <div>
          <p class="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-body"><GuideMockMarker :n="5" />{{ t('editor.album.release_event') }}</p>
          <span class="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md bg-sunken px-2 text-xs text-title ring-1 ring-line">
            <Icon name="lucide:calendar-days" class="size-3.5 shrink-0 text-meta" />M3-2026秋<Icon name="lucide:x" class="size-3 shrink-0 text-meta" />
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <GuideMockField :n="6" :label="`${t('catalog.field.catalog_number')} · ${t('editor.recommended')}`" value="STNT-0012~3" mono />
          <GuideMockField :label="t('catalog.field.barcode')" value="4580000000017" mono />
        </div>
        <div>
          <p class="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-body"><GuideMockMarker :n="7" />{{ t('catalog.field.categories') }}</p>
          <p class="flex flex-wrap gap-1">
            <GuideMockChip v-for="category in CATEGORIES" :key="category" :label="t(`catalog.album_category.${category}`)" :selected="category === 'doujin'" />
          </p>
        </div>
        <GuideMockField :n="8" :label="t('catalog.field.description')" :value="description" area />
      </div>
    </div>
  </GuideMockPanel>
</template>
