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
            search-in-filters
            @update:model-value="selectType"
            @search="applySearch()"
          >
            <template #filter-end>
              <UiSegmented :model-value="shownSort" :items="sortItems" size="sm" :label="t('albums.sort.label')" @update:model-value="selectSort" />
            </template>
            <template #search-end>
              <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
            </template>
            <!-- Narrower filters -->
            <template #filters="{ activeClass, idleClass }">
              <!-- The event series pages link here with ?event=<id>. -->
              <EventFilterMenu
                :model-value="eventId"
                :label="t('albums.event_filter_label')"
                :active-class="activeClass"
                :idle-class="idleClass"
                @update:model-value="selectEvent"
              />
              <!-- An event fixes the year, so choosing one clears the other. -->
              <CollectionYearFilter
                :model-value="year"
                :label="t('albums.year_filter')"
                :active-class="activeClass"
                :idle-class="idleClass"
                @update:model-value="selectYear"
              />
              <span class="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
              <!-- Categories as chips, one at a time; the chosen one again clears it. -->
              <div class="flex flex-wrap items-center gap-1.5" role="group" :aria-label="t('albums.category_filter')">
                <button
                  v-for="value in albumCategories"
                  :key="value"
                  type="button"
                  class="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium ring-1 ring-inset transition-colors duration-150 ease-out"
                  :class="category === value ? activeClass : idleClass"
                  :aria-pressed="category === value"
                  @click="selectFilter('category', category === value ? null : value)"
                >
                  {{ enumLabel('album_category', value) }}
                </button>
              </div>
              <button v-if="filtered" type="button" class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-meta transition-colors hover:bg-ghost-hover hover:text-primary" @click="clearFilters">
                <Icon name="lucide:rotate-ccw" class="h-3.5 w-3.5" />
                {{ t('albums.clear_filters') }}
              </button>
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
        <CommonPagedList
          :page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :count="albumsData.length"
          :per-page="pagination.per_page"
          :disabled="refetching"
          @update:page="goToPage"
        >
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
            <p class="text-meta">{{ searchQuery ? t('albums.no_search_results', { query: searchQuery }) : t('albums.no_results') }}</p>
          </div>
        </CommonPagedList>
      </div>
      </CollectionPageCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Disc3 } from "@lucide/vue";
import type { AlbumSimple } from '~/types/album'
import { ALBUM_CATEGORIES, ALBUM_TYPES } from '~/types/album'

const route = useRoute();
const router = useRouter();
const { t, te } = useI18n();

// Types and categories as the database has them now (the catalog schema), the built-in lists until it loads.
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
const TYPE_ICONS: Record<string, string> = {
  album: 'lucide:disc-3', single: 'lucide:music-2', ep: 'lucide:list-music', compilation: 'lucide:library',
  drama: 'lucide:audio-lines', radio: 'lucide:radio',
}
const albumTypes = computed(() => [
  { value: 'all', label: t('common.all'), icon: 'lucide:layout-grid' },
  ...(schema.value?.enums.album_type ?? ALBUM_TYPES).map(value => ({
    value, label: te(`albums.type.${value}`) ? t(`albums.type.${value}`) : enumLabel('album_type', value), icon: TYPE_ICONS[value] ?? 'lucide:disc',
  })),
])
const albumCategories = computed(() => schema.value?.enums.album_category ?? [...ALBUM_CATEGORIES])

const selectedType = computed(() => String(route.query.type || 'all'));

// ?event=<id> narrows the list to albums first released at that event.
const eventId = computed(() => {
  const id = Number.parseInt(String(route.query.event || ''));
  return id > 0 ? id : null;
});
const category = computed(() => route.query.category ? String(route.query.category) : null)
const year = computed(() => {
  const value = Number.parseInt(String(route.query.year || ''))
  return value >= 1900 && value <= 2100 ? value : null
})
const { includePending, setIncludePending } = usePendingToggle()
type AlbumSort = 'new' | 'trending' | 'top_rated'
const SORTS: AlbumSort[] = ['new', 'trending', 'top_rated']
/** The order picked in the URL; none means 新发布, or the closest matches first while searching. */
const sort = computed(() => SORTS.find(value => value === route.query.sort) ?? null)
// The list endpoint needs two characters, or one kanji or kana, to search.
const searchQuery = computed(() => {
  const value = String(route.query.q || '').trim()
  return searchable(value) ? value : null
})
const searchInput = ref(String(route.query.q || ''))
watch(() => route.query.q, value => { searchInput.value = String(value || '') })
const toast = useToast()

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
    year: year.value ?? undefined,
    search: searchQuery.value ?? undefined,
    sort: sort.value ?? undefined,
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

const selectFilter = (name: 'category', value: string | null) => {
  router.push({ query: { ...route.query, [name]: value || undefined, page: undefined } });
};

/** Any filter narrowing the list; the pending switch and the order are view preferences and stay. */
const filtered = computed(() => selectedType.value !== 'all' || !!eventId.value || !!category.value || !!year.value || !!route.query.q)
const clearFilters = () => {
  searchInput.value = ''
  router.push({ query: { pending: route.query.pending || undefined, sort: route.query.sort || undefined } })
};

/** Enter or the search button; a query too short to search leaves the list as it is and says why. */
// 最相关 only shows while searching, where it is what no choice means.
const shownSort = computed(() => sort.value ?? (searchQuery.value ? 'relevance' : 'new'))
const sortItems = computed(() => [
  ...(searchQuery.value ? [{ value: 'relevance', label: t('albums.sort.relevance') }] : []),
  ...SORTS.map(value => ({ value, label: t(`albums.sort.${value}`) })),
])
const selectSort = (value: string | undefined) => {
  const chosen = value === 'relevance' || (value === 'new' && !searchQuery.value) ? undefined : value
  router.push({ query: { ...route.query, sort: chosen, page: undefined } })
}

const applySearch = () => {
  const value = searchInput.value.trim()
  if (value && !searchable(value)) {
    // One id, so pressing Enter again pulses the toast instead of stacking copies.
    toast.add({ id: 'albums-search-too-short', title: t('albums.search_too_short'), color: 'warning' })
    return
  }
  if (value === String(route.query.q || '')) return
  router.push({ query: { ...route.query, q: value || undefined, page: undefined } })
};


const selectEvent = (id: number | null) => {
  router.push({
    query: {
      ...route.query,
      event: id ?? undefined,
      year: id ? undefined : route.query.year,
      page: undefined,
    },
  });
};

const selectYear = (value: number | null) => {
  router.push({ query: { ...route.query, year: value ?? undefined, event: value ? undefined : route.query.event, page: undefined } })
}

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
