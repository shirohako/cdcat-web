<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
      <Users :size="20" />
      Artists
    </h3>
    <div v-if="artists.length === 0" class="text-sm text-gray-500">
      暂无艺术家信息
    </div>
    <ul v-else class="space-y-3">
      <li v-for="artist in artists" :key="artist.id">
        <NuxtLink
          :to="`/artists/${artist.id}`"
          class="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
        >
          <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
            <img
              v-if="artist.avatar"
              :src="artist.avatar"
              :alt="artist.displayName || artist.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-sm font-semibold text-gray-400">
              {{ artist.displayName?.slice(0, 1) || artist.name?.slice(0, 1) || '?' }}
            </span>
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-gray-800 truncate">
              {{ artist.displayName || artist.name }}
            </div>
            <div v-if="artist.displayName && artist.displayName !== artist.name" class="text-xs text-gray-500 truncate">
              {{ artist.name }}
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { Users } from "lucide-vue-next";

defineProps({
  artists: {
    type: Array,
    required: true,
  },
});
</script>
