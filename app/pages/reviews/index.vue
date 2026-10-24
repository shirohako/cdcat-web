<template>
  <div class="min-h-screen">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-6xl 2xl:max-w-7xl">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-title tracking-tight">{{ t('collection_pages.reviews.title') }}</h1>
        <p class="mt-1.5 text-sm text-meta">{{ t('collection_pages.reviews.description') }}</p>
      </div>

      <!-- Stats Cards -->
      <SkeletonStatus v-if="statsLoading" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div v-for="i in 3" :key="i" class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="skeleton h-4 w-20 rounded" />
              <div class="skeleton mt-3 h-9 w-12 rounded" />
            </div>
            <div class="skeleton size-12 rounded-full" />
          </div>
        </div>
      </SkeletonStatus>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <!-- Total Reviews -->
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-meta">{{ t('collection_pages.reviews.total') }}</p>
              <p class="text-3xl font-bold text-title mt-2">{{ stats.totalReviews }}</p>
            </div>
            <Icon name="lucide:message-square-text" class="w-12 h-12 text-primary/25" />
          </div>
        </div>

        <!-- Ratings on this page, per level -->
        <div class="card p-6">
          <p class="text-sm text-meta">{{ t('reviews.page_ratings') }}</p>
          <div v-if="stats.scoredCount" class="mt-3 flex flex-wrap gap-1.5">
            <template v-for="value in REVIEW_RATINGS" :key="value">
              <span v-if="stats.byRating[value]" class="rounded-full px-2 py-0.5 text-xs font-medium ring-1" :class="reviewRatingTone(value)">
                {{ t(reviewRatingKey(value)) }} {{ stats.byRating[value] }}
              </span>
            </template>
          </div>
          <p v-else class="text-3xl font-bold text-title mt-2">--</p>
        </div>

        <!-- Scored Reviews -->
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-meta">{{ t('reviews.page_rated') }}</p>
              <p class="text-3xl font-bold text-title mt-2">{{ stats.scoredCount }}</p>
            </div>
            <Icon name="lucide:hash" class="w-12 h-12 text-success/25" />
          </div>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="card overflow-hidden">
        <!-- Sort Bar -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-line">
          <p class="text-sm text-meta">
            {{ t('collection_pages.reviews.count', { count: total }) }}
          </p>
          <select
            v-model="sortBy"
            class="select select-sm text-sm"
          >
            <option value="date_desc">{{ t('collection_pages.reviews.sort_newest') }}</option>
            <option value="date_asc">{{ t('collection_pages.reviews.sort_oldest') }}</option>
            <option value="score_desc">{{ t('reviews.sort.liked_most') }}</option>
            <option value="score_asc">{{ t('reviews.sort.liked_least') }}</option>
          </select>
        </div>

        <!-- Error State -->
        <div v-if="loadError" class="px-6 py-4 text-sm text-danger">
          {{ loadError }}
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
          <div class="relative w-full max-w-sm rounded-2xl bg-card p-6 text-body shadow-overlay ring-1 ring-line">
            <div class="flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mb-4">
                <Icon name="lucide:trash-2" class="w-6 h-6 text-danger" />
              </div>
              <h3 class="text-lg font-bold text-title">{{ t('collection_pages.reviews.delete_title') }}</h3>
              <p class="text-sm text-meta mt-2">{{ t('collection_pages.reviews.delete_confirm') }}</p>
            </div>
            <div class="flex gap-3 mt-6">
              <button
                type="button"
                class="btn btn-ghost btn-sm flex-1"
                :disabled="deleteConfirm.loading"
                @click="cancelDelete"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                class="btn btn-error btn-sm flex-1 gap-2"
                :disabled="deleteConfirm.loading"
                @click="confirmDelete"
              >
                <Icon v-if="deleteConfirm.loading" name="lucide:loader" class="w-4 h-4 animate-spin" />
                {{ t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Edit Review Modal -->
      <ReviewEditorModal
        v-if="editingReview"
        :key="editingReview.album_id"
        :review="editingReview"
        @close="closeModal"
        @saved="handleSaved"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumReview, ReviewDraft, ReviewPage, ReviewRating } from '~/types/reviews'
import ReviewsList from '~/components/review/ReviewsList.vue'

type SortBy = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
const { localizeError } = useLocalizedApiError()

useHead({ title: computed(() => t('collection_pages.reviews.seo_title')) })

const { $api } = useNuxtApp()

// State
const reviews = ref<AlbumReview[]>([])
// True from the start, so the empty state doesn't show before the first load.
const isLoading = ref(true)
const statsLoading = ref(true)
const loadError = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const sortBy = ref<SortBy>('date_desc')
const editingReview = ref<ReviewDraft | null>(null)
const deleteConfirm = reactive({ show: false, reviewId: 0, loading: false })

// Totals come from the server; ratings per level only cover the loaded page.
const stats = computed(() => {
  const byRating: Partial<Record<ReviewRating, number>> = {}
  for (const review of reviews.value) {
    if (review.rating) byRating[review.rating] = (byRating[review.rating] ?? 0) + 1
  }
  return { totalReviews: total.value, scoredCount: reviews.value.filter(r => r.rating).length, byRating }
})

const sortQueryMap: Record<SortBy, string> = {
  date_desc: '-created_at',
  date_asc: 'created_at',
  score_desc: '-rating',
  score_asc: 'rating',
}

// Load reviews
const loadReviews = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await $api<Omit<ReviewPage, 'mine'>>('/v1/me/reviews', {
      params: {
        page: currentPage.value,
        per_page: pageSize.value,
        sort: sortQueryMap[sortBy.value],
      },
    })
    reviews.value = res.reviews
    total.value = res.pagination.total
  } catch (error) {
    console.error('Failed to load reviews:', error)
    loadError.value = localizeError(error, 'collection_pages.reviews.load_failed')
  } finally {
    isLoading.value = false
    statsLoading.value = false
  }
}

// Event handlers
const handleEdit = (review: AlbumReview) => {
  editingReview.value = {
    album_id: review.album_id, content: review.content, rating: review.rating, language: review.language,
    album: { id: review.album_id, title: review.album?.title ?? '', image_url: review.album?.image_url ?? null },
  }
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
  editingReview.value = null
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

// Watch sort change -> reset page and reload (moving back to page 1 already reloads)
watch(sortBy, () => {
  if (currentPage.value !== 1) currentPage.value = 1
  else loadReviews()
})

watch(currentPage, () => {
  loadReviews()
})

// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) loadReviews()
else onMounted(loadReviews)
</script>
