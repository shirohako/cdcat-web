<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <!-- Editions and, under them, the bonuses (特典): one card, each part under its own small heading when both are there. -->
    <UiSectionTitle :title="$t(bonuses.length ? 'album.section.products_bonuses' : 'album.section.products')" :icon="Package" size="sm" class="px-5 pb-2 pt-4 [&_h2]:leading-5">
      <template v-if="counts" #actions>
        <span class="text-xs text-meta">{{ counts }}</span>
      </template>
    </UiSectionTitle>

    <!-- Editions, then bonuses, each a table with a head so editions line up and compare; the rows take a neutral grey
         on hover. Columns nobody fills are left out; on a narrow screen a table scrolls sideways. -->
    <template v-if="products.length">
      <h3 v-if="bonuses.length" class="px-5 pt-2 text-xs font-semibold text-meta">{{ $t('album.section.products') }}</h3>
      <div class="overflow-x-auto px-5 pb-4 pt-1">
        <table class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.products.columns.edition') }}</th>
              <th v-if="columns.catalog" class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.products.columns.catalog') }}</th>
              <th class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.products.columns.format') }}</th>
              <th v-if="columns.discs" class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.products.columns.discs') }}</th>
              <th v-if="columns.region" class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.products.columns.region') }}</th>
              <th v-if="columns.date" class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.products.columns.date') }}</th>
              <th v-if="columns.price" class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta text-right">{{ $t('album.products.columns.price') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07] [&:last-child>td]:border-b-0">
              <td class="border-b border-line px-2.5 py-2 align-middle">
                <div class="flex min-w-48 items-center gap-2.5">
                  <img :src="editionCovers[product.id] || pressedCdImageUrl" :alt="product.name || formatEditionType(product.edition_type)" class="size-8 shrink-0 rounded-md object-cover">
                  <div class="min-w-0">
                    <p class="flex flex-wrap items-center gap-1.5">
                      <span class="font-semibold text-title">{{ product.name || formatEditionType(product.edition_type) }}</span>
                      <span v-if="product.edition_type === 'limited'" class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200">{{ limitedRuleLabel(product.limited_rule) || $t('content_display.limited') }}</span>
                      <span v-if="product.is_hires" class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200">Hi-Res</span>
                      <span v-if="!product.is_available" class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-4 bg-black/[0.05] text-meta dark:bg-white/[0.08]">{{ $t('content_display.out_of_print') }}</span>
                    </p>
                    <p v-if="product.edition_type === 'limited' && product.limited_name" class="mt-0.5 text-[11px] text-meta">{{ product.limited_name }}</p>
                  </div>
                </div>
              </td>
              <td v-if="columns.catalog" class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle font-mono text-xs text-body">{{ product.catalog_number || '—' }}</td>
              <td class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle text-body">{{ [product.format_label, mediumLabel(product.medium)].filter(Boolean).join(' · ') }}</td>
              <td v-if="columns.discs" class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle text-body">{{ product.disc_ids.map(id => discNumbers.get(id)).filter(Boolean).map(n => `Disc ${n}`).join(', ') || '—' }}</td>
              <td v-if="columns.region" class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle text-body">{{ product.region ? regionName(product.region) : '—' }}</td>
              <td v-if="columns.date" class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle tabular-nums text-body">{{ product.release_date ? formatDate(product.release_date, product.release_date_precision) : '—' }}</td>
              <td v-if="columns.price" class="whitespace-nowrap border-b border-line px-2.5 py-2 align-middle text-right font-semibold tabular-nums text-title">{{ formattedPrice(product) || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-if="bonuses.length">
      <h3 class="px-5 pt-3 text-xs font-semibold text-meta" :class="products.length > 0 && 'border-t border-line'">{{ $t('album.section.bonuses') }}</h3>
      <div class="overflow-x-auto px-5 pb-4 pt-1">
        <table class="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.bonuses.columns.bonus') }}</th>
              <th class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.bonuses.columns.type') }}</th>
              <th class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.bonuses.columns.channel') }}</th>
              <th class="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left text-[11px] font-semibold text-meta">{{ $t('album.bonuses.columns.editions') }}</th>
            </tr>
          </thead>
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
                <template v-else>{{ [bonus.shop, bonus.availability && enumLabel('limited_rule', bonus.availability)].filter(Boolean).join(' · ') || '—' }}</template>
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
import { Disc3, Gift, Package } from '@lucide/vue'

const props = withDefaults(defineProps<{
  products?: AlbumProduct[]
  bonuses?: AlbumBonus[]
  discs?: AlbumDisc[]
  images?: AlbumImage[]
}>(), {
  products: () => [],
  bonuses: () => [],
  discs: () => [],
  images: () => [],
})
const { t } = useI18n()
const { separator } = useListPunctuation()
const { intlLocale, regionName } = useLocaleFormatting()
const { formatDate, enumLabel } = useCatalogDisplay()

/** "2 个版本 · 3 项特典" on the title row, each part only when there are several. */
const counts = computed(() => [
  props.products.length > 1 && t('content_display.versions', { count: props.products.length }),
  props.bonuses.length > 1 && t('content_display.bonuses', { count: props.bonuses.length }),
].filter(Boolean).join(' · '))

/** Columns shown only when some edition fills them (the discs one only when the album has several discs). */
const columns = computed(() => ({
  catalog: props.products.some(product => product.catalog_number),
  discs: discNumbers.value.size > 1,
  region: props.products.some(product => product.region),
  date: props.products.some(product => product.release_date),
  price: props.products.some(product => formattedPrice(product)),
}))

const sortedBonuses = computed(() => [...props.bonuses].sort((a, b) => a.sort_order - b.sort_order))
const editionNames = (ids: number[]) => ids
  .map(id => props.products.find(product => product.id === id))
  .filter(Boolean)
  .map(product => product!.name || t(product!.edition_type === 'limited' ? 'content_display.limited' : 'content_display.regular'))
  .join(separator.value)
const bonusImage = (bonusId: number) => props.images.find(image => image.bonus_id === bonusId && image.image)?.image?.thumbnail_url ?? null

const discNumbers = computed(() => new Map(props.discs.map(disc => [disc.id, disc.position])))
/** Covers that belong to one edition, e.g. the regular edition's own jacket. */
const editionCovers = computed(() => Object.fromEntries(props.images
  .filter(image => image.kind === 'cover' && image.product_id && image.image)
  .map(image => [image.product_id, image.image!.thumbnail_url])))
const pressedCdImageUrl = '/images/products/pressed-cd.png'

const mediumLabel = (medium: MediumType) => {
  if (medium === 'digital') return t('content_display.digital');
  return t('content_display.physical');
};


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

const formattedPrice = (product: AlbumProduct) => {
  if (!product.price || !product.currency) return null;
  const numericPrice = parseFloat(product.price);
  if (isNaN(numericPrice)) return `${product.currency} ${product.price}`;
  try {
    return new Intl.NumberFormat(intlLocale.value, {
      style: 'currency',
      currency: product.currency,
      minimumFractionDigits: 0,
    }).format(numericPrice);
  } catch {
    return `${product.currency} ${product.price}`;
  }
};
</script>
