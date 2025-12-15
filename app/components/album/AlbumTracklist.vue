<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <ListMusic :size="24" />
      Tracklist
    </h2>
    <div class="space-y-2">
      <div
        v-for="track in tracks"
        :key="track.id"
        class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded transition cursor-pointer"
      >
        <span class="text-gray-500 font-mono text-sm w-8">{{ track.id }}</span>
        <div class="flex-1">
          <p class="font-medium">{{ track.title }}</p>
          <p class="text-sm text-gray-500">{{ track.artist }}</p>
        </div>
        <span class="text-gray-500 text-sm">{{ track.duration }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ListMusic } from "lucide-vue-next";

defineProps({
  tracks: {
    type: Array,
    required: true,
  },
});
</script>
