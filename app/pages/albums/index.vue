<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <section class="border-b border-slate-200/80 bg-white">
            <!-- Title, search and the new-album button -->
            <div class="flex flex-col gap-3 px-4 pb-3 pt-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:pt-5">
              <div class="flex min-w-0 flex-1 items-center gap-3.5">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100">
                  <Disc3 class="h-5 w-5" />
                </div>
                <div class="min-w-0">
                  <h1 class="text-2xl font-bold tracking-[-0.025em] text-slate-950 sm:text-[28px]">{{ $t('albums.title') }}</h1>
                  <p class="mt-0.5 truncate text-sm text-slate-500">{{ $t('albums.subtitle') }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <form class="relative min-w-0 flex-1 sm:w-72 sm:flex-none" role="search" @submit.prevent="applySearch">
                  <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    v-model="searchInput"
                    type="search"
                    class="h-9 w-full rounded-lg border-0 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                    :placeholder="t('albums.search_placeholder')"
                    :aria-label="t('albums.search_placeholder')"
                    @blur="applySearch"
                  >
                </form>
                <button
                  type="button"
                  class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
                  @click="navigateTo('/contribute/album')"
                >
                  <Plus class="h-4 w-4" />
                  <span class="hidden sm:inline">{{ $t('albums.new') }}</span>
                </button>
              </div>
            </div>

            <!-- Album types -->
            <div class="flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden" role="group" :aria-label="$t('content_display.type')">
              <button
                v-for="item in albumTypes"
                :key="item.value"
                type="button"
                class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150"
                :class="selectedType === item.value ? ACTIVE_CHIP : IDLE_CHIP"
                :aria-pressed="selectedType === item.value"
                @click="selectType(item.value)"
              >
                <Icon :name="item.icon" class="h-3.5 w-3.5" />
                {{ item.label }}
              </button>
            </div>

            <!-- Narrower filters, the pending switch and the result count -->
            <div class="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-6">
              <span class="hidden items-center gap-1.5 text-xs font-medium text-slate-400 sm:inline-flex">
                <Icon name="lucide:list-filter" class="h-3.5 w-3.5" />
                {{ t('albums.filters') }}
              </span>
              <!-- The event series pages link here with ?event=<id>. -->
              <EventFilterChip
                :model-value="eventId"
                :label="t('albums.event_filter_label')"
                :active-class="ACTIVE_CHIP"
                :idle-class="IDLE_CHIP"
                align="start"
                @update:model-value="selectEvent"
              />
              <CollectionFilterSelect
                :model-value="category"
                :label="t('albums.category_filter')"
                icon="lucide:tags"
                :options="ALBUM_CATEGORIES.map(value => ({ value, label: enumLabel('album_category', value) }))"
                :all-label="t('albums.all_categories')"
                :clear-label="t('albums.clear_filter', { name: t('albums.category_filter') })"
                :active-class="ACTIVE_CHIP"
                :idle-class="IDLE_CHIP"
                @update:model-value="selectFilter('category', $event)"
              />
              <CollectionFilterSelect
                :model-value="format"
                :label="t('albums.format_filter')"
                icon="lucide:disc"
                :options="DISC_FORMATS.map(value => ({ value, label: enumLabel('disc_format', value) }))"
                :all-label="t('albums.all_formats')"
                :clear-label="t('albums.clear_filter', { name: t('albums.format_filter') })"
                :active-class="ACTIVE_CHIP"
                :idle-class="IDLE_CHIP"
                @update:model-value="selectFilter('format', $event)"
              />
              <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
              <button v-if="filtered" type="button" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800" @click="clearFilters">
                <Icon name="lucide:rotate-ccw" class="h-3.5 w-3.5" />
                {{ t('albums.clear_filters') }}
              </button>
              <span v-if="albumsResponse" class="ml-auto text-xs tabular-nums text-slate-400">{{ t('albums.found', { count: pagination.total }) }}</span>
            </div>
          </section>
        </template>

      <!-- A failed refetch keeps the last results below this. -->
      <CommonLoadError v-if="status === 'error' && albumsResponse" class="mb-4" @retry="refresh()" />

      <!-- 加载状态 -->
      <CollectionLoadingSkeleton v-if="loading" variant="covers" />

      <!-- 错误状态 -->
      <div v-else-if="status === 'error' && !albumsResponse" class="flex items-center justify-center min-h-100">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ $t('albums.load_failed', { message: error?.message ?? '' }) }}</span>
        </div>
      </div>

      <!-- 专辑列表 -->
      <div v-else :key="revealKey" class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
        <!-- 专辑网格 -->
        <div class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
          <AlbumCard
            v-for="album in albumsData"
            :key="album.id"
            :album="album"
          />
        </div>

        <!-- 空状态 -->
        <div v-if="albumsData.length === 0" class="flex min-h-72 flex-col items-center justify-center text-center">
          <div class="text-gray-400 mb-4">
            <Disc3 :size="64" class="mx-auto" />
          </div>
          <p class="text-gray-500">{{ $t('albums.no_results') }}</p>
        </div>

        <CommonPagination
          class="mt-6"
          :page="pagination.current_page"
          :total-pages="pagination.last_page"
          :disabled="refetching"
          @update:page="goToPage"
        />
      </div>
      </CollectionPageCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Disc3, Plus, Search } from "@lucide/vue";
