<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-5 flex items-center gap-2">
      <Gift :size="24" />
      Bonuses
    </h2>

    <div v-if="bonuses && bonuses.length" class="space-y-3">
      <div
        v-for="bonus in bonuses"
        :key="bonus.id"
        class="flex gap-3.5 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200"
      >
        <!-- Image -->
        <div class="w-16 h-16 rounded-md bg-gray-100 overflow-hidden shrink-0">
          <img
            v-if="bonus.image_url"
            :src="bonus.image_url"
            :alt="bonus.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <component :is="getBonusIcon(bonus.type)" :size="22" class="text-gray-300" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-sm font-semibold text-gray-900 leading-snug">
              {{ bonus.name }}
            </h3>
            <span
              class="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full"
              :class="getBonusTypeStyle(bonus.type)"
            >
              {{ formatBonusType(bonus.type) }}
            </span>
          </div>

          <p v-if="bonus.description" class="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {{ bonus.description }}
          </p>

          <!-- Associated product -->
          <p v-if="bonus.product" class="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
            <Disc3 :size="11" />
            {{ bonus.product.edition_name || formatEditionType(bonus.product.edition_type) }}
          </p>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-gray-500">No bonus information available.</p>
  </section>
</template>

<script setup>
import {
  Gift,
  Disc3,
  Music,
  Film,
  Image,
  Ticket,
  Download,
  Package,
} from "lucide-vue-next";

defineProps({
  bonuses: {
    type: Array,
    default: () => [],
  },
});

const getBonusIcon = (type) => {
  const map = {
    bonus_track: Music,
    bonus_disc: Disc3,
    dvd: Film,
    blu_ray: Film,
    photocard: Image,
    poster: Image,
    event_ticket: Ticket,
    download_code: Download,
    goods: Package,
  };
  return map[type] || Gift;
};

const getBonusTypeStyle = (type) => {
  const map = {
    bonus_track: "bg-blue-100 text-blue-700",
    bonus_disc: "bg-indigo-100 text-indigo-700",
    dvd: "bg-red-100 text-red-700",
    blu_ray: "bg-sky-100 text-sky-700",
    photocard: "bg-pink-100 text-pink-700",
    poster: "bg-purple-100 text-purple-700",
    event_ticket: "bg-amber-100 text-amber-700",
    download_code: "bg-green-100 text-green-700",
    goods: "bg-orange-100 text-orange-700",
  };
  return map[type] || "bg-gray-100 text-gray-700";
};

const formatBonusType = (type) => {
  if (!type) return "Bonus";
  return type.replace(/_/g, " ");
};

const formatEditionType = (type) => {
  const map = {
    REGULAR: "Regular Edition",
    LIMITED: "Limited Edition",
    FIRST_PRESS: "First Press Edition",
  };
  return map[type] || type || "Standard";
};
</script>
