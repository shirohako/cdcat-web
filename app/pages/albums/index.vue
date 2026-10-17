<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
      <CollectionPageHeader
        v-model="selectedType"
        :title="$t('albums.title')"
        :description="$t('albums.subtitle')"
        icon="lucide:disc-3"
        tone="sky"
        :filters="albumTypes"
        :filter-label="$t('content_display.type')"
        @update:model-value="selectType"
      >
        <!-- 活动筛选；活动系列页的「N 张专辑」也跳到这里（?event=<id>） -->
        <template #filter-end="{ activeClass, idleClass }">
          <EventFilterChip
            :model-value="eventId"
            :label="t('albums.event_filter_label')"
            :active-class="activeClass"
            :idle-class="idleClass"
            @update:model-value="selectEvent"
          />
        </template>
        <template #action>
          <button
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
            @click="navigateTo('/contribute/album')"
          >
            <Plus class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{ $t('albums.new') }}</span>
          </button>
        </template>
      </CollectionPageHeader>
        </template>

      <!-- 加载状态 -->
      <CollectionLoadingSkeleton v-if="pending" variant="covers" />

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex items-center justify-center min-h-100">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ $t('albums.load_failed', { message: error.message }) }}</span>
        </div>
      </div>

      <!-- 专辑列表 -->
      <div v-else class="collection-content-enter">
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
          :disabled="pending"
          @update:page="goToPage"
        />
      </div>
      </CollectionPageCard>
    </div>
  </div>
</template>

<script setup>
import { Disc3, Plus } from "@lucide/vue";

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

const selectedType = ref(route.query.type || 'all');

// ?event=<id> narrows the list to albums first released at that event.
const eventId = computed(() => {
  const id = Number.parseInt(route.query.event || '');
  return id > 0 ? id : null;
});

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
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

// 从 API 获取专辑列表
const { data: albumsResponse, pending, error } = useAPI("/v1/albums", {
  lazy: true,
  query: computed(() => ({
    page: currentPage.value,
    type: selectedType.value === 'all' ? undefined : selectedType.value,
    release_event_id: eventId.value ?? undefined,
  })),
  watch: [currentPage, selectedType, eventId],
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

const selectEvent = (id) => {
  router.push({
    query: {
      ...route.query,
      event: id ?? undefined,
      page: undefined,
    },
  });
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
