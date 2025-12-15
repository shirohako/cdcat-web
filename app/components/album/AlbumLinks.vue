<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
      <Link2 :size="20" />
      Links
    </h3>
    <p class="text-gray-500 text-sm">No links available.</p>
  </section>
</template>

<script setup>
import { Link2 } from "lucide-vue-next";
</script>