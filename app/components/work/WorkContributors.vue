<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
        <Database :size="15" class="text-teal-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('work.section.contributors') }}</h2>
      <span v-if="contributors.length > 0" class="ml-auto text-xs text-gray-400">{{ contributors.length }} 位</span>
    </div>

    <!-- Contributor list -->
    <div v-if="contributors.length > 0" class="px-5 py-3 flex flex-wrap gap-3">
      <NuxtLink
        v-for="user in contributors"
        :key="user.username"
        :to="`/profile/${user.username}`"
        class="flex flex-col items-center gap-1.5 group"
        :title="user.nickname || user.username"
      >
        <!-- Avatar -->
        <div class="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-violet-300 group-hover:ring-offset-1 transition-all">
          <img
            v-if="user.avatar"
            :src="user.avatar"
            :alt="user.nickname || user.username"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-sm font-bold text-gray-400">
            {{ (user.nickname || user.username || '?').charAt(0).toUpperCase() }}
          </span>
        </div>
        <!-- Name -->
        <span class="text-[10px] text-gray-500 group-hover:text-teal-600 transition-colors max-w-14 truncate text-center leading-none">
          {{ user.nickname || user.username }}
        </span>
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-5">
      <div class="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
        <Database :size="15" class="text-teal-300" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-500">{{ $t('work.empty.contributors_title') }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ $t('work.empty.contributors_desc') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Database } from 'lucide-vue-next';

defineProps({
  contributors: {
    type: Array,
    default: () => [],
  },
});
</script>
