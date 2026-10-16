<script setup lang="ts">
import { Disc3 } from '@lucide/vue'
import { ENTRY_WORK_RELATIONS, type FranchiseWork, type Pagination } from '~/types/entry'

// Every album in the series and its sub-series (through entries, plus series-wide releases), paginated.
const props = defineProps<{ seriesId: number | string }>()

const { workRelationLabel } = useEntryDisplay()
const { $api } = useNuxtApp()

const relation = ref('')
const page = ref(1)
watch(relation, () => { page.value = 1 })

const { data, pending } = useAsyncData(
  () => `franchise-works-${props.seriesId}-${relation.value}-${page.value}`,
  () => $api<{ works: FranchiseWork[], pagination: Pagination }>(`/v1/franchises/${props.seriesId}/works`, {
    query: { page: page.value, relation_type: relation.value || undefined },
  }),
)

const works = computed(() => data.value?.works || [])
const pagination = computed(() => data.value?.pagination || { total: 0, per_page: 24, current_page: 1, last_page: 1 })
</script>

<template>
  <div class="space-y-4">
    <div class="flex gap-1.5 overflow-x-auto pb-1">
      <button
        v-for="value in ['', ...ENTRY_WORK_RELATIONS]"
        :key="value"
        type="button"
        class="h-8 shrink-0 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors"
        :class="relation === value ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-slate-500 ring-slate-200 hover:text-slate-900'"
        :aria-pressed="relation === value"
        @click="relation = value"
      >
        {{ value ? workRelationLabel(value) : $t('catalog.all_relations') }}
      </button>
    </div>

    <div v-if="pending" class="flex justify-center py-10"><span class="loading loading-spinner" /></div>
    <template v-else>
      <div v-if="works.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        <NuxtLink v-for="work in works" :key="work.id" :to="`/works/${work.id}`" class="group">
          <div class="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img v-if="work.image_url" :src="work.image_url" :alt="work.title" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" >
            <div v-else class="flex h-full items-center justify-center"><Disc3 class="h-8 w-8 text-gray-300" /></div>
          </div>
          <h4 class="mt-2 line-clamp-2 text-sm font-medium text-gray-800 group-hover:text-emerald-700">{{ work.title }}</h4>
          <p class="truncate text-xs text-gray-500">{{ [work.catalog_number, work.release_date].filter(Boolean).join(' · ') }}</p>
          <p v-if="work.entries?.length" class="truncate text-xs text-gray-400">
            {{ work.entries.map(entry => `${entry.name} · ${workRelationLabel(entry.relation_type)}`).join(' / ') }}
          </p>
        </NuxtLink>
      </div>
      <p v-else class="py-10 text-center text-sm text-gray-500">{{ $t('catalog.no_works') }}</p>

      <CommonPagination
        :page="pagination.current_page"
        :total-pages="pagination.last_page"
        :disabled="pending"
        @update:page="page = $event"
      />
    </template>
  </div>
</template>