import type { AlbumSimple } from '~/types/album'
import { ALBUM_CATEGORIES, DISC_FORMATS } from '~/types/album'

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const albumTypes = computed(() => [
  { value: 'all', label: t('common.all'), icon: 'lucide:layout-grid' },
  { value: 'album', label: t('albums.type.album'), icon: 'lucide:disc-3' },
  { value: 'single', label: t('albums.type.single'), icon: 'lucide:music-2' },
  { value: 'ep', label: t('albums.type.ep'), icon: 'lucide:list-music' },
  { value: 'compilation', label: t('albums.type.compilation'), icon: 'lucide:library' },
  { value: 'drama', label: t('albums.type.drama'), icon: 'lucide:audio-lines' },
  { value: 'radio', label: t('albums.type.radio'), icon: 'lucide:radio' },
]);

const { enumLabel } = useCatalogDisplay()

const selectedType = computed(() => String(route.query.type || 'all'));

// The selected chip and the others, shared by every chip of the header.
const ACTIVE_CHIP = 'bg-sky-600 text-white ring-sky-600'
const IDLE_CHIP = 'bg-white text-slate-500 ring-slate-200 shadow-xs hover:text-slate-900 hover:ring-slate-300'

// ?event=<id> narrows the list to albums first released at that event.
const eventId = computed(() => {
  const id = Number.parseInt(String(route.query.event || ''));
  return id > 0 ? id : null;
});
const category = computed(() => route.query.category ? String(route.query.category) : null)
const format = computed(() => route.query.format ? String(route.query.format) : null)
const { includePending, setIncludePending } = usePendingToggle()
// The list endpoint needs at least two characters to search.
const searchQuery = computed(() => {
  const value = String(route.query.q || '').trim()
  return value.replace(/\s/g, '').length >= 2 ? value : null
})
const searchInput = ref(String(route.query.q || ''))
watch(() => route.query.q, value => { searchInput.value = String(value || '') })

useSeoMeta({
  title: 'Albums',
  description: 'Explore all music albums, singles, EPs and compilations on CDCAT.',
  ogTitle: 'Albums | CDCAT',
  ogDescription: 'Explore all music albums, singles, EPs and compilations on CDCAT.',
  ogType: 'website',
  twitterCard: 'summary',
})

// 获取当前页码
const currentPage = computed(() => {
  const page = parseInt(String(route.query.page || '1')) || 1;
  return page > 0 ? page : 1;
});

// 从 API 获取专辑列表
const { data: albumsResponse, status, error, refresh, loading, refetching, revealKey, revealClass } = usePageAPI<{ albums: AlbumSimple[], pagination: { total: number, per_page: number, current_page: number, last_page: number } }>("/v1/albums", {
  query: computed(() => ({
    page: currentPage.value,
    type: selectedType.value === 'all' ? undefined : selectedType.value,
    release_event_id: eventId.value ?? undefined,
    category: category.value ?? undefined,
    format: format.value ?? undefined,
    search: searchQuery.value ?? undefined,
    include_pending: includePending.value ? 1 : undefined,
  })),
});

// 处理专辑数据
const albumsData = computed(() => {
  if (!albumsResponse.value) {
    return [];
  }

  // API 插件已经处理了响应，直接返回 albums 数组
  // 响应结构：{ albums: [...], pagination: {...} }
  return albumsResponse.value.albums || [];
});

// 分页信息
const pagination = computed(() => {
  if (!albumsResponse.value?.pagination) {
    return {
      total: 0,
      per_page: 15,
      current_page: 1,
      last_page: 1,
    };
  }

  return albumsResponse.value.pagination;
});

// 跳转到指定页码
const goToPage = (page: number) => {
  if (page < 1 || page > pagination.value.last_page) return;

  router.push({
    query: {
      ...route.query,
      page: page === 1 ? undefined : page, // 第一页不显示 page 参数
    },
  });

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const selectFilter = (name: 'category' | 'format', value: string | null) => {
  router.push({ query: { ...route.query, [name]: value || undefined, page: undefined } });
};

/** Any filter narrowing the list; the pending switch is a view preference and stays. */
const filtered = computed(() => selectedType.value !== 'all' || !!eventId.value || !!category.value || !!format.value || !!route.query.q)
const clearFilters = () => {
  searchInput.value = ''
  router.push({ query: { pending: route.query.pending || undefined } })
};

const applySearch = () => {
  const value = searchInput.value.trim()
  if (value === String(route.query.q || '')) return
  router.push({ query: { ...route.query, q: value || undefined, page: undefined } })
};


const selectEvent = (id: number | null) => {
  router.push({
    query: {
      ...route.query,
      event: id ?? undefined,
      page: undefined,
    },
  });
};

const selectType = (type: string) => {
  router.push({
    query: {
      ...route.query,
      type: type === 'all' ? undefined : type,
      page: undefined,
    },
  });
};
</script>
