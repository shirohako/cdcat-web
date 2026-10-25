<template>
  <div class="min-h-screen">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader
            v-model:search="searchInput"
            :model-value="selectedType"
            :title="$t('albums.title')"
            :description="$t('albums.subtitle')"
            icon="lucide:disc-3"
            :create="{ to: '/contribute?type=album', label: $t('albums.new') }"
            :filters="albumTypes"
            :filter-label="$t('content_display.type')"
            :search-placeholder="t('albums.search_placeholder')"
            @update:model-value="selectType"
            @search="applySearch"
          >
            <template #search-end>
              <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
            </template>
            <!-- Narrower filters and the result count -->
            <template #filters="{ activeClass, idleClass }">
              <!-- The event series pages link here with ?event=<id>. -->
              <EventFilterChip
                :model-value="eventId"
                :label="t('albums.event_filter_label')"
                :active-class="activeClass"
                :idle-class="idleClass"
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
                :active-class="activeClass"
                :idle-class="idleClass"
                @update:model-value="selectFilter('category', $event)"
              />
              <CollectionFilterSelect
                :model-value="format"
                :label="t('albums.format_filter')"
                icon="lucide:disc"
                :options="DISC_FORMATS.map(value => ({ value, label: enumLabel('disc_format', value) }))"
                :all-label="t('albums.all_formats')"
                :clear-label="t('albums.clear_filter', { name: t('albums.format_filter') })"
                :active-class="activeClass"
                :idle-class="idleClass"
                @update:model-value="selectFilter('format', $event)"
              />
              <button v-if="filtered" type="button" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-meta transition-colors hover:bg-ghost-hover hover:text-primary" @click="clearFilters">
                <Icon name="lucide:rotate-ccw" class="h-3.5 w-3.5" />
                {{ t('albums.clear_filters') }}
              </button>
              <span v-if="albumsResponse" class="ml-auto text-xs tabular-nums text-meta">{{ t('albums.found', { count: pagination.total }) }}</span>
            </template>
          </CollectionPageHeader>
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
          <div class="text-meta mb-4">
            <Disc3 :size="64" class="mx-auto" />
          </div>
          <p class="text-meta">{{ $t('albums.no_results') }}</p>
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
import { Disc3 } from "@lucide/vue";
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

usePageSeo({
  title: () => t('albums.title'),
  description: () => t('seo.pages.albums'),
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
