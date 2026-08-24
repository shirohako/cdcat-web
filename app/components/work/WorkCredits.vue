<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
        <Users :size="16" class="text-violet-600" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('work.section.credits') }}</h2>
    </div>

    <!-- Credits Table -->
    <div v-if="credits && credits.length" class="space-y-2 p-2 sm:space-y-0 sm:p-0">
      <div
        v-for="(item, index) in credits"
        :key="index"
        class="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-100 sm:grid-cols-[140px_minmax(0,1fr)] sm:rounded-none sm:border-x-0 sm:border-t-0"
        :class="index === credits.length - 1 ? 'sm:border-b-0' : ''"
      >
        <!-- Role Column -->
        <div
          class="flex min-w-0 items-center gap-2 border-b px-4 py-2.5 sm:border-b-0 sm:border-r sm:px-5 sm:py-3.5"
          :class="getWorkRolePalette(item.role).label"
        >
          <Tag :size="14" class="shrink-0 opacity-60" />
          <span class="min-w-0 wrap-break-word text-left text-xs font-semibold leading-4 tracking-wide">
            {{ item.role }}
          </span>
        </div>

        <!-- Artists Column -->
        <div class="flex min-w-0 flex-wrap gap-1.5 px-4 pb-3.5 pt-2.5 sm:px-5 sm:py-2.5">
          <template v-for="(artist, i) in item.artists" :key="i">
            <NuxtLink
              v-if="artist.artist_id"
              :to="`/artists/${artist.artist_id}`"
              class="inline-flex max-w-full items-center wrap-break-word rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium leading-5 text-gray-700 transition-colors"
              :class="getWorkRolePalette(item.role).personHover"
            >{{ artist.name }}</NuxtLink>
            <span v-else class="inline-flex max-w-full items-center wrap-break-word rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium leading-5 text-gray-700">{{ artist.name }}</span>
          </template>
        </div>
      </div>
    </div>

    <p v-else class="px-4 py-10 text-center text-sm text-gray-400 sm:px-6">{{ $t('work.empty.credits') }}</p>
  </section>
</template>

<script setup lang="ts">
import type { WorkCreditGroup } from '~/types/work'
import { Tag, Users } from "@lucide/vue"
import { getWorkRolePalette } from '~/utils/workRolePalette'

withDefaults(defineProps<{
  credits: WorkCreditGroup[]
}>(), {
  credits: () => [],
})

</script>
