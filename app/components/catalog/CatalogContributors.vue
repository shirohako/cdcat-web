<template>
  <section class="card overflow-hidden">
    <!-- Header -->
    <UiSectionTitle :title="$t('album.section.contributors')" :icon="Database" class="px-5 pb-2 pt-4">
      <template v-if="contributors.length > 0" #actions>
        <span class="text-xs text-meta">{{ $t('content_display.contributors', { count: contributors.length }) }}</span>
      </template>
    </UiSectionTitle>

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
        <div class="w-9 h-9 rounded-full overflow-hidden bg-sunken border border-line flex items-center justify-center shrink-0 transition-shadow duration-150 ease-out group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-1 group-hover:ring-offset-card">
          <img
            v-if="user.avatar_url"
            :src="user.avatar_url"
            :alt="user.nickname || user.username"
            class="w-full h-full object-cover"
          >
          <span v-else class="text-sm font-bold text-meta">
            {{ (user.nickname || user.username || '?').charAt(0).toUpperCase() }}
          </span>
        </div>
        <!-- Name -->
        <span class="text-[10px] text-meta group-hover:text-primary transition-colors max-w-14 truncate text-center leading-none">
          {{ user.nickname || user.username }}
        </span>
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div v-else class="flex items-center justify-center gap-3 py-5 px-5">
      <div class="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center shrink-0">
        <Database :size="15" class="text-faint" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-meta">{{ $t('album.empty.contributors_title') }}</p>
        <p class="text-xs text-meta mt-0.5">{{ $t('album.empty.contributors_desc') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Database } from '@lucide/vue';

defineProps({
  contributors: {
    type: Array,
    default: () => [],
  },
});
</script>
