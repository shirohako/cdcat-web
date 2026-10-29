<template>
  <!-- Always there, in the side column: the album's images as a grid of small thumbnails or a list, the choice kept
       in a cookie so the server draws it; past a few, collapsed until expanded. Empty, one line. -->
  <section class="card overflow-hidden">
    <UiSectionTitle :title="$t('album.section.gallery')" :icon="Images" :count="thumbnails.length || undefined" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5">
      <template v-if="thumbnails.length" #actions>
        <UiSegmented v-model="view" :items="views" size="sm" :label="$t('album.gallery.view')" />
      </template>
    </UiSectionTitle>

    <CatalogEmptyLine v-if="!thumbnails.length" :icon="Images" :text="$t('album.empty.gallery')" size="sm" />

    <div v-else class="px-5 pb-4 pt-2">
      <!-- Grid: four a row; the tooltip names each image and glides from one to the next -->
      <div v-if="view === 'grid'" class="grid grid-cols-4 gap-1.5">
        <UiTooltip v-for="item in shown" :key="item.id" group="album-gallery" :text="describe(item)">
          <button type="button" class="group relative aspect-square overflow-hidden rounded-md bg-sunken" @click="open(item.index)">
            <img :src="item.image.thumbnail_url" :alt="item.caption || describe(item)" loading="lazy" class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105">
          </button>
        </UiTooltip>
      </div>

      <!-- List: a small thumbnail, the kind, and its label and what it belongs to; hover turns the name, no fill -->
      <ul v-else class="space-y-1">
        <li v-for="item in shown" :key="item.id">
          <button type="button" class="group flex w-full min-w-0 items-center gap-3 py-0.5 text-left" @click="open(item.index)">
            <img :src="item.image.thumbnail_url" :alt="item.caption || describe(item)" loading="lazy" class="size-10 shrink-0 rounded-md bg-sunken object-cover">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-title transition-colors group-hover:text-primary">{{ enumLabel('image_kind', item.kind) }}</span>
              <span v-if="item.label || item.scope" class="block truncate text-[11px] text-meta">{{ [item.label, item.scope].filter(Boolean).join(' · ') }}</span>
            </span>
          </button>
        </li>
      </ul>

      <div v-if="collapsible" class="mt-3 flex justify-center">
        <UiButton size="xs" :icon-right="expanded ? ChevronUp : ChevronDown" @click="expanded = !expanded">
          {{ expanded ? $t('album.gallery.collapse') : $t('album.gallery.show_all', { count: thumbnails.length }) }}
        </UiButton>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <!-- Above the navbar (z-50) and sidebar, which would otherwise cover the top bar with its close button; below
         popovers and tooltips. A click on the dark area around the picture closes it too. -->
    <div v-if="current" ref="viewer" class="fixed inset-0 z-[70] flex flex-col bg-black/90" tabindex="-1" @keydown.esc="close" @keydown.left="step(-1)" @keydown.right="step(1)">
      <div class="flex items-center gap-3 px-4 py-3 text-sm text-white/80">
        <span class="font-semibold text-white">{{ enumLabel('image_kind', current.kind) }}</span>
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
      <div v-if="current.caption || current.attributes.length" class="space-y-2 px-6 py-3 text-sm text-white/80">
        <p v-if="current.caption">{{ current.caption }}</p>
        <CatalogAttributeList v-if="current.attributes.length" :attributes="current.attributes" class="text-white/80 [&_dd]:text-white/90 [&_dt]:text-white/50" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { AlbumBonus, AlbumDisc, AlbumImage, AlbumProduct } from '~/types/album'
import type { CatalogImage } from '~/types/catalog'
import { IMAGE_KINDS } from '~/types/album'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Images, LayoutGrid, List, X } from '@lucide/vue'

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

/** The cover the banner shows (the album's first own cover): the viewer has it, opened from the banner, but no thumbnail. */
const bannerCover = computed(() => items.value.find(item => item.kind === 'cover' && !item.product_id && !item.bonus_id && !item.disc_id) ?? null)
const thumbnails = computed(() => items.value.filter(item => item !== bannerCover.value))

type View = 'grid' | 'list'
const view = useCookie<View>('album_gallery_view', { default: () => 'grid', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
if (view.value !== 'grid' && view.value !== 'list') view.value = 'grid'
const views = computed(() => [
  { value: 'grid' as View, label: t('album.gallery.grid'), icon: LayoutGrid },
  { value: 'list' as View, label: t('album.gallery.list'), icon: List },
])

/** Up to this many show at first (two rows of the grid); one more would not be worth a button. */
const COLLAPSED_COUNT: Record<View, number> = { grid: 8, list: 5 }
const collapsible = computed(() => thumbnails.value.length > COLLAPSED_COUNT[view.value] + 1)
const expanded = ref(false)
const shown = computed(() => collapsible.value && !expanded.value ? thumbnails.value.slice(0, COLLAPSED_COUNT[view.value]) : thumbnails.value)

/** "背面 · 初回限定盤": the kind, its label and what it belongs to. */
const describe = (item: Item) => [enumLabel('image_kind', item.kind), item.label, item.scope].filter(Boolean).join(' · ')

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

/** Opens the viewer at the main cover, for the hero image. */
const openCover = () => {
  if (bannerCover.value) open(bannerCover.value.index)
}
defineExpose({ openCover })
</script>
