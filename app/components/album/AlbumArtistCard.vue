<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
      <BookOpen :size="20" />
      About Artist
    </h3>
    <div class="text-center">
      <div
        class="w-24 h-24 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center"
      >
        <img
          v-if="avatar"
          :src="avatar"
          :alt="name"
          class="w-full h-full rounded-full object-cover"
        />
        <span v-else class="text-4xl text-gray-400">#</span>
      </div>
      <h4 class="font-bold text-lg mb-1">{{ name }}</h4>
      <p class="text-sm text-gray-500 mb-4">Since：{{ since }}</p>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div class="text-2xl font-bold">{{ discography }}</div>
          <div class="text-xs text-gray-500">Discography</div>
        </div>
        <div>
          <div class="text-2xl font-bold">{{ creditsCount }}</div>
          <div class="text-xs text-gray-500">Credits</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { BookOpen } from "lucide-vue-next";

defineProps({
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  since: {
    type: String,
    required: true,
  },
  discography: {
    type: Number,
    required: true,
  },
  creditsCount: {
    type: Number,
    required: true,
  },
  categories: {
    type: String,
    default: "",
  },
  extra: {
    type: String,
    default: "",
  },
});
</script>
