<template>
  <div class="min-h-screen bg-gray-50/80">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">我的评价</h1>
        <p class="mt-1.5 text-sm text-gray-500">分享你对听过专辑的感想和评分</p>
      </div>

      <!-- Stats Cards -->
      <div v-if="statsLoading" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div v-for="i in 3" :key="i" class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div class="h-9 w-12 bg-gray-200 rounded animate-pulse mt-3" />
            </div>
            <div class="w-12 h-12 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <!-- Total Reviews -->
        <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6 transition-all hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">评价总数</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalReviews }}</p>
            </div>
            <Icon name="lucide:message-square-text" class="w-12 h-12 text-blue-100" />
          </div>
        </div>

        <!-- Average Score -->
        <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6 transition-all hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">平均评分</p>
              <p
                class="text-3xl font-bold mt-2"
                :class="stats.averageScore > 0 ? getScoreColorClass(stats.averageScore) : 'text-gray-900'"
              >
                {{ stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '--' }}
              </p>
            </div>
            <Icon name="lucide:star" class="w-12 h-12 text-yellow-100" />
          </div>
        </div>

        <!-- Scored Reviews -->
        <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 p-6 transition-all hover:shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">已评分</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.scoredCount }}</p>
            </div>
            <Icon name="lucide:hash" class="w-12 h-12 text-green-100" />
          </div>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
        <!-- Sort Bar -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <p class="text-sm text-gray-500">
            共 {{ total }} 条评价
          </p>
          <select
            v-model="sortBy"
            class="select select-bordered select-sm text-sm"
          >
            <option value="date_desc">最新优先</option>
            <option value="date_asc">最早优先</option>
            <option value="score_desc">最高分</option>
            <option value="score_asc">最低分</option>
          </select>
        </div>

        <!-- Reviews List -->
        <ReviewsList
          :reviews="reviews"
          :is-loading="isLoading"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @edit="handleEdit"
          @delete="handleDelete"
          @page-change="handlePageChange"
        />
      </div>

      <!-- Delete Confirm Dialog -->
      <Teleport to="body">
        <div v-if="deleteConfirm.show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancelDelete" />
          <div class="relative bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-sm p-6">
            <div class="flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Icon name="lucide:trash-2" class="w-6 h-6 text-red-500" />
              </div>
              <h3 class="text-lg font-bold text-gray-900">删除评价</h3>
              <p class="text-sm text-gray-500 mt-2">确定要删除这条评价吗？此操作无法撤销。</p>
            </div>
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                class="btn btn-ghost btn-sm flex-1"
                :disabled="deleteConfirm.loading"
                @click="cancelDelete"
              >
                取消
              </button>
              <button
                type="button"
                class="btn btn-error btn-sm flex-1 gap-2"
                :disabled="deleteConfirm.loading"
                @click="confirmDelete"
              >
                <Icon v-if="deleteConfirm.loading" name="lucide:loader" class="w-4 h-4 animate-spin" />
                删除
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Write/Edit Review Modal -->
      <ReviewsReviewFormModal
        v-if="showWriteModal"
        :key="editingReview?.id ?? 'new'"
        :review="editingReview"
        @close="closeModal"
        @saved="handleSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserReview, ReviewStats, ReviewSortBy } from '~/types/reviews'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'My Reviews | CDCAT'
})

const { $api } = useNuxtApp()

// State
const reviews = ref<UserReview[]>([])
const stats = ref<ReviewStats>({ totalReviews: 0, averageScore: 0, scoredCount: 0 })
const isLoading = ref(false)
const statsLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const sortBy = ref<ReviewSortBy>('date_desc')
const showWriteModal = ref(false)
const editingReview = ref<UserReview | null>(null)
const deleteConfirm = reactive({ show: false, reviewId: 0, loading: false })

// API 响应 → UserReview 映射
function mapReview(raw: any): UserReview {
  return {
    id: raw.id,
    workId: raw.work_id,
    workTitle: raw.work?.title ?? '',
    workImageUrl: raw.work?.image_url ?? '',
    artists: [],
    content: raw.content ?? '',
    score: raw.rating ?? null,
    reactions: {
      helpful: raw.useful_count ?? 0,
      unhelpful: raw.dislike_count ?? 0,
      funny: raw.fun_count ?? 0,
    },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

// 从评价列表计算统计
function computeStats(list: UserReview[], totalCount: number): ReviewStats {
  const scored = list.filter(r => r.score !== null)
  return {
    totalReviews: totalCount,
    averageScore: scored.length > 0
      ? scored.reduce((sum, r) => sum + r.score!, 0) / scored.length
      : 0,
    scoredCount: scored.length,
  }
}

// 排序参数映射
const sortQueryMap: Record<ReviewSortBy, string> = {
  date_desc: '-created_at',
  date_asc: 'created_at',
  score_desc: '-rating',
  score_asc: 'rating',
}

// Load reviews
const loadReviews = async () => {
  isLoading.value = true
  try {
    const res = await $api<any>('/v1/reviews/mine', {
      params: {
        page: currentPage.value,
        per_page: pageSize.value,
        sort: sortQueryMap[sortBy.value],
      },
    })
    const data = res.reviews ?? res.data?.reviews ?? []
    const pagination = res.pagination ?? res.data?.pagination ?? {}
    reviews.value = data.map(mapReview)
    total.value = pagination.total ?? data.length

    // 用当前数据计算统计
    stats.value = computeStats(reviews.value, total.value)
    statsLoading.value = false
  } catch (error) {
    console.error('Failed to load reviews:', error)
  } finally {
    isLoading.value = false
  }
}

// Score color helper (Metacritic style)
const getScoreColorClass = (score: number): string => {
  if (score >= 7) return 'text-green-500'
  if (score >= 5) return 'text-yellow-500'
  return 'text-red-500'
}

// Event handlers
const handleEdit = (review: UserReview) => {
  editingReview.value = review
  showWriteModal.value = true
}

const handleDelete = (reviewId: number) => {
  deleteConfirm.reviewId = reviewId
  deleteConfirm.show = true
}

const cancelDelete = () => {
  deleteConfirm.show = false
  deleteConfirm.reviewId = 0
}

const confirmDelete = async () => {
  deleteConfirm.loading = true
  try {
    await $api(`/v1/reviews/${deleteConfirm.reviewId}`, { method: 'DELETE' })
    cancelDelete()
    await loadReviews()
  } catch (error) {
    console.error('Failed to delete review:', error)
  } finally {
    deleteConfirm.loading = false
  }
}

const handleSaved = () => {
  closeModal()
  loadReviews()
}

const closeModal = () => {
  showWriteModal.value = false
  editingReview.value = null
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

// Watch sort change -> reset page and reload
watch(sortBy, () => {
  currentPage.value = 1
  loadReviews()
})

watch(currentPage, () => {
  loadReviews()
})

onMounted(() => {
  loadReviews()
})
</script>
