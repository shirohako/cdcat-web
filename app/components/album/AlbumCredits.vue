<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <Users :size="24" />
      Credits
    </h2>
    <div class="space-y-3">
      <div
        v-for="(credit, index) in credits"
        :key="index"
        class="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 sm:gap-4 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0"
      >
        <div class="font-semibold text-sm text-gray-600 uppercase tracking-wide">
          {{ credit.role }}
        </div>
        <div class="text-sm text-gray-800 leading-relaxed">
          {{ credit.names }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Users } from "lucide-vue-next";

defineProps({
  credits: {
    type: Array,
    required: true,
  },
});
</script>
