<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
      <BarChart3 :size="20" />
      Stats
    </h3>
    <div class="space-y-3">
      <div class="flex justify-between">
        <span class="text-gray-600">Viewed:</span>
        <span class="font-bold">{{ stats.viewed }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">Liked:</span>
        <span class="font-bold">{{ stats.liked }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">Owned:</span>
        <span class="font-bold">{{ stats.owned }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">In Wishlist:</span>
        <span class="font-bold">{{ stats.wishlist }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { BarChart3 } from "lucide-vue-next";

defineProps({
  stats: {
    type: Object,
    required: true,
  },
});
</script>
