<template>
  <div class="min-h-screen">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
          <CollectionPageHeader
            v-model:search="searchInput"
            :model-value="selectedType"
            :title="$t('artists.title')"
            :description="$t('artists.subtitle')"
            icon="lucide:mic-2"
            :create="{ to: '/contribute?type=artist', label: $t('common.contribute') }"
            :filters="artistTypes"
            :filter-label="$t('content_display.type')"
            :search-placeholder="$t('artists.search_placeholder')"
            @update:model-value="selectType"
            @search="applySearch"
          >
            <template #icon>
              <HeaderArtArtists />
            </template>
            <template #search-end>
              <CatalogPendingToggle :model-value="includePending" @update:model-value="setIncludePending" />
            </template>
          </CollectionPageHeader>
        </template>

      <!-- A failed refetch keeps the last results below this. -->
      <CommonLoadError v-if="status === 'error' && artistsResponse" class="mb-4" @retry="refresh()" />

      <!-- 加载状态 -->
      <CollectionLoadingSkeleton v-if="loading" variant="artists" />

      <!-- 错误状态 -->
      <div v-else-if="status === 'error' && !artistsResponse" class="flex items-center justify-center min-h-100">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ $t('artists.load_failed', { message: error?.message ?? '' }) }}</span>
        </div>
      </div>

      <!-- 艺术家列表 -->
      <div v-else :key="revealKey" class="transition-opacity" :class="[revealClass, { 'pointer-events-none opacity-60': refetching }]" :inert="refetching">
        <CommonPagedList
          :page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :count="artistsData.length"
          :per-page="pagination.per_page"
          :top-after="15"
          :disabled="refetching"
          @update:page="goToPage"
        >
          <!-- 艺术家网格 -->
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <NuxtLink
              v-for="artist in artistsData"
              :key="artist.id"
              :to="`/artists/${artist.id}`"
              class="group flex min-w-0 items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors duration-150 ease-out bg-black/[0.025] hover:bg-black/[0.065] active:bg-black/[0.09] dark:bg-white/[0.04] dark:hover:bg-white/[0.07] dark:active:bg-white/[0.1]"
            >
              <div class="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card ring-1 ring-line">
                <img
                  v-if="artist.image_url"
                  :src="artist.image_url"
                  :alt="artist.name"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                >
                <div v-else class="text-faint">
                  <Users :size="12" />
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <UiTruncate :text="artist.name" tag="h3" class="text-[13px] font-medium text-title transition-colors group-hover:text-primary" />
              </div>
            </NuxtLink>
          </div>

          <!-- 空状态 -->
          <div v-if="artistsData.length === 0" class="flex min-h-72 flex-col items-center justify-center text-center">
            <div class="text-meta mb-4">
              <Users :size="64" class="mx-auto" />
            </div>
            <p class="text-meta">{{ searchQuery ? $t('artists.no_search_results', { query: searchQuery }) : $t('artists.no_results') }}</p>
          </div>
        </CommonPagedList>
      </div>
      </CollectionPageCard>
    </div>
  </div>
</template>

<script setup>
import { Users } from "@lucide/vue";
import { ARTIST_TYPES } from "~/types/artist";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// The types as the database has them now (the catalog schema), the built-in list until it loads.
const { schema } = useCatalogSchema()
const { enumLabel } = useCatalogDisplay()
// The English names, in a tooltip on the type chips
const { labelEn } = useEnglishLabels()
const artistTypes = computed(() => [
  { value: 'all', label: t('common.all') },
  ...(schema.value?.enums.artist_type ?? ARTIST_TYPES).map(value => ({ value, label: enumLabel('artist_type', value), hint: labelEn('artist_type', value) })),
]);

// From the URL, so back and forward switch the type too.
const selectedType = computed(() => route.query.type || 'all');

// ?q=, like the album list: the endpoint needs two characters, or one kanji or kana, and orders by relevance.
const searchQuery = computed(() => {
  const value = String(route.query.q || '').trim();
  return searchable(value) ? value : null;
});
const searchInput = ref(String(route.query.q || ''));
watch(() => route.query.q, value => { searchInput.value = String(value || ''); });
const toast = useToast();

usePageSeo({
  title: () => t('artists.title'),
  description: () => t('seo.pages.artists'),
})

// 获取当前页码
const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

/** Artists a page holds: whole rows in two to five columns. */
const PER_PAGE = 60

// 从 API 获取艺术家列表 - 使用 computed query 以响应路由变化
const { includePending, setIncludePending } = usePendingToggle()
const { data: artistsResponse, status, error, refresh, loading, refetching, revealKey, revealClass } = usePageAPI("/v1/artists", {
  query: computed(() => ({
    page: currentPage.value,
    per_page: PER_PAGE,
    type: selectedType.value === 'all' ? undefined : selectedType.value,
    search: searchQuery.value ?? undefined,
    include_pending: includePending.value ? 1 : undefined,
  })),
});

// 处理艺术家数据
const artistsData = computed(() => {
  if (!artistsResponse.value) {
    return [];
  }

  // API 插件已经处理了响应，直接返回 artists 数组
  // 响应结构：{ artists: [...], pagination: {...} }
  return artistsResponse.value.artists || [];
});

// 分页信息
const pagination = computed(() => {
  if (!artistsResponse.value?.pagination) {
    return {
      total: 0,
      per_page: PER_PAGE,
      current_page: 1,
      last_page: 1,
    };
  }

  return artistsResponse.value.pagination;
});

// 跳转到指定页码
const goToPage = (page) => {
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

const selectType = (type) => {
  router.push({
    query: {
      ...route.query,
      type: type === 'all' ? undefined : type,
      page: undefined,
    },
  });
};

/** Enter or the search button; a query too short to search leaves the list as it is and says why. */
const applySearch = () => {
  const value = searchInput.value.trim();
  if (value && !searchable(value)) {
    // One id, so pressing Enter again pulses the toast instead of stacking copies.
    toast.add({ id: 'artists-search-too-short', title: t('artists.search_too_short'), color: 'warning' });
    return;
  }
  if (value === String(route.query.q || '')) return;
  router.push({ query: { ...route.query, q: value || undefined, page: undefined } });
};
</script>
