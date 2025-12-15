<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <Star :size="24" />
      Reviews
    </h2>
    <p class="text-gray-500 text-sm">No reviews yet.</p>
  </section>
</template>

<script setup>
import { Star } from "lucide-vue-next";
</script>