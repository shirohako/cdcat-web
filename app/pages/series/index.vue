<script setup lang="ts">
import { Disc3, Film } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// 获取当前页码
const currentPage = computed(() => {
  const page = parseInt(route.query.page as string || '1') || 1
  return page > 0 ? page : 1
})

// 从 API 获取系列列表
const { data: seriesResponse, pending, error } = await useAPI('/v1/franchises', {
  query: {
    page: currentPage.value,
  },
})

// 处理系列数据
const seriesData = computed(() => {
  if (!seriesResponse.value) {
    return []
  }
  return (seriesResponse.value as any).franchises || []
})

// 分页信息
const pagination = computed(() => {
  if (!(seriesResponse.value as any)?.pagination) {
    return {
      total: 0,
      per_page: 24,
      current_page: 1,
      last_page: 1,
    }
  }
  return (seriesResponse.value as any).pagination
})

const totalPages = computed(() => pagination.value.last_page)

// 显示的页码（最多显示 7 个页码按钮）
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = pagination.value.current_page

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return

  router.push({
    query: {
      ...route.query,
      page: page === 1 ? undefined : page,
    },
  })

  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="container mx-auto px-4 md:px-8 py-8 max-w-7xl">
    <!-- 页面标题 -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">系列列表</h1>
        <p class="text-gray-600">浏览所有游戏、动画、音乐系列作品</p>
      </div>
      <NuxtLink class="btn btn-primary btn-sm w-full md:w-auto" to="/contribute/series">
        创建系列
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

    <div v-else>
      <!-- 系列卡片网格 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <NuxtLink
          v-for="series in seriesData"
          :key="series.id"
          :to="`/series/${series.id}`"
          class="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <!-- 系列封面 -->
          <div class="relative aspect-video overflow-hidden bg-gray-100">
            <img
              v-if="series.image_url"
              :src="series.image_url"
              :alt="series.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
              <Disc3 class="w-12 h-12 text-gray-400" />
            </div>
          </div>

          <!-- 系列信息 -->
          <div class="p-4">
            <h3 class="font-bold text-gray-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
              {{ series.name }}
            </h3>

            <!-- 统计信息 -->
            <div class="space-y-1.5 text-xs text-gray-600">
              <div class="flex items-center gap-1.5">
                <Film class="w-3.5 h-3.5 text-gray-400" />
                <span>{{ series.entries_count }} 条目</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Disc3 class="w-3.5 h-3.5 text-gray-400" />
                <span>{{ series.works_count }} 专辑</span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- 空状态 -->
      <div v-if="seriesData.length === 0" class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <Disc3 :size="64" class="mx-auto" />
        </div>
        <p class="text-gray-500">暂无系列</p>
      </div>

      <!-- 分页控制 -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <div class="join">
          <button
            class="join-item btn btn-sm"
            :disabled="pagination.current_page === 1"
            @click="goToPage(pagination.current_page - 1)"
          >
            «
          </button>

          <template v-for="(page, index) in visiblePages" :key="index">
            <button
              v-if="page === '...'"
              class="join-item btn btn-sm btn-disabled"
            >
              ...
            </button>
            <button
              v-else
              class="join-item btn btn-sm"
              :class="{ 'btn-active': pagination.current_page === page }"
              @click="goToPage(page as number)"
            >
              {{ page }}
            </button>
          </template>

          <button
            class="join-item btn btn-sm"
            :disabled="pagination.current_page === totalPages"
            @click="goToPage(pagination.current_page + 1)"
          >
            »
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
