<template>
  <section class="bg-white rounded-lg border-2 border-blue-500 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <FileText :size="24" />
      Descriptions
    </h2>
    <div class="space-y-4">
      <!-- Slogan -->
      <div v-if="slogan" class="border-l-2 border-blue-400 pl-4 py-1">
        <p class="text-base md:text-lg font-medium text-gray-800 leading-relaxed">
          {{ slogan }}
        </p>
      </div>

      <!-- Main Descriptions -->
      <div class="text-gray-700 space-y-2 text-sm leading-relaxed">
        <p v-for="(paragraph, index) in descriptions" :key="index">
          {{ paragraph }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { FileText } from "lucide-vue-next";

defineProps({
  slogan: {
    type: String,
    default: "",
  },
  descriptions: {
    type: Array,
    required: true,
  },
});
</script>
