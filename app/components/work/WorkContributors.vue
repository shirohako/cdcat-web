<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
      <Database :size="20" />
      Data Contributors
    </h3>
    <p class="text-gray-500 text-sm">No contributors yet.</p>
  </section>
</template>

<script setup>
import { Database } from "lucide-vue-next";
</script>