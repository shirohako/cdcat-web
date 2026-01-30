<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="lucide:loader" class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- Empty State -->
    <div v-else-if="reviews.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:message-square-text" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">还没有任何评价</p>
      <p class="text-sm text-gray-400 mb-6">写下你的第一条评价，分享对专辑的看法</p>
      <NuxtLink to="/works" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        发现专辑
      </NuxtLink>
    </div>

    <!-- Reviews List -->
    <div v-else>
      <div class="space-y-4 mb-6 sm:mb-8">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4
                 hover:shadow-md hover:ring-black/10 transition-all duration-200"
        >
          <div class="flex gap-3 sm:gap-4">
            <!-- Album Cover -->
            <NuxtLink
              :to="`/works/${review.workId}`"
              class="shrink-0"
              :aria-label="review.workTitle"
            >
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5">
                <img
                  v-if="review.workImageUrl"
                  :src="review.workImageUrl"
                  :alt="review.workTitle"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                  <Icon name="lucide:disc-3" class="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>
            </NuxtLink>

            <!-- Review Content -->
            <div class="flex-1 min-w-0">
              <!-- Row 1: Album title + Score badge -->
              <div class="flex items-center gap-2 flex-wrap">
                <NuxtLink
                  :to="`/works/${review.workId}`"
                  class="font-semibold text-sm sm:text-base text-gray-900
                         hover:text-blue-700 transition-colors line-clamp-1"
                >
                  {{ review.workTitle }}
                </NuxtLink>
                <!-- Metacritic score badge -->
                <div
                  v-if="review.score !== null"
                  class="inline-flex items-center justify-center w-7 h-7 rounded-md
                         text-xs font-bold text-white shrink-0"
                  :class="getScoreBadgeClass(review.score)"
                >
                  {{ review.score }}
                </div>
              </div>

              <!-- Row 2: Artists -->
              <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {{ review.artists.map(a => a.name).join(', ') }}
              </p>

              <!-- Row 3: Review Content with expand/collapse -->
              <div class="mt-1.5">
                <p
                  class="text-sm text-gray-600 leading-relaxed"
                  :class="{ 'line-clamp-3': !expandedIds.has(review.id) }"
                >
                  {{ review.content }}
                </p>
                <button
                  v-if="isLongContent(review.content)"
                  type="button"
                  class="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
                  @click="toggleExpand(review.id)"
                >
                  {{ expandedIds.has(review.id) ? '收起' : '展开' }}
                </button>
              </div>

              <!-- Row 5: Reactions + Date + Actions -->
              <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400">
                    {{ formatDate(review.createdAt) }}
                    <span
                      v-if="review.updatedAt !== review.createdAt"
                      class="text-gray-300 ml-1"
                    >(已编辑)</span>
                  </span>
                  <!-- Reaction counts -->
                  <div class="flex items-center gap-2.5 text-xs">
                    <span
                      v-if="review.reactions.helpful > 0"
                      class="inline-flex items-center gap-1 text-blue-500"
                      title="有用"
                    >
                      <Icon name="lucide:thumbs-up" class="w-3 h-3" />
                      {{ review.reactions.helpful }}
                    </span>
                    <span
                      v-if="review.reactions.unhelpful > 0"
                      class="inline-flex items-center gap-1 text-red-400"
                      title="无用"
                    >
                      <Icon name="lucide:thumbs-down" class="w-3 h-3" />
                      {{ review.reactions.unhelpful }}
                    </span>
                    <span
                      v-if="review.reactions.funny > 0"
                      class="inline-flex items-center gap-1 text-amber-500"
                      title="欢乐"
                    >
                      <Icon name="lucide:laugh" class="w-3 h-3" />
                      {{ review.reactions.funny }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full
                           transition-colors hover:bg-gray-100"
                    title="编辑"
                    @click="emit('edit', review)"
                  >
                    <Icon name="lucide:pencil" class="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full
                           transition-colors hover:bg-red-50"
                    title="删除"
                    @click="emit('delete', review.id)"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
        <button
          :disabled="currentPage === 1"
          class="btn btn-outline btn-sm gap-1"
          @click="emit('page-change', currentPage - 1)"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4" />
          上一页
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="pageNum in visiblePages"
            :key="pageNum"
            :class="[
              'btn btn-sm',
              currentPage === pageNum ? 'btn-primary' : 'btn-outline'
            ]"
            @click="emit('page-change', pageNum)"
          >
            {{ pageNum }}
          </button>
        </div>

        <button
          :disabled="currentPage === totalPages"
          class="btn btn-outline btn-sm gap-1"
          @click="emit('page-change', currentPage + 1)"
        >
          下一页
          <Icon name="lucide:chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserReview } from '~/types/reviews'

interface Props {
  reviews: UserReview[]
  isLoading: boolean
  total: number
  currentPage: number
  pageSize: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [review: UserReview]
  delete: [reviewId: number]
  'page-change': [page: number]
}>()

// Expand/collapse state
const expandedIds = ref(new Set<number>())

const isLongContent = (content: string): boolean => {
  return content.length > 150
}

const toggleExpand = (id: number) => {
  const newSet = new Set(expandedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  expandedIds.value = newSet
}

// Score badge color (Metacritic style)
const getScoreBadgeClass = (score: number): string => {
  if (score >= 7) return 'bg-green-500'
  if (score >= 5) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Date formatting
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Pagination
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  const half = Math.floor(maxVisible / 2)

  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})
</script>
