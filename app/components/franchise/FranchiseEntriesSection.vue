<script setup lang="ts">
import { Disc3, Film } from '@lucide/vue'
import { ENTRY_TYPES, type EntrySummary, type EntryType } from '~/types/entry'

// A series' own entries, grouped by type automatically; the API already orders them by sort_order and date.
const props = defineProps<{ entries: EntrySummary[] }>()

const { displayName, typeLabel, formatLabel, typeIcon, formatReleaseDate } = useEntryDisplay()

const groups = computed(() => ENTRY_TYPES
  .map(type => ({ type, entries: props.entries.filter(entry => entry.type === type) }))
  .filter(group => group.entries.length) as Array<{ type: EntryType, entries: EntrySummary[] }>)
</script>

<template>
  <div class="space-y-6">
    <section v-for="group in groups" :key="group.type">
      <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon :name="typeIcon(group.type)" class="h-4 w-4 text-emerald-600" />
        {{ typeLabel(group.type) }}
        <span class="font-normal text-slate-400">{{ group.entries.length }}</span>
      </h3>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        <NuxtLink
          v-for="entry in group.entries"
          :key="entry.id"
          :to="`/entries/${entry.id}`"
          class="group flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-2.5 transition-all duration-300 hover:border-emerald-300 hover:shadow-md"
        >
          <div class="aspect-3/4 w-full overflow-hidden rounded-lg bg-gray-100">
            <img v-if="entry.image_url" :src="entry.image_url" :alt="displayName(entry)" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" >
            <div v-else class="flex h-full w-full items-center justify-center"><Film class="h-8 w-8 text-gray-300" /></div>
          </div>
          <div class="min-w-0">
            <h4 class="line-clamp-2 text-sm font-medium text-gray-800 transition-colors group-hover:text-emerald-700">{{ displayName(entry) }}</h4>
            <p class="mt-0.5 truncate text-xs text-gray-500">
              {{ [formatLabel(entry.format), formatReleaseDate(entry.release_date, entry.release_date_precision)].filter(Boolean).join(' · ') }}
            </p>
            <p v-if="entry.albums_count" class="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <Disc3 class="h-3 w-3" />{{ $t('catalog.albums_count', { count: entry.albums_count }) }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </section>
    <p v-if="!groups.length" class="py-6 text-center text-sm text-gray-500">{{ $t('catalog.no_entries') }}</p>
  </div>
</template>
