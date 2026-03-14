<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <Package :size="16" class="text-blue-600" />
      </div>
      <h2 class="text-base font-bold text-gray-900">Products</h2>
      <span v-if="products && products.length > 1" class="ml-auto text-xs text-gray-400">{{ products.length }} 个版本</span>
    </div>

    <!-- Product List -->
    <div v-if="products && products.length" class="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-gray-100">
      <div
        v-for="(product, index) in products"
        :key="product.id"
        class="flex items-center gap-4 px-5 py-4 group hover:bg-gray-50/60 transition-colors border-b border-gray-100"
        :class="{ 'lg:border-b-0': index >= products.length - (products.length % 2 === 0 ? 2 : 1) }"
      >
        <!-- Thumbnail -->
        <div class="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name || 'Product'"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Disc3 :size="22" class="text-gray-300" />
          </div>
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
                v-if="product.edition_type === 'LIMITED'"
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-amber-100 text-amber-700 shrink-0"
              >
                <Lock :size="8" />
                {{ limitedRuleLabel(product.limited_rule) || '限定版' }}
              </span>
              <span
                v-else
                class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-gray-100 text-gray-500 shrink-0"
              >通常版</span>
              <!-- Out of Print -->
              <span
                v-if="!product.is_available"
                class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-gray-200 text-gray-400 shrink-0"
              >绝版</span>
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
          <p v-if="product.edition_type === 'LIMITED' && product.limited_name" class="text-xs text-amber-600/80 leading-snug">
            {{ product.limited_name }}
          </p>

          <!-- Row 4: Medium + Format + Release Date -->
          <div class="flex items-center flex-wrap gap-1.5">
            <!-- Medium -->
            <span :class="mediumStyle(product.medium)" class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full">
              <Wifi v-if="product.medium === 'DIGITAL'" :size="9" />
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
        <p class="text-sm font-semibold text-gray-600">暂无商品信息</p>
        <p class="text-xs text-gray-500 mt-0.5">该作品尚未关联任何商品</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WorkProduct, MediumType, EditionType } from '~/types/work'
import { Disc3, Package, Lock, Wifi, CalendarDays } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  products: WorkProduct[]
}>(), {
  products: () => [],
})

const mediumLabel = (medium: MediumType) => {
  if (medium === 'DIGITAL') return 'Digital';
  return 'Physical';
};

const mediumStyle = (medium: MediumType) => {
  if (medium === 'DIGITAL') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
};

const formatEditionType = (type: EditionType) => {
  if (type === 'LIMITED') return 'Limited Edition';
  return 'Regular Edition';
};

const limitedRuleLabel = (rule: string | null) => {
  const map: Record<string, string> = {
    FIRST_PRESS: '初回限定',
    COUNT: '数量限定',
    PERIOD: '期间限定',
    SHOP: '店铺限定',
    EVENT: '活动限定',
    REGION: '地区限定',
  };
  return rule ? (map[rule] || '') : '';
};

const formattedPrice = (product: WorkProduct) => {
  if (!product.price || !product.currency) return null;
  const numericPrice = parseFloat(product.price);
  if (isNaN(numericPrice)) return `${product.currency} ${product.price}`;
  try {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: product.currency,
      minimumFractionDigits: 0,
    }).format(numericPrice);
  } catch {
    return `${product.currency} ${product.price}`;
  }
};
</script>
