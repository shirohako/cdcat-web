<template>
  <CatalogSection v-if="items.length" :title="$t('album.section.gallery')" :icon="Images">
    <template #actions>{{ $t('album.gallery.count', { count: items.length }) }}</template>

    <div class="space-y-4 px-5 py-4">
      <div v-for="group in groups" :key="group.kind">
        <h3 class="mb-2 text-xs font-semibold text-meta">{{ enumLabel('image_kind', group.kind) }}</h3>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="group relative aspect-square overflow-hidden rounded-lg bg-sunken"
            @click="open(item.index)"
          >
            <img :src="item.image.thumbnail_url" :alt="item.caption || enumLabel('image_kind', item.kind)" loading="lazy" class="h-full w-full object-cover transition-transform group-hover:scale-105">
            <span v-if="item.label || item.scope" class="absolute inset-x-0 bottom-0 truncate bg-scrim px-1.5 py-0.5 text-left text-[10px] text-on-media">
              {{ [item.label, item.scope].filter(Boolean).join(' · ') }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </CatalogSection>

  <Teleport to="body">
    <div v-if="current" ref="viewer" class="fixed inset-0 z-50 flex flex-col bg-black/90" tabindex="-1" @keydown.esc="close" @keydown.left="step(-1)" @keydown.right="step(1)">
      <div class="flex items-center gap-3 px-4 py-3 text-sm text-white/80">
        <span class="font-semibold text-white">{{ enumLabel('image_kind', current.kind) }}</span>
        <span v-if="current.label">{{ current.label }}</span>
        <span v-if="current.scope" class="text-white/60">{{ current.scope }}</span>
        <span class="ml-auto tabular-nums text-white/60">{{ index! + 1 }} / {{ items.length }}</span>
        <a :href="current.image.url" target="_blank" rel="noopener" class="-mx-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors duration-150 ease-out hover:bg-white/15 hover:text-white">{{ $t('album.gallery.original', { width: current.image.width, height: current.image.height }) }}</a>
        <button type="button" class="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out hover:bg-white/15" @click="close"><X :size="18" /></button>
      </div>
      <div class="relative flex min-h-0 flex-1 items-center justify-center px-12">
        <button v-if="items.length > 1" type="button" class="absolute left-2 inline-flex size-10 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out hover:bg-white/15" @click="step(-1)"><ChevronLeft :size="22" /></button>
        <img :src="current.image.medium_url" :alt="current.caption || ''" class="max-h-full max-w-full object-contain">
        <button v-if="items.length > 1" type="button" class="absolute right-2 inline-flex size-10 items-center justify-center rounded-full text-white transition-colors duration-150 ease-out hover:bg-white/15" @click="step(1)"><ChevronRight :size="22" /></button>
      </div>
      <div v-if="current.caption || current.attributes.length" class="space-y-2 px-6 py-3 text-sm text-white/80">
        <p v-if="current.caption">{{ current.caption }}</p>
        <CatalogAttributeList v-if="current.attributes.length" :attributes="current.attributes" class="text-white/80 [&_dd]:text-white/90 [&_dt]:text-white/50" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { AlbumBonus, AlbumDisc, AlbumImage, AlbumProduct, ImageKind } from '~/types/album'
import type { CatalogImage } from '~/types/catalog'
import { IMAGE_KINDS } from '~/types/album'
import { ChevronLeft, ChevronRight, Images, X } from '@lucide/vue'

const props = defineProps<{
  images: AlbumImage[]
  products: AlbumProduct[]
  bonuses: AlbumBonus[]
  discs: AlbumDisc[]
}>()

const { t } = useI18n()
const { enumLabel } = useCatalogDisplay()

/** What an image belongs to: an edition, a bonus or a disc. */
const scopeOf = (image: AlbumImage) => {
  if (image.product_id) {
    const product = props.products.find(item => item.id === image.product_id)
    return product?.name || (product ? t(product.edition_type === 'limited' ? 'content_display.limited' : 'content_display.regular') : '')
  }
  if (image.bonus_id) return props.bonuses.find(item => item.id === image.bonus_id)?.name ?? ''
  if (image.disc_id) return `Disc ${props.discs.find(item => item.id === image.disc_id)?.position ?? ''}`
  return ''
}

type Item = AlbumImage & { image: CatalogImage, scope: string, index: number }

/** Images in kind order (cover, front, back, booklet …), then their own order. */
const items = computed<Item[]>(() => props.images
  .filter((image): image is AlbumImage & { image: CatalogImage } => image.image !== null)
  .sort((a, b) => IMAGE_KINDS.indexOf(a.kind) - IMAGE_KINDS.indexOf(b.kind) || a.sort_order - b.sort_order)
  .map((image, index) => ({ ...image, scope: scopeOf(image), index })))

const groups = computed(() => {
  const map = new Map<ImageKind, Item[]>()
  for (const item of items.value) map.set(item.kind, [...(map.get(item.kind) ?? []), item])
  return [...map.entries()].map(([kind, list]) => ({ kind, items: list }))
})

const index = ref<number | null>(null)
const viewer = ref<HTMLElement | null>(null)
const current = computed(() => index.value === null ? null : items.value[index.value] ?? null)

const open = async (at: number) => {
  index.value = at
  await nextTick()
  viewer.value?.focus()
}
const close = () => { index.value = null }
const step = (delta: number) => {
  if (index.value === null) return
  index.value = (index.value + delta + items.value.length) % items.value.length
}

/** Opens the gallery at the main cover, for the hero image. */
const openCover = () => {
  const cover = items.value.find(item => item.kind === 'cover' && !item.product_id && !item.bonus_id && !item.disc_id)
  if (cover) open(cover.index)
}
defineExpose({ openCover })
</script>
