<script setup lang="ts">
import { Disc3, Film, Plus } from '@lucide/vue'

const route = useRoute()
const router = useRouter()

// 获取当前页码
const currentPage = computed(() => {
  const page = parseInt(route.query.page as string || '1') || 1
  return page > 0 ? page : 1
})

// 从 API 获取系列列表
const { data: seriesResponse, pending, error } = useAPI('/v1/franchises', {
  lazy: true,
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

const goToPage = (page: number) => {
  if (page < 1 || page > pagination.value.last_page) return

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
  <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
    <CollectionPageCard>
      <template #header>
    <CollectionPageHeader
      :title="$t('content_display.series')"
      :description="$t('content_display.series_desc')"
      icon="lucide:boxes"
      tone="emerald"
    >
      <template #action>
        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 p-0 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 sm:h-9 sm:w-auto sm:gap-2 sm:px-3.5"
          @click="navigateTo('/contribute/series')"
        >
          <Plus class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{{ $t('common.new') }}</span>
        </button>
      </template>
    </CollectionPageHeader>
      </template>

    <!-- 加载状态 -->
    <CollectionLoadingSkeleton v-if="pending" variant="wide" />

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex items-center justify-center min-h-100">
      <div class="alert alert-error max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ $t('common.load_failed') }}</span>
      </div>
    </div>

    <div v-else class="collection-content-enter">
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
                <span>{{ $t('content_display.entries_count', { count: series.entries_count }) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <Disc3 class="w-3.5 h-3.5 text-gray-400" />
                <span>{{ $t('content_display.works_count', { count: series.works_count }) }}</span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- 空状态 -->
      <div v-if="seriesData.length === 0" class="flex min-h-72 flex-col items-center justify-center text-center">
        <div class="text-gray-400 mb-4">
          <Disc3 :size="64" class="mx-auto" />
        </div>
        <p class="text-gray-500">{{ $t('content_display.no_series') }}</p>
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
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
