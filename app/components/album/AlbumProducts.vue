<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.products')" :icon="Package" class="px-5 pb-2 pt-4">
      <template v-if="products && products.length > 1" #actions>
        <span class="text-xs text-meta">{{ $t('content_display.versions', { count: products.length }) }}</span>
      </template>
    </UiSectionTitle>

    <!-- Product List -->
    <div v-if="products && products.length" class="grid grid-cols-1">
      <div
        v-for="product in products"
        :key="product.id"
        class="group flex items-center gap-4 border-b border-line px-5 py-4 transition-colors duration-150 ease-out last:border-b-0 hover:bg-card-hover"
      >
        <!-- Thumbnail: the edition's own cover when there is one -->
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
          <img
            :src="editionCovers[product.id] || pressedCdImageUrl"
            :alt="product.name || 'Product'"
            class="h-full w-full object-cover"
          >
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 flex flex-col gap-1.5">
          <!-- Row 1: Name + Badges + Price -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center flex-wrap gap-1.5 min-w-0">
              <span class="text-sm font-semibold text-title leading-snug">
                {{ product.name || formatEditionType(product.edition_type) }}
              </span>
              <!-- Edition type badge -->
              <span
                v-if="product.edition_type === 'limited'"
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-amber-100 text-amber-700 shrink-0 dark:bg-amber-400/20 dark:text-amber-200"
              >
                <Lock :size="8" />
                {{ limitedRuleLabel(product.limited_rule) || $t('content_display.limited') }}
              </span>
              <span
                v-else
                class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-btn text-btn-content shrink-0"
              >{{ $t('content_display.regular') }}</span>
              <!-- Out of Print -->
              <span
                v-if="!product.is_available"
                class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-sunken text-meta shrink-0"
              >{{ $t('content_display.out_of_print') }}</span>
            </div>
            <!-- Price -->
            <span v-if="formattedPrice(product)" class="shrink-0 text-sm font-bold text-title tabular-nums">
              {{ formattedPrice(product) }}
            </span>
          </div>

          <!-- Row 2: Catalog Number (always reserve space) -->
          <div class="h-4 flex items-center">
            <span v-if="product.catalog_number" class="font-mono text-[11px] text-meta bg-sunken border border-line px-1.5 py-0.5 rounded leading-none">
              {{ product.catalog_number }}
            </span>
          </div>

          <!-- Row 3: Limited Name -->
          <p v-if="product.edition_type === 'limited' && product.limited_name" class="text-xs text-amber-600/80 leading-snug dark:text-amber-300/80">
            {{ product.limited_name }}
          </p>

          <!-- Row 4: Medium + Format + Release Date -->
          <div class="flex items-center flex-wrap gap-1.5">
            <!-- Medium -->
            <span :class="mediumStyle(product.medium)" class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full">
              <Wifi v-if="product.medium === 'digital'" :size="9" />
              <Disc3 v-else :size="9" />
              {{ mediumLabel(product.medium) }}
            </span>
            <!-- Hi-Res -->
            <span
              v-if="product.is_hires"
              class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-200"
            >Hi-Res</span>
            <!-- Format, e.g. 2CD+BD, and the discs it contains -->
            <span v-if="product.format_label" class="text-xs font-semibold text-body">{{ product.format_label }}</span>
            <span v-if="product.disc_ids.length && discNumbers.size > 1" class="text-[11px] text-meta">
              {{ $t('album.products.contains_discs', { discs: product.disc_ids.map(id => discNumbers.get(id)).filter(Boolean).join(', ') }) }}
            </span>
            <span v-if="product.region" class="text-[11px] text-meta">{{ regionName(product.region) }}</span>
            <!-- Release Date -->
            <span v-if="product.release_date" class="ml-auto flex items-center gap-1 text-[11px] text-meta">
              <CalendarDays :size="11" />
              {{ formatDate(product.release_date, product.release_date_precision) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex items-center justify-center gap-3 py-5 px-6">
      <div class="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center shrink-0">
        <Package :size="15" class="text-faint" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-body">{{ $t('album.empty.products_title') }}</p>
        <p class="text-xs text-meta mt-0.5">{{ $t('album.empty.products_desc') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlbumDisc, AlbumImage, AlbumProduct, MediumType, EditionType } from '~/types/album'
import { Disc3, Package, Lock, Wifi, CalendarDays } from '@lucide/vue'

const props = withDefaults(defineProps<{
  products?: AlbumProduct[]
  discs?: AlbumDisc[]
  images?: AlbumImage[]
}>(), {
  products: () => [],
  discs: () => [],
  images: () => [],
})
const { t } = useI18n()
const { intlLocale, regionName } = useLocaleFormatting()
const { formatDate } = useCatalogDisplay()

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

const mediumStyle = (medium: MediumType) => {
  if (medium === 'digital') return 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200';
  return 'bg-btn text-btn-content';
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
