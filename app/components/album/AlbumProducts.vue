<template>
  <section :class="bare ? 'overflow-hidden' : 'card overflow-hidden'">
    <!-- Header; left out when `bare` (the album editor's editions show just the table). -->
    <!-- Editions and, under them, the bonuses (特典): one card, each part under its own small heading when both are there. -->
    <UiSectionTitle v-if="!bare" :title="$t(bonuses.length ? 'album.section.products_bonuses' : 'album.section.products')" :icon="Package" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5" />

    <!-- Editions, then bonuses, each a table without a head, so editions still line up and compare. Editions are filled in freely, so only what each has is a column (type, format) plus the
         price; the rest are tags under the name. On a phone a row wraps into lines (PHONE_ROW). -->
    <template v-if="products.length && !onlyBonuses">
      <h3 v-if="bonuses.length" :class="PART_TITLE" class="pt-1"><Disc3 :size="14" />{{ $t('album.section.products') }}</h3>
      <div class="overflow-x-auto" :class="!bare && ['px-5 pt-1 max-sm:px-3', !bonuses.length && 'pb-5 max-sm:pb-3']">
        <table class="w-full border-separate border-spacing-0 text-13 max-sm:block">
          <!-- An edition is a tbody: its row, and under it the note, as wide as the table. Empty ones keep the blocks apart. -->
          <template v-for="(product, index) in sortedProducts" :key="product.id">
            <tbody v-if="index" aria-hidden="true" class="max-sm:hidden"><tr class="h-1.5"><td /></tr></tbody>
            <tbody
              class="max-sm:block"
              :class="[ROW, rowClass?.(index)]"
              @click="onRowClick($event, index)"
            >
              <tr :class="[PHONE_ROW, product.note && 'sm:[&>td]:pb-1 max-sm:pb-1.5']">
                <td class="px-2.5 py-3 align-middle max-sm:block max-sm:basis-full max-sm:p-0">
                  <div class="flex items-center gap-2.5 sm:min-w-44">
                    <img :src="editionCovers[product.id] || pressedCdImageUrl" :alt="editionName(product, index)" class="size-12 shrink-0 rounded-md object-cover" :class="!editionCovers[product.id] && [PICTURE_TILE, 'p-1']">
                    <div class="min-w-0">
                      <p class="text-15 font-semibold leading-5 text-title">{{ editionName(product, index) }}</p>
                      <!-- Whatever this edition has filled, each fact a tag; the line goes away when none is. -->
                      <div class="mt-1 flex flex-wrap items-center gap-1 empty:hidden">
                        <!-- On a phone the two columns join the tags. -->
                        <span :class="TAG" class="text-body sm:hidden"><component :is="editionIcon(product.edition_type)" :size="12" />{{ formatEditionType(product.edition_type) }}</span>
                        <span :class="TAG" class="text-body sm:hidden"><component :is="mediumIcon(product.medium)" :size="12" />{{ mediumLabel(product.medium) }}</span>
                        <span v-if="product.medium !== 'digital' && product.format_label" :class="TAG" class="text-body"><Disc3 :size="12" />{{ product.format_label }}</span>
                        <span v-if="product.catalog_number" :class="TAG" class="font-mono text-body"><Hash :size="12" />{{ product.catalog_number }}</span>
                        <span v-if="product.region" :class="TAG" class="text-body"><CommonFlag :code="product.region" />{{ regionEnglishName(product.region) }}</span>
                        <span v-if="product.release_date" :class="TAG" class="tabular-nums text-body"><Calendar :size="12" />{{ formatDate(product.release_date, product.release_date_precision) }}</span>
                        <span v-if="discNumbers.size > 1 && discsLabel(product.disc_ids)" :class="TAG" class="text-body"><Layers :size="12" />{{ discsLabel(product.disc_ids) }}</span>
                        <span v-if="product.edition_type === 'limited' && product.limited_rule" :class="LIMITED_TAG"><Hourglass :size="12" />{{ limitedRuleLabel(product.limited_rule) }}</span>
                        <span v-if="product.edition_type === 'limited' && product.limited_name" :class="TAG" class="text-body"><Tag :size="12" />{{ product.limited_name }}</span>
                        <span v-if="product.is_hires" class="inline-flex items-center gap-1 rounded-md bg-violet-100 px-1.5 py-0.5 text-11 leading-4 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200"><AudioLines :size="12" />Hi-Res</span>
                        <span v-if="!product.is_available" :class="TAG" class="text-meta"><CircleOff :size="12" />{{ $t('content_display.out_of_print') }}</span>
                        <!-- On a phone the price goes last among the tags. -->
                        <div class="sm:hidden"><AlbumProductPrice :prices="product.prices" tag /></div>
                      </div>
                    </div>
                  </div>
                </td>
                <!-- Only what every edition has gets a column: its type and what it comes on. -->
                <td class="whitespace-nowrap px-2.5 py-3 align-middle max-sm:hidden"><span :class="TAG" class="text-body"><component :is="editionIcon(product.edition_type)" :size="12" />{{ formatEditionType(product.edition_type) }}</span></td>
                <td class="whitespace-nowrap px-2.5 py-3 align-middle max-sm:hidden"><span :class="TAG" class="text-body"><component :is="mediumIcon(product.medium)" :size="12" />{{ mediumLabel(product.medium) }}</span></td>
                <td class="whitespace-nowrap px-2.5 py-3 align-middle text-right max-sm:hidden"><AlbumProductPrice :prices="product.prices" /></td>
                <td v-if="$slots.actions" class="whitespace-nowrap px-2.5 py-3 align-middle max-sm:ml-auto max-sm:block max-sm:p-0 sm:w-px">
                  <slot name="actions" :index="index" />
                </td>
              </tr>
              <tr v-if="product.note" class="max-sm:block">
                <td :colspan="$slots.actions ? 5 : 4" class="whitespace-pre-line px-2.5 pb-3 text-xs leading-relaxed text-body max-sm:block max-sm:px-3">{{ product.note }}</td>
              </tr>
            </tbody>
          </template>
        </table>
      </div>
    </template>

    <template v-if="bonuses.length">
      <h3 v-if="!bare" :class="[PART_TITLE, products.length ? 'pt-4' : 'pt-1']"><Gift :size="14" />{{ $t('album.section.bonuses') }}</h3>
      <div class="overflow-x-auto" :class="!bare && 'px-5 pb-5 pt-1 max-sm:px-3 max-sm:pb-3'">
        <table class="w-full border-separate border-spacing-0 text-13 max-sm:block">
          <!-- Laid out as the editions are: only the type is a column, the rest tags, the texts as wide as the table. -->
          <template v-for="(bonus, index) in sortedBonuses" :key="bonus.id">
            <tbody v-if="index" aria-hidden="true" class="max-sm:hidden"><tr class="h-1.5"><td /></tr></tbody>
            <tbody
              class="max-sm:block"
              :class="[ROW, rowClass?.(index)]"
              @click="onRowClick($event, index)"
            >
              <tr :class="[PHONE_ROW, (bonus.description || bonus.note) && 'sm:[&>td]:pb-1 max-sm:pb-1.5']">
                <td class="px-2.5 py-3 align-middle max-sm:block max-sm:basis-full max-sm:p-0">
                  <div class="flex items-center gap-2.5 sm:min-w-44">
                    <div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md" :class="PICTURE_TILE">
                      <img v-if="bonusImage(bonus.id)" :src="bonusImage(bonus.id)!" :alt="bonus.name" class="h-full w-full object-cover">
                      <Gift v-else :size="18" class="text-meta" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-15 font-semibold leading-5 text-title">{{ bonus.name || '—' }}</p>
                      <p class="mt-1 flex flex-wrap items-center gap-1 empty:hidden">
                        <!-- On a phone the type joins the tags. -->
                        <span :class="TAG" class="text-body sm:hidden"><Gift :size="12" />{{ enumLabel('bonus_type', bonus.type) }}</span>
                        <span v-if="bonus.is_digital" :class="TAG" class="text-body"><CloudDownload :size="12" />DL</span>
                        <a v-for="discId in bonus.disc_ids" :key="discId" :href="bare ? undefined : `#disc-${discId}`" :class="[TAG, !bare && 'transition-colors hover:text-primary']" class="text-body"><Disc3 :size="12" />Disc {{ discNumbers.get(discId) }}</a>
                        <NuxtLink v-if="bonus.event && !bare" :to="`/albums?event=${bonus.event.id}`" :class="TAG" class="text-body transition-colors hover:text-primary"><CalendarDays :size="12" />{{ bonus.event.name }}</NuxtLink>
                        <span v-else-if="bonus.event" :class="TAG" class="text-body"><CalendarDays :size="12" />{{ bonus.event.name }}</span>
                        <span v-if="bonus.shop" :class="TAG" class="text-body"><Store :size="12" />{{ bonus.shop }}</span>
                        <span v-if="bonus.availability" :class="LIMITED_TAG"><Hourglass :size="12" />{{ enumLabel('limited_rule', bonus.availability) }}</span>
                        <span v-if="bonus.product_ids.length" :class="TAG" class="text-body"><Package :size="12" />{{ editionNames(bonus.product_ids) }}</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td class="w-px whitespace-nowrap px-2.5 py-3 text-right align-middle max-sm:hidden"><span :class="TAG" class="text-body"><Gift :size="12" />{{ enumLabel('bonus_type', bonus.type) }}</span></td>
                <td v-if="$slots.actions" class="whitespace-nowrap px-2.5 py-3 align-middle max-sm:ml-auto max-sm:block max-sm:p-0 sm:w-px">
                  <slot name="actions" :index="index" />
                </td>
              </tr>
              <tr v-if="bonus.description || bonus.note" class="max-sm:block">
                <td :colspan="$slots.actions ? 3 : 2" class="px-2.5 pb-3 max-sm:block max-sm:px-3">
                  <p v-if="bonus.description" class="whitespace-pre-line text-xs leading-relaxed text-body">{{ bonus.description }}</p>
                  <p v-if="bonus.note" class="text-11 leading-relaxed text-meta" :class="bonus.description && 'mt-0.5'">{{ bonus.note }}</p>
                </td>
              </tr>
            </tbody>
          </template>
        </table>
      </div>
    </template>

    <!-- Only when there are neither editions nor bonuses -->
    <CatalogEmptyLine v-if="!products.length && !bonuses.length" :icon="Package" :text="$t('album.empty.products_title')" />
  </section>
</template>

<script setup lang="ts">
import type { AlbumBonus, AlbumDisc, AlbumImage, AlbumProduct, MediumType, EditionType } from '~/types/album'
import { AudioLines, Box, Calendar, CalendarDays, CircleOff, CloudDownload, Disc3, Gem, Gift, Hash, Hourglass, Layers, Package, Store, Tag } from '@lucide/vue'

const TAG = PRODUCT_TAG
/** The grey behind a row's stand-in picture: an edition's default CD, a bonus's gift. */
const PICTURE_TILE = 'bg-black/[0.05] dark:bg-white/[0.08] dark:ring-1 dark:ring-inset dark:ring-line'
/** The one warm tag: see-through, so it takes on the row's grey instead of sitting on it as a pale yellow patch. */
const LIMITED_TAG = 'inline-flex items-center gap-1 rounded-md bg-amber-500/[0.14] px-1.5 py-0.5 text-11 font-medium leading-4 text-amber-800 dark:bg-amber-300/[0.13] dark:text-amber-200 dark:ring-1 dark:ring-inset dark:ring-amber-300/20'
/** The small heading over the editions and over the bonuses, when the card has both. */
const PART_TITLE = 'flex items-center gap-1.5 px-5 pb-1 text-13 font-semibold leading-5 text-title'

const props = withDefaults(defineProps<{
  products?: AlbumProduct[]
  bonuses?: AlbumBonus[]
  discs?: AlbumDisc[]
  images?: AlbumImage[]
  /** Just the tables, without the card and its title (the album editor's editions and bonuses). */
  bare?: boolean
  /** Just the bonuses; `products` only names the editions they come with. */
  onlyBonuses?: boolean
  /** Extra classes for a row, by its place in the list. */
  rowClass?: (index: number) => string | undefined
}>(), {
  products: () => [],
  bonuses: () => [],
  discs: () => [],
  images: () => [],
  rowClass: undefined,
})
const emit = defineEmits<{ rowClick: [index: number] }>()
/**
 * Each row is a block: the card's soft grey on light pages, where the grey tags on it come out as a deeper shade of it,
 * and sunken below the card on dark ones. Table parts can't be rounded, so the cells at the corners do it; an edition can be two rows. On a phone the
 * cells no longer fill the row, so the block itself does.
 */
const ROW = 'sm:[&>tr>td]:bg-[color-mix(in_oklab,var(--card-hover)_40%,oklch(0.985_0_0))] dark:sm:[&>tr>td]:bg-sunken sm:[&>tr>td]:transition-colors sm:[&>tr>td]:duration-150 sm:hover:[&>tr>td]:bg-[color-mix(in_oklab,var(--card-hover),black_5%)] dark:sm:hover:[&>tr>td]:bg-white/[0.08] sm:[&>tr>td:first-child]:pl-3 sm:[&>tr>td:last-child]:pr-3 sm:[&>tr:first-child>td:first-child]:rounded-tl-lg sm:[&>tr:first-child>td:last-child]:rounded-tr-lg sm:[&>tr:last-child>td:first-child]:rounded-bl-lg sm:[&>tr:last-child>td:last-child]:rounded-br-lg max-sm:mb-1.5 max-sm:rounded-lg max-sm:bg-[color-mix(in_oklab,var(--card-hover)_40%,oklch(0.985_0_0))] max-sm:transition-colors max-sm:last:mb-0 dark:max-sm:bg-sunken max-sm:hover:bg-[color-mix(in_oklab,var(--card-hover),black_5%)] dark:max-sm:hover:bg-white/[0.08]'
/** On a phone a row wraps instead of scrolling: the first cell takes a line, the others share the next ones (an edition's price starts under its name). */
const PHONE_ROW = 'max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:gap-x-1.5 max-sm:gap-y-2 max-sm:p-3'
/** A click on the row itself, not on a button or link in it. */
const onRowClick = (event: MouseEvent, index: number) => {
  if (!(event.target as Element).closest('a, button')) emit('rowClick', index)
}
const { t } = useI18n()
const { separator } = useListPunctuation()
const { sorted: sortedPrices } = usePriceDisplay()
const { formatDate, enumLabel } = useCatalogDisplay()

/** Without a name, the first edition goes by its type and the others by their id, the same in every language. */
const editionName = (product: AlbumProduct, index: number) => product.name || (index === 0 ? formatEditionType(product.edition_type) : `Release #${product.id}`)
const sortedProducts = computed(() => props.products.map(product => ({ ...product, prices: sortedPrices(product.prices) })))
const sortedBonuses = computed(() => [...props.bonuses].sort((a, b) => a.sort_order - b.sort_order))
const editionNames = (ids: number[]) => ids
  .map(id => props.products.find(product => String(product.id) === String(id)))
  .filter(Boolean)
  .map(product => editionName(product!, props.products.indexOf(product!)))
  .join(separator.value)
const bonusImage = (bonusId: number) => props.images.find(image => String(image.bonus_id) === String(bonusId) && image.image)?.image?.thumbnail_url ?? null

const discNumbers = computed(() => new Map(props.discs.map(disc => [disc.id, disc.position])))
/** "Disc 1–3" or "Disc 1, 3": an edition's discs, neighbours joined. */
const discsLabel = (discIds: number[]) => {
  const numbers = [...new Set(discIds.map(id => discNumbers.value.get(id)).filter(number => number !== undefined))].sort((a, b) => a - b)
  const runs: Array<[number, number]> = []
  for (const number of numbers) {
    const last = runs.at(-1)
    if (last && last[1] === number - 1) last[1] = number
    else runs.push([number, number])
  }
  return runs.length ? `Disc ${runs.map(([from, to]) => from === to ? from : `${from}–${to}`).join(', ')}` : ''
}
/** Covers that belong to one edition, e.g. the regular edition's own jacket. */
const editionCovers = computed(() => Object.fromEntries(props.images
  .filter(image => image.kind === 'cover' && image.product_id && image.image)
  .map(image => [image.product_id, image.image!.thumbnail_url])))
const pressedCdImageUrl = '/images/products/pressed-cd.png'

const mediumLabel = (medium: MediumType) => {
  if (medium === 'digital') return t('content_display.digital');
  return t('content_display.physical');
};


/** "2CD+BD" says it is physical by itself; 实体版 is left for an edition without a format, 数字版 for every digital one (its "DL" would only repeat it). */
const editionIcon = (type: EditionType) => type === 'limited' ? Gem : Package
const mediumIcon = (medium: MediumType) => medium === 'digital' ? CloudDownload : Box

const formatEditionType = (type: EditionType) => {
  if (type === 'limited') return t('content_display.limited');
  return t('content_display.regular');
};

const limitedRuleLabel = (rule: string | null) => {
  const map: Record<string, string> = {
    first_press: t('content_display.limited_rule.first_press'),
    count: t('content_display.limited_rule.count'),
    period: t('content_display.limited_rule.period'),
    shop: t('content_display.limited_rule.shop'),
    event: t('content_display.limited_rule.event'),
    region: t('content_display.limited_rule.region'),
  };
  return rule ? (map[rule] || '') : '';
};

/** What goes under a lone price: its kind (a list price without a note needs none) and the tax. */
</script>
