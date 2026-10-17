<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <Package :size="16" class="text-blue-600" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('album.section.products') }}</h2>
      <span v-if="products && products.length > 1" class="ml-auto text-xs text-gray-400">{{ $t('content_display.versions', { count: products.length }) }}</span>
    </div>

    <!-- Product List -->
    <div v-if="products && products.length" class="grid grid-cols-1">
      <div
        v-for="product in products"
        :key="product.id"
        class="group flex items-center gap-4 border-b border-gray-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-gray-50/60"
      >
        <!-- Thumbnail -->
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100">
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name || 'Product'"
            class="w-full h-full object-cover"
          >
          <img
            v-else
            :src="pressedCdImageUrl"
            :alt="product.name || 'Product'"
            class="h-full w-full object-cover"
          >
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 flex flex-col gap-1.5">
          <!-- Row 1: Name + Badges + Price -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center flex-wrap gap-1.5 min-w-0">
              <span class="text-sm font-semibold text-gray-900 leading-snug">
                {{ product.name || formatEditionType(product.edition_type) }}
              </span>
              <!-- Edition type badge -->
              <span
                v-if="product.edition_type === 'limited'"
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-amber-100 text-amber-700 shrink-0"
              >
                <Lock :size="8" />
                {{ limitedRuleLabel(product.limited_rule) || $t('content_display.limited') }}
              </span>
              <span
                v-else
                class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-gray-100 text-gray-500 shrink-0"
              >{{ $t('content_display.regular') }}</span>
              <!-- Out of Print -->
              <span
                v-if="!product.is_available"
                class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-gray-200 text-gray-400 shrink-0"
              >{{ $t('content_display.out_of_print') }}</span>
            </div>
            <!-- Price -->
            <span v-if="formattedPrice(product)" class="shrink-0 text-sm font-bold text-gray-800 tabular-nums">
              {{ formattedPrice(product) }}
            </span>
          </div>

          <!-- Row 2: Catalog Number (always reserve space) -->
          <div class="h-4 flex items-center">
            <span v-if="product.catalog_number" class="font-mono text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded leading-none">
              {{ product.catalog_number }}
            </span>
          </div>

          <!-- Row 3: Limited Name -->
          <p v-if="product.edition_type === 'limited' && product.limited_name" class="text-xs text-amber-600/80 leading-snug">
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
              class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-violet-100 text-violet-700"
            >Hi-Res</span>
            <!-- Format -->
            <span v-if="product.format" class="text-xs text-gray-500">{{ product.format }}</span>
            <!-- Release Date -->
            <span v-if="product.release_date" class="ml-auto flex items-center gap-1 text-[11px] text-gray-400">
              <CalendarDays :size="11" />
              {{ product.release_date }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex items-center justify-center gap-3 py-5 px-6">
      <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <Package :size="15" class="text-blue-400" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-600">{{ $t('album.empty.products_title') }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ $t('album.empty.products_desc') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlbumProduct, MediumType, EditionType } from '~/types/album'
import { Disc3, Package, Lock, Wifi, CalendarDays } from '@lucide/vue'

const props = withDefaults(defineProps<{
  products: AlbumProduct[]
}>(), {
  products: () => [],
})
const { t } = useI18n()
const { intlLocale } = useLocaleFormatting()
const pressedCdImageUrl = '/images/products/pressed-cd.png'

const mediumLabel = (medium: MediumType) => {
  if (medium === 'digital') return t('content_display.digital');
  return t('content_display.physical');
};

const mediumStyle = (medium: MediumType) => {
  if (medium === 'digital') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
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
