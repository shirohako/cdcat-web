<template>
  <div class="bg-white rounded-2xl shadow-sm p-5 text-center">
    <NuxtLink :to="`/profile/${author.username}`" class="group">
      <div class="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center overflow-hidden mx-auto mb-3
                  ring-4 ring-violet-100 group-hover:ring-violet-300 transition-all duration-200">
        <img v-if="author.avatar" :src="author.avatar" :alt="author.nickname" class="w-full h-full object-cover" />
        <UserRound v-else :size="28" class="text-violet-400" />
      </div>
      <p class="font-semibold text-gray-800 group-hover:text-violet-600 transition-colors text-sm">
        {{ author.nickname || author.username }}
      </p>
      <p class="text-xs text-gray-400 mt-0.5">@{{ author.username }}</p>
    </NuxtLink>
  </div>
</template>

<script setup>
import { UserRound } from "lucide-vue-next";

defineProps({
  author: { type: Object, required: true },
});
</script>
