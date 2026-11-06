<template>
  <section :class="bare ? 'overflow-hidden' : 'card overflow-hidden'">
    <!-- Header; left out when `bare` (the edition editor's preview shows just the table). -->
    <!-- Editions and, under them, the bonuses (特典): one card, each part under its own small heading when both are there. -->
    <UiSectionTitle v-if="!bare" :title="$t(bonuses.length ? 'album.section.products_bonuses' : 'album.section.products')" :icon="Package" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5">
      <template v-if="counts" #actions>
        <span class="text-xs text-meta">{{ counts }}</span>
      </template>
    </UiSectionTitle>

    <!-- Editions, then bonuses, each a table without a head, so editions still line up and compare; the rows take a
         neutral grey on hover. An edition has too many facts for a column each, so they pair up on two lines: the catalog number under
         the name, the discs under the format, the date under the region, the price's kind under the amount. Columns nobody
         fills are left out; on a phone a table scrolls sideways. -->
    <template v-if="products.length">
      <h3 v-if="bonuses.length" class="px-5 pt-2 text-xs font-semibold text-meta">{{ $t('album.section.products') }}</h3>
      <div class="overflow-x-auto px-5 pt-1" :class="bare ? 'pb-1' : 'pb-4'">
        <table class="w-full border-collapse text-[13px]">
          <tbody>
            <tr v-for="product in sortedProducts" :key="product.id" class="transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07] [&:last-child>td]:border-b-0">
              <td class="border-b border-line px-2.5 py-2.5 align-top">
                <div class="flex min-w-44 items-start gap-2.5">
                  <img :src="editionCovers[product.id] || pressedCdImageUrl" :alt="product.name || formatEditionType(product.edition_type)" class="size-10 shrink-0 rounded-md object-cover">
                  <div class="min-w-0">
                    <p class="flex flex-wrap items-center gap-1.5">
                      <span class="font-semibold text-title">{{ product.name || formatEditionType(product.edition_type) }}</span>
                      <span v-if="product.edition_type === 'limited'" class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200">{{ limitedRuleLabel(product.limited_rule) || $t('content_display.limited') }}</span>
                      <span v-if="product.is_hires" class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200">Hi-Res</span>
                      <span v-if="!product.is_available" class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-black/[0.05] text-meta dark:bg-white/[0.08]">{{ $t('content_display.out_of_print') }}</span>
                    </p>
                    <p v-if="product.catalog_number" class="mt-0.5 font-mono text-xs text-meta">{{ product.catalog_number }}</p>
                    <p v-if="product.edition_type === 'limited' && product.limited_name" class="mt-0.5 text-[11px] text-meta">{{ product.limited_name }}</p>
                    <p v-if="product.note" class="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-body">{{ product.note }}</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap border-b border-line px-2.5 py-2.5 align-top text-body">
                {{ formatLabel(product) }}
                <p v-if="columns.discs && discsLabel(product.disc_ids)" class="mt-0.5 text-xs text-meta">{{ discsLabel(product.disc_ids) }}</p>
              </td>
              <td v-if="columns.region || columns.date" class="whitespace-nowrap border-b border-line px-2.5 py-2.5 align-top text-body">
                <!-- Flag + English name; long names ("United Arab Emirates") are cut at the column's width and shown whole on hover. -->
                <template v-if="product.region">
                  <UiTooltip v-if="regionEnglishName(product.region).length > LONG_REGION" :text="regionEnglishName(product.region)">
                    <span class="flex max-w-36 items-center gap-1.5"><CommonFlag :code="product.region" /><span class="min-w-0 truncate">{{ regionEnglishName(product.region) }}</span></span>
                  </UiTooltip>
                  <span v-else class="flex items-center gap-1.5"><CommonFlag :code="product.region" />{{ regionEnglishName(product.region) }}</span>
                </template>
                <p v-if="product.release_date" class="text-xs tabular-nums text-meta" :class="product.region && 'mt-0.5'">{{ formatDate(product.release_date, product.release_date_precision) }}</p>
              </td>
              <td v-if="columns.price" class="whitespace-nowrap border-b border-line px-2.5 py-2.5 align-top text-right">
                <!-- Several prices keep the cell one line: the first in display order, and all of them behind a button. -->
                <div v-if="product.prices.length > 1" class="flex items-center justify-end gap-2">
                  <span class="font-semibold tabular-nums text-title">{{ priceAmount(product.prices[0]!) }}</span>
                  <UiPopover placement="bottom-end" :label="$t('album.products.all_prices')" class="w-max p-3!">
                    <template #trigger="{ toggle, attrs }">
                      <UiButton size="xs" v-bind="attrs" @click="toggle">{{ $t('album.products.all_prices_count', { count: product.prices.length }) }}</UiButton>
                    </template>
                    <table class="text-[13px]">
                      <tbody>
                        <tr v-for="(price, i) in product.prices" :key="i">
                          <td class="max-w-48 py-0.5 pr-4 text-xs text-meta">{{ priceLabel(price) }}</td>
                          <td class="whitespace-nowrap py-0.5 text-right font-semibold tabular-nums text-title">{{ priceAmount(price) }}</td>
                          <td v-if="product.prices.some(item => item.tax_included !== null)" class="whitespace-nowrap py-0.5 pl-2 text-[11px] text-meta">{{ price.tax_included === null ? '' : taxLabel(price.tax_included) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </UiPopover>
                </div>
                <template v-else-if="product.prices[0]">
                  <p class="font-semibold tabular-nums text-title">{{ priceAmount(product.prices[0]) }}</p>
                  <p v-if="priceNote(product.prices[0])" class="ml-auto mt-0.5 max-w-40 whitespace-normal text-[11px] text-meta">{{ priceNote(product.prices[0]) }}</p>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-if="bonuses.length">
      <h3 class="px-5 pt-3 text-xs font-semibold text-meta" :class="products.length > 0 && 'border-t border-line'">{{ $t('album.section.bonuses') }}</h3>
      <div class="overflow-x-auto px-5 pb-4 pt-1">
        <table class="w-full border-collapse text-[13px]">
          <tbody>
            <tr v-for="bonus in sortedBonuses" :key="bonus.id" class="transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07] [&:last-child>td]:border-b-0">
              <td class="border-b border-line px-2.5 py-2 align-middle">
                <div class="flex min-w-48 items-center gap-2.5">
                  <div class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sunken">
                    <img v-if="bonusImage(bonus.id)" :src="bonusImage(bonus.id)!" :alt="bonus.name" class="h-full w-full object-cover">
                    <Gift v-else :size="15" class="text-meta" />
                  </div>
                  <div class="min-w-0">
                    <p class="flex flex-wrap items-center gap-1.5">
                      <span class="font-semibold text-title">{{ bonus.name }}</span>
                      <span v-if="bonus.is_digital" class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200">DL</span>
                      <a v-for="discId in bonus.disc_ids" :key="discId" :href="`#disc-${discId}`" class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-black/[0.05] text-meta dark:bg-white/[0.08] hover:text-primary">
                        <Disc3 :size="10" />Disc {{ discNumbers.get(discId) }}
                      </a>
                    </p>
                    <p v-if="bonus.description" class="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-body">{{ bonus.description }}</p>
                    <p v-if="bonus.note" class="mt-0.5 text-[11px] text-meta">{{ bonus.note }}</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle"><span class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-pink-100 text-pink-700 dark:bg-pink-400/20 dark:text-pink-200">{{ enumLabel('bonus_type', bonus.type) }}</span></td>
              <td class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle text-body">
                <NuxtLink v-if="bonus.event" :to="`/albums?event=${bonus.event.id}`" class="transition-colors hover:text-primary">{{ bonus.event.name }}</NuxtLink>
                <template v-else>{{ [bonus.shop, bonus.availability && enumLabel('limited_rule', bonus.availability)].filter(Boolean).join(' · ') }}</template>
              </td>
              <td class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle text-body">{{ bonus.product_ids.length ? editionNames(bonus.product_ids) : $t('album.bonuses.all_editions') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Only when there are neither editions nor bonuses -->
    <CatalogEmptyLine v-if="!products.length && !bonuses.length" :icon="Package" :text="$t('album.empty.products_title')" />
  </section>
</template>

<script setup lang="ts">
import type { AlbumBonus, AlbumDisc, AlbumImage, AlbumProduct, MediumType, EditionType } from '~/types/album'
import type { ProductPrice } from '~/types/document'
import { Disc3, Gift, Package } from '@lucide/vue'

/** Region names longer than this get cut with a tooltip, so one long name does not widen the table. */
const LONG_REGION = 16

const props = withDefaults(defineProps<{
  products?: AlbumProduct[]
  bonuses?: AlbumBonus[]
  discs?: AlbumDisc[]
  images?: AlbumImage[]
  /** Just the tables, without the card and its title (the edition editor's live preview). */
  bare?: boolean
}>(), {
  products: () => [],
  bonuses: () => [],
  discs: () => [],
  images: () => [],
})
const { t } = useI18n()
const { separator } = useListPunctuation()
const { label: priceLabel, amount: priceAmount, taxLabel, sorted: sortedPrices } = usePriceDisplay()
const { formatDate, enumLabel } = useCatalogDisplay()

/** "2 个版本 · 3 项特典" on the title row, each part only when there are several. */
const counts = computed(() => [
  props.products.length > 1 && t('content_display.versions', { count: props.products.length }),
  props.bonuses.length > 1 && t('content_display.bonuses', { count: props.bonuses.length }),
].filter(Boolean).join(' · '))

/** Columns shown only when some edition fills them; `discs` is a line, only when the album has several discs. */
const columns = computed(() => ({
  discs: discNumbers.value.size > 1,
  region: props.products.some(product => product.region),
  date: props.products.some(product => product.release_date),
  price: props.products.some(product => product.prices.length),
}))

const sortedProducts = computed(() => props.products.map(product => ({ ...product, prices: sortedPrices(product.prices) })))
const sortedBonuses = computed(() => [...props.bonuses].sort((a, b) => a.sort_order - b.sort_order))
const editionNames = (ids: number[]) => ids
  .map(id => props.products.find(product => product.id === id))
  .filter(Boolean)
  .map(product => product!.name || t(product!.edition_type === 'limited' ? 'content_display.limited' : 'content_display.regular'))
  .join(separator.value)
const bonusImage = (bonusId: number) => props.images.find(image => image.bonus_id === bonusId && image.image)?.image?.thumbnail_url ?? null

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
const formatLabel = (product: AlbumProduct) => (product.medium !== 'digital' && product.format_label) || mediumLabel(product.medium);

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
const priceNote = (price: ProductPrice) => [
  (price.kind !== 'list' || price.note) && priceLabel(price),
  price.tax_included !== null && taxLabel(price.tax_included),
].filter(Boolean).join(' · ')
</script>
