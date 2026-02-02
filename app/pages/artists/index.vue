<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl">
      <!-- 页面标题 -->
      <div class="mb-8 flex items-start justify-between">
        <div>
          <h1 class="text-4xl font-bold mb-2">Artists</h1>
          <p class="text-gray-600">Explore all artists and circles</p>
        </div>
        <NuxtLink to="/contribute/artist" class="btn btn-primary gap-2">
          <Plus :size="20" />
          <span class="hidden sm:inline">Create Artist</span>
        </NuxtLink>
      </div>

      <!-- 加载状态 -->
      <div v-if="pending" class="flex items-center justify-center min-h-100">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex items-center justify-center min-h-100">
        <div class="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>加载失败: {{ error.message }}</span>
        </div>
      </div>

      <!-- 艺术家列表 -->
      <div v-else>
        <!-- 统计信息 -->
        <div class="mb-6 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Found {{ pagination.total }} artists
            <span v-if="pagination.total > 0" class="text-gray-500">
              (Page {{ pagination.current_page }} of {{ pagination.last_page }})
            </span>
          </div>
        </div>

        <!-- 艺术家网格 -->
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-2.5 md:gap-3">
          <NuxtLink
            v-for="artist in artistsData"
            :key="artist.id"
            :to="`/artists/${artist.id}`"
            class="group"
          >
            <div class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 border border-gray-100">
              <!-- 艺术家头像 -->
              <div class="aspect-square bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
                <img
                  v-if="artist.image_url"
                  :src="artist.image_url"
                  :alt="artist.name"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  style="image-rendering: -webkit-optimize-contrast;"
                />
                <div v-else class="text-gray-300">
                  <Users :size="32" />
                </div>
                <!-- 渐变遮罩，增强对比度 -->
                <div class="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <!-- 艺术家信息 -->
              <div class="px-2.5 py-2 bg-white">
                <h3 class="font-bold text-xs mb-1 truncate group-hover:text-blue-600 transition-colors">
                  {{ artist.name }}
                </h3>

                <div class="flex items-center gap-1 text-[10px] mb-1.5">
                  <span v-if="artist.type" class="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                    {{ formatType(artist.type) }}
                  </span>
                  <span v-if="artist.region" class="text-gray-500 truncate">{{ artist.region }}</span>
                </div>

                <div class="flex items-center justify-between text-[11px] text-gray-600">
                  <div class="flex items-center gap-1">
                    <Disc3 :size="12" class="text-gray-400" />
                    <span class="font-medium">{{ artist.albums_count || 0 }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Heart :size="12" class="text-gray-400 group-hover:text-red-400 transition-colors" />
                    <span class="font-medium">{{ artist.followers_count || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- 空状态 -->
        <div v-if="artistsData.length === 0" class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <Users :size="64" class="mx-auto" />
          </div>
          <p class="text-gray-500">No artists found</p>
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
    </div>
  </div>
</template>

<script setup>
import { Users, Disc3, Heart, Plus } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

// 获取当前页码
const currentPage = computed(() => {
  const page = parseInt(route.query.page || '1') || 1;
  return page > 0 ? page : 1;
});

// 从 API 获取艺术家列表 - 使用 computed query 以响应路由变化
const { data: artistsResponse, pending, error } = await useAPI("/v1/artists", {
  query: computed(() => ({
    page: currentPage.value,
    per_page: 18,
  })),
  watch: [currentPage],
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

// 格式化艺术家类型
const formatType = (type) => {
  const typeMap = {
    person: "Person",
    circle: "Circle",
    other: "Other",
  };
  return typeMap[type] || type;
};

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
</script>
