<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
        <Users :size="16" class="text-violet-600" />
      </div>
      <h2 class="text-base font-bold text-gray-900">Credits</h2>
    </div>

    <!-- Credits Table -->
    <div v-if="credits && credits.length">
      <div
        v-for="(item, index) in credits"
        :key="index"
        class="grid grid-cols-[160px_1fr] group hover:bg-violet-50/40 transition-colors"
        :class="index < credits.length - 1 ? 'border-b border-gray-50' : ''"
      >
        <!-- Role Column -->
        <div class="px-6 py-3.5 flex items-start border-r border-gray-100">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide"
            :class="roleStyle(item.role)"
          >
            {{ item.role }}
          </span>
        </div>

        <!-- Artists Column -->
        <div class="px-5 py-2.5 flex flex-wrap gap-1.5">
          <template v-for="(artist, i) in item.artists" :key="i">
            <NuxtLink
              v-if="artist.artist_id"
              :to="`/artists/${artist.artist_id}`"
              class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-violet-100 hover:text-violet-700 transition-colors"
            >{{ artist.name }}</NuxtLink>
            <span v-else class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">{{ artist.name }}</span>
          </template>
        </div>
      </div>
    </div>

    <p v-else class="px-6 py-10 text-sm text-gray-400 text-center">暂无制作人员信息。</p>
  </section>
</template>

<script setup lang="ts">
import type { WorkCreditGroup } from '~/types/work'
import { Users } from "lucide-vue-next"

withDefaults(defineProps<{
  credits: WorkCreditGroup[]
}>(), {
  credits: () => [],
})

const roleColors = [
  'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
  'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
  'bg-pink-50 text-pink-600 ring-1 ring-pink-100',
  'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  'bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100',
  'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
  'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100',
];

const roleColorMap = new Map();
let colorIndex = 0;

const roleStyle = (role) => {
  if (!roleColorMap.has(role)) {
    roleColorMap.set(role, roleColors[colorIndex % roleColors.length]);
    colorIndex++;
  }
  return roleColorMap.get(role);
};
</script>
