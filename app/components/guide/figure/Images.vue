<script setup lang="ts">
/**
 * 图片: the gallery after a few uploads, each card with its sketched scan (back, booklet spread, disc face), its kind,
 * label, scope and caption, under the upload and import buttons.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const IMAGES = computed(() => [
  { art: 'back', kind: t('catalog.image_kind.back'), label: '', scope: t('editor.image.scope_album'), size: '1500 × 1500' },
  { art: 'booklet', kind: t('catalog.image_kind.booklet'), label: 'p. 01-02', scope: t('editor.image.scope_album'), size: '3000 × 1500' },
  { art: 'disc', kind: t('catalog.image_kind.disc'), label: 'Disc 2', scope: '初回限定盤', size: '1200 × 1200' },
])
</script>

<template>
  <GuideMockPanel :title="t('editor.album.section.images')" icon="lucide:images" aria-hidden="true">
    <p class="flex flex-wrap items-center gap-1.5">
      <GuideMockButton :label="t('editor.image.upload_many')" icon="lucide:upload" variant="primary" />
      <GuideMockButton :label="t('editor.image.from_url')" icon="lucide:link-2" />
      <span class="text-[10px] text-meta">{{ t('editor.image.gallery_hint') }}</span>
    </p>
    <ul class="mt-3 grid gap-2.5 sm:grid-cols-3">
      <li v-for="image in IMAGES" :key="image.art" class="overflow-hidden rounded-md bg-sunken ring-1 ring-line">
        <svg viewBox="0 0 120 72" class="w-full bg-card">
          <template v-if="image.art === 'back'">
            <rect x="34" y="6" width="52" height="60" rx="2" class="fill-sunken stroke-line" stroke-width="1" />
            <rect v-for="row in 7" :key="row" x="41" :y="10 + row * 6" :width="row % 3 ? 34 : 26" height="2" rx="1" class="fill-faint opacity-60" />
            <rect x="72" y="56" width="10" height="6" class="fill-line" />
          </template>
          <template v-else-if="image.art === 'booklet'">
            <rect x="12" y="8" width="47" height="56" rx="1.5" class="fill-sunken stroke-line" stroke-width="1" />
            <rect x="61" y="8" width="47" height="56" rx="1.5" class="fill-sunken stroke-line" stroke-width="1" />
            <rect v-for="row in 6" :key="row" x="18" :y="12 + row * 7" :width="row % 2 ? 34 : 28" height="2" rx="1" class="fill-faint opacity-60" />
            <rect x="67" y="14" width="35" height="24" rx="1" class="accent fill-(--accent) opacity-40" style="--shift: 200" />
            <rect v-for="row in 3" :key="`r${row}`" x="67" :y="38 + row * 6" :width="row % 2 ? 30 : 24" height="2" rx="1" class="fill-faint opacity-60" />
          </template>
          <template v-else>
            <circle cx="60" cy="36" r="30" class="fill-sunken stroke-line" stroke-width="1" />
            <circle cx="60" cy="36" r="22" class="accent fill-(--accent) opacity-30" style="--shift: -40" />
            <circle cx="60" cy="36" r="9" class="fill-card stroke-line" stroke-width="1" />
            <circle cx="60" cy="36" r="3" class="fill-sunken" />
          </template>
        </svg>
        <div class="space-y-1.5 p-2">
          <p class="grid grid-cols-2 gap-1.5">
            <GuideMockField :value="image.kind" select />
            <GuideMockField :value="image.label" :placeholder="t('editor.image.label_placeholder')" />
          </p>
          <GuideMockField :value="image.scope" select />
          <GuideMockField :placeholder="t('editor.image.caption_placeholder')" />
          <p class="text-right font-mono text-[9px] text-faint">{{ image.size }}</p>
        </div>
      </li>
    </ul>
  </GuideMockPanel>
</template>
