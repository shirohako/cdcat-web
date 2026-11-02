<template>
  <Teleport to="body">
    <!-- Above the navbar (z-50) and sidebar, which would otherwise cover the top bar with its close button; below
         popovers and tooltips. A click on the dark area around the picture closes it too. -->
    <div v-if="current" ref="viewer" class="fixed inset-0 z-[70] flex flex-col bg-black/90" tabindex="-1" @keydown.esc.stop="close" @keydown.left="step(-1)" @keydown.right="step(1)">
      <div class="flex items-center gap-3 px-4 py-3 text-sm text-white/80">
        <span class="font-semibold text-white">{{ current.title }}</span>
        <span v-if="current.label">{{ current.label }}</span>
        <span v-if="current.scope" class="text-white/60">{{ current.scope }}</span>
        <span class="ml-auto tabular-nums text-white/60">{{ index! + 1 }} / {{ items.length }}</span>
        <a :href="current.image.url" target="_blank" rel="noopener" class="-mx-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors duration-150 ease-out hover:bg-white/15 hover:text-white">{{ $t('album.gallery.original', { width: current.image.width, height: current.image.height }) }}</a>
        <button type="button" class="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out hover:bg-white/15" @click="close"><X :size="18" /></button>
      </div>
      <div class="relative flex min-h-0 flex-1 items-center justify-center px-12" @click.self="close">
        <button v-if="items.length > 1" type="button" class="absolute left-2 inline-flex size-10 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out hover:bg-white/15" @click="step(-1)"><ChevronLeft :size="22" /></button>
        <img :src="current.image.medium_url" :alt="current.caption || ''" class="max-h-full max-w-full object-contain">
        <button v-if="items.length > 1" type="button" class="absolute right-2 inline-flex size-10 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out hover:bg-white/15" @click="step(1)"><ChevronRight :size="22" /></button>
      </div>
      <div v-if="current.caption || current.attributes?.length" class="space-y-2 px-6 py-3 text-sm text-white/80">
        <p v-if="current.caption">{{ current.caption }}</p>
        <CatalogAttributeList v-if="current.attributes?.length" :attributes="current.attributes" class="text-white/80 [&_dd]:text-white/90 [&_dt]:text-white/50" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { CatalogAttribute, CatalogImage } from '~/types/catalog'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'

export interface CatalogImageViewerItem {
  image: CatalogImage
  /** The kind, e.g. 背面 */
  title: string
  label?: string | null
  /** What the image belongs to, e.g. an edition */
  scope?: string | null
  caption?: string | null
  attributes?: CatalogAttribute[]
}

/**
 * The full-screen viewer of a page's images (the album gallery, the artist page's 图片): one at a time with its kind,
 * label and caption, ← and → or the side buttons to step through, Esc or a click beside the picture to close.
 * `index` is the image shown, null while closed.
 */
const props = defineProps<{ items: CatalogImageViewerItem[] }>()
const index = defineModel<number | null>('index', { required: true })

const viewer = ref<HTMLElement | null>(null)
const current = computed(() => index.value === null ? null : props.items[index.value] ?? null)

// Focused when it opens, so the keys work at once.
watch(index, async (value, previous) => {
  if (value === null || previous !== null) return
  await nextTick()
  viewer.value?.focus()
})
const close = () => { index.value = null }
const step = (delta: number) => {
  if (index.value === null) return
  index.value = (index.value + delta + props.items.length) % props.items.length
}
</script>
