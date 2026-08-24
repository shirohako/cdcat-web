<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <CollectionPageCard>
        <template #header>
      <CollectionPageHeader
        v-model="selectedType"
        :title="$t('works.title')"
        :description="$t('works.subtitle')"
        icon="lucide:disc-3"
        tone="sky"
        :filters="workTypes"
        :filter-label="$t('content_display.type')"
        @update:model-value="selectType"
      >
        <template #action>
          <button
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
            @click="navigateTo('/contribute/work')"
          >
            <Plus class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{ $t('works.new') }}</span>
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
          <span>{{ $t('works.load_failed', { message: error.message }) }}</span>
        </div>
      </div>

      <!-- 作品列表 -->
      <div v-else class="collection-content-enter">
        <!-- 专辑网格 -->
        <div class="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
          <WorkCard
            v-for="work in worksData"
            :key="work.id"
            :work="work"
          />
        </div>

        <!-- 空状态 -->
        <div v-if="worksData.length === 0" class="flex min-h-72 flex-col items-center justify-center text-center">
          <div class="text-gray-400 mb-4">
            <Disc3 :size="64" class="mx-auto" />
          </div>
          <p class="text-gray-500">{{ $t('works.no_results') }}</p>
        </div>

        <!-- 分页控件 -->
        <div v-if="pagination.last_page > 1" class="mt-12 flex justify-center">
          <div class="join">
            <!-- 上一页按钮 -->
            <button
              class="join-item btn btn-sm"
              :disabled="pagination.current_page === 1"
              @click="goToPage(pagination.current_page - 1)"
            >
              «
            </button>

            <!-- 页码按钮 -->
            <template v-for="page in visiblePages" :key="page">
              <button
                v-if="page !== '...'"
                class="join-item btn btn-sm"
                :class="{ 'btn-active': page === pagination.current_page }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button
                v-else
                class="join-item btn btn-sm btn-disabled"
              >
                ...
              </button>
            </template>

            <!-- 下一页按钮 -->
            <button
              class="join-item btn btn-sm"
              :disabled="pagination.current_page === pagination.last_page"
              @click="goToPage(pagination.current_page + 1)"
            >
              »
            </button>
          </div>
        </div>
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

const workTypes = computed(() => [
  { value: 'all', label: t('common.all'), icon: 'lucide:layout-grid' },
  { value: 'album', label: t('works.type.album'), icon: 'lucide:disc-3' },
  { value: 'single', label: t('works.type.single'), icon: 'lucide:music-2' },
  { value: 'ep', label: t('works.type.ep'), icon: 'lucide:list-music' },
  { value: 'compilation', label: t('works.type.compilation'), icon: 'lucide:library' },
  { value: 'drama', label: t('works.type.drama'), icon: 'lucide:audio-lines' },
  { value: 'radio', label: t('works.type.radio'), icon: 'lucide:radio' },
]);

const selectedType = ref(route.query.type || 'all');

useSeoMeta({
  title: 'Works',
  description: 'Explore all music albums, singles, EPs and compilations on CDCAT.',
  ogTitle: 'Works | CDCAT',
  ogDescription: 'Explore all music albums, singles, EPs and compilations on CDCAT.',
  ogType: 'website',
  twitterCard: 'summary',
})

// 获取当前页码
const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

// 从 API 获取作品列表
const { data: worksResponse, pending, error } = useAPI("/v1/works", {
  lazy: true,
  query: computed(() => ({
    page: currentPage.value,
    type: selectedType.value === 'all' ? undefined : selectedType.value,
  })),
  watch: [currentPage, selectedType],
});

// 处理作品数据
const worksData = computed(() => {
  if (!worksResponse.value) {
    return [];
  }

  // API 插件已经处理了响应，直接返回 works 数组
  // 响应结构：{ works: [...], pagination: {...} }
  return worksResponse.value.works || [];
});

// 分页信息
const pagination = computed(() => {
  if (!worksResponse.value?.pagination) {
    return {
      total: 0,
      per_page: 15,
      current_page: 1,
      last_page: 1,
    };
  }

  return worksResponse.value.pagination;
});

// 计算可见的页码
const visiblePages = computed(() => {
  const current = pagination.value.current_page;
  const last = pagination.value.last_page;
  const pages = [];

  if (last <= 7) {
    // 如果总页数小于等于 7，显示所有页码
    for (let i = 1; i <= last; i++) {
      pages.push(i);
    }
  } else {
    // 总是显示第一页
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    // 显示当前页附近的页码
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < last - 2) {
      pages.push('...');
    }

    // 总是显示最后一页
    pages.push(last);
  }

  return pages;
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
