<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-5 flex items-center gap-2">
      <Disc3 :size="24" />
      Products
    </h2>

    <div v-if="products && products.length" class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
      <div
        v-for="product in products"
        :key="product.id"
        class="flex items-center gap-3.5 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200"
      >
        <!-- Thumbnail -->
        <div class="w-12 h-12 rounded-md bg-gray-100 overflow-hidden shrink-0">
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.edition_name || 'Product'"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Disc3 :size="20" class="text-gray-300" />
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <!-- Line 1: Title + Limited -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <h3 class="text-sm font-semibold text-gray-900 leading-snug">
              {{ product.edition_name || formatEditionType(product.edition_type) }}
            </h3>
            <span
              v-if="product.is_limited"
              class="px-1.5 py-px text-[9px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-700"
            >Limited</span>
          </div>
          <!-- Line 2: Medium + Catalog Number -->
          <div class="flex items-center gap-1.5 mt-1">
            <span :class="mediumStyle(product.medium)" class="px-1.5 py-px text-[9px] font-bold uppercase tracking-wider rounded-full">
              {{ mediumLabel(product.medium) }}
            </span>
            <span v-if="product.catalog_number" class="font-mono text-[11px] text-gray-400">{{ product.catalog_number }}</span>
          </div>
          <!-- Line 3: Format + Badges + Price -->
          <div class="flex items-center gap-1.5 mt-1 flex-wrap">
            <span v-if="product.format" class="text-xs text-gray-500 font-medium">{{ product.format }}</span>
            <span
              v-if="product.is_hires"
              class="px-1.5 py-px text-[9px] font-bold uppercase tracking-wider rounded-full bg-violet-100 text-violet-700"
            >Hi-Res</span>
            <span
              v-if="!product.is_available"
              class="px-1.5 py-px text-[9px] font-bold uppercase tracking-wider rounded-full bg-gray-200 text-gray-500"
            >Out of Print</span>
            <span v-if="formattedPrice(product)" class="ml-auto text-sm font-bold text-gray-900">
              {{ formattedPrice(product) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-gray-500">No product information available.</p>
  </section>
</template>

<script setup>
import { Disc3 } from "lucide-vue-next";

defineProps({
  products: {
    type: Array,
    default: () => [],
  },
});

const mediumLabel = (medium) => {
  const map = {
    physical: "Physical",
    digital: "Digital",
    streaming: "Streaming",
  };
  return map[medium] || medium || "Physical";
};

const mediumStyle = (medium) => {
  const map = {
    physical: "bg-gray-100 text-gray-600",
    digital: "bg-blue-100 text-blue-700",
    streaming: "bg-green-100 text-green-700",
  };
  return map[medium] || "bg-gray-100 text-gray-600";
};

const formatEditionType = (type) => {
  const map = {
    REGULAR: "Regular Edition",
    LIMITED: "Limited Edition",
    FIRST_PRESS: "First Press Edition",
  };
  return map[type] || type || "Standard";
};

const formattedPrice = (product) => {
  if (!product.prices) return null;
  if (typeof product.prices === "string") return product.prices;
  if (typeof product.prices === "object") {
    const entries = Object.entries(product.prices);
    if (entries.length === 0) return null;
    const [currency, amount] = entries[0];
    if (currency === "JPY" || currency === "jpy") return `¥${Number(amount).toLocaleString()}`;
    if (currency === "USD" || currency === "usd") return `$${Number(amount).toFixed(2)}`;
    if (currency === "CNY" || currency === "cny") return `¥${Number(amount).toFixed(2)}`;
    return `${currency.toUpperCase()} ${amount}`;
  }
  return null;
};

</script>
