<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
      <CollectionPageHeader
        v-model="selectedType"
        :title="$t('artists.title')"
        :description="$t('artists.subtitle')"
        icon="lucide:users-round"
        tone="violet"
        :filters="artistTypes"
        :filter-label="$t('content_display.type')"
        @update:model-value="selectType"
      >
        <template #action>
          <button
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
            @click="navigateTo('/contribute/artist')"
          >
            <Plus class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{ $t('artists.new') }}</span>
          </button>
        </template>
      </CollectionPageHeader>
        </template>

      <!-- 加载状态 -->
      <CollectionLoadingSkeleton v-if="pending" variant="artists" />

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex items-center justify-center min-h-100">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ $t('artists.load_failed', { message: error.message }) }}</span>
        </div>
      </div>

      <!-- 艺术家列表 -->
      <div v-else class="collection-content-enter">
        <!-- 艺术家网格 -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <NuxtLink
            v-for="artist in artistsData"
            :key="artist.id"
            :to="`/artists/${artist.id}`"
            class="group flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50/70"
          >
            <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
              <img
                v-if="artist.image_url"
                :src="artist.image_url"
                :alt="artist.name"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              >
              <div v-else class="text-slate-300">
                <Users :size="22" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <h3 class="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-sky-700">
                {{ artist.name }}
              </h3>

              <p v-if="artist.region" class="mt-0.5 truncate text-xs text-slate-500">
                {{ artist.region }}
              </p>

              <div class="mt-1.5 flex items-center gap-3.5 text-xs text-slate-500">
                <div class="flex items-center gap-1.5">
                  <Disc3 :size="13" class="text-slate-400" />
                  <span class="font-medium">{{ artist.albums_count || 0 }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Heart :size="13" :fill="artist.is_favorited ? 'currentColor' : 'none'" :class="artist.is_favorited ? 'text-rose-500' : 'text-slate-400 group-hover:text-rose-400'" class="transition-colors" />
                  <span class="font-medium">{{ artist.followers_count || 0 }}</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- 空状态 -->
        <div v-if="artistsData.length === 0" class="flex min-h-72 flex-col items-center justify-center text-center">
          <div class="text-gray-400 mb-4">
            <Users :size="64" class="mx-auto" />
          </div>
          <p class="text-gray-500">{{ $t('artists.no_results') }}</p>
        </div>

        <CommonPagination
          class="mt-12"
          :page="pagination.current_page"
          :total-pages="pagination.last_page"
          :disabled="pending"
          @update:page="goToPage"
        />
      </div>
      </CollectionPageCard>
    </div>
  </div>
</template>

<script setup>
import { Users, Disc3, Heart, Plus } from "@lucide/vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const artistTypes = computed(() => [
  { value: 'all', label: t('common.all'), icon: 'lucide:layout-grid' },
  { value: 'person', label: t('artists.type.person'), icon: 'lucide:user-round' },
  { value: 'circle', label: t('artists.type.circle'), icon: 'lucide:users-round' },
  { value: 'other', label: t('artists.type.other'), icon: 'lucide:shapes' },
]);

const selectedType = ref(route.query.type || 'all');

useSeoMeta({
  title: 'Artists',
  description: 'Browse all artists and their discographies on CDCAT.',
  ogTitle: 'Artists | CDCAT',
  ogDescription: 'Browse all artists and their discographies on CDCAT.',
  ogType: 'website',
  twitterCard: 'summary',
})

// 获取当前页码
const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

// 从 API 获取艺术家列表 - 使用 computed query 以响应路由变化
const { data: artistsResponse, pending, error } = useAPI("/v1/artists", {
  lazy: true,
  query: computed(() => ({
    page: currentPage.value,
    per_page: 18,
    type: selectedType.value === 'all' ? undefined : selectedType.value,
  })),
  watch: [currentPage, selectedType],
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
      per_page: 15,
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
  selectedType.value = type;
  router.push({
    query: {
      ...route.query,
      type: type === 'all' ? undefined : type,
      page: undefined,
    },
  });
};
</script>
