<template>
  <!-- Always there, in the side column: the album's images as a grid of small thumbnails or a list, the choice kept
       in a cookie so the server draws it; past a few, collapsed until expanded. Empty, one line. -->
  <section class="card overflow-hidden">
    <UiSectionTitle :title="$t('album.section.gallery')" :icon="Images" :count="thumbnails.length || undefined" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5">
      <template v-if="thumbnails.length" #actions>
        <UiSegmented v-model="view" :items="views" size="sm" collapse :label="$t('album.gallery.view')" />
      </template>
    </UiSectionTitle>

    <CatalogEmptyLine v-if="!thumbnails.length" :icon="Images" :text="$t('album.empty.gallery')" size="sm" />

    <div v-else class="px-5 pb-4 pt-2">
      <!-- Grid: four a row; the tooltip names each image and glides from one to the next -->
      <div v-if="view === 'grid'" class="grid grid-cols-4 gap-1.5">
        <UiTooltip v-for="item in shown" :key="item.id" group="album-gallery" :text="describe(item)">
          <button type="button" class="group relative aspect-square overflow-hidden rounded-md bg-sunken" @click="open(item.index)">
            <img :src="item.image.thumbnail_url" :alt="altOf(item)" loading="lazy" class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105">
          </button>
        </UiTooltip>
      </div>

      <!-- List: a small thumbnail, the kind, and its label and what it belongs to; hover fills the row (the tracklist's
           fill), zooms the thumbnail as the grid does and turns the name -->
      <ul v-else class="-mx-1 space-y-0.5">
        <li v-for="item in shown" :key="item.id">
          <button type="button" class="group flex w-full min-w-0 items-center gap-3 rounded-lg p-1 pr-2 text-left transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]" @click="open(item.index)">
            <span class="size-10 shrink-0 overflow-hidden rounded-md bg-sunken">
              <img :src="item.image.thumbnail_url" :alt="altOf(item)" loading="lazy" class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105">
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-title transition-colors group-hover:text-primary">{{ enumLabel('image_kind', item.kind) }}</span>
              <span v-if="item.label || item.scope" class="block truncate text-11 text-meta">{{ [item.label, item.scope].filter(Boolean).join(' · ') }}</span>
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

  <CatalogImageViewer v-model:index="index" :items="viewerItems" />
</template>

<script setup lang="ts">
import type { AlbumBonus, AlbumDisc, AlbumImage, AlbumProduct } from '~/types/album'
import type { CatalogImage } from '~/types/catalog'
import { IMAGE_KINDS } from '~/types/album'
import { ChevronDown, ChevronUp, Images, LayoutGrid, List } from '@lucide/vue'

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

/**
 * The main cover and banner, which the hero shows: the viewer has them (the cover opened from the hero) but no
 * thumbnails. Other covers and banners are among the thumbnails.
 */
const bannerCover = computed(() => items.value.find(item => item.kind === 'cover' && item.is_primary) ?? null)
const thumbnails = computed(() => items.value.filter(item => item !== bannerCover.value && !(item.kind === 'banner' && item.is_primary)))

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
/** What the picture is and what its caption says, for readers who can't see it and for image search */
const altOf = (item: Item) => [describe(item), item.caption].filter(Boolean).join(' · ')

const index = ref<number | null>(null)
const viewerItems = computed(() => items.value.map(item => ({ ...item, title: enumLabel('image_kind', item.kind) })))
const open = (at: number) => { index.value = at }

/** Opens the viewer at the main cover, for the hero image. */
const openCover = () => {
  if (bannerCover.value) open(bannerCover.value.index)
}
defineExpose({ openCover })
</script>
