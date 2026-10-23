<template>
  <div class="p-4 sm:p-6 md:p-8">
    <!-- Loading State: until there is something to show -->
    <SkeletonRows v-if="isLoading && !reviews.length" page :count="4" thumb="square" cards />

    <!-- Empty State -->
    <div v-else-if="reviews.length === 0" class="flex flex-col items-center justify-center py-16">
      <Icon name="lucide:message-square-text" class="w-16 h-16 text-gray-300 mb-4" />
      <p class="text-lg text-gray-500 mb-2">{{ $t('reviews.mine_empty') }}</p>
      <p class="text-sm text-gray-400 mb-6">{{ $t('reviews.mine_empty_hint') }}</p>
      <NuxtLink to="/albums" class="btn btn-primary btn-sm gap-2">
        <Icon name="lucide:search" class="w-4 h-4" />
        {{ $t('reviews.discover_albums') }}
      </NuxtLink>
    </div>

    <!-- Reviews List: dimmed while another page loads -->
    <div v-else class="transition-opacity" :class="{ 'pointer-events-none opacity-60': isLoading }" :inert="isLoading">
      <div class="mb-4 space-y-4 sm:mb-5">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="bg-white rounded-xl shadow-sm ring-1 ring-black/5 p-4
                 hover:shadow-md hover:ring-black/10 transition-all duration-200"
        >
          <div class="flex gap-3 sm:gap-4">
            <!-- Album Cover -->
            <NuxtLink
              :to="`/albums/${review.album_id}`"
              class="shrink-0"
              :aria-label="review.album?.title"
            >
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5">
                <img
                  v-if="review.album?.image_url"
                  :src="review.album.image_url"
                  :alt="review.album.title"
                  class="w-full h-full object-cover"
                  loading="lazy"
                >
                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                  <Icon name="lucide:disc-3" class="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>
            </NuxtLink>

            <!-- Review Content -->
            <div class="flex-1 min-w-0">
              <!-- Row 1: Album title + rating -->
              <div class="flex items-center gap-2 flex-wrap">
                <NuxtLink
                  :to="`/albums/${review.album_id}`"
                  class="font-semibold text-sm sm:text-base text-gray-900
                         hover:text-blue-700 transition-colors line-clamp-1"
                >
                  {{ review.album?.title }}
                </NuxtLink>
                <span v-if="review.rating" class="rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 shrink-0" :class="reviewRatingTone(review.rating)">
                  {{ $t(reviewRatingKey(review.rating)) }}
                </span>
                <span v-if="review.is_hidden" class="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 shrink-0" :title="$t('reviews.hidden_hint')">
                  {{ $t('reviews.hidden') }}
                </span>
              </div>

              <!-- Row 2: Review content with expand/collapse -->
              <div class="mt-1.5">
                <div class="relative" :class="{ 'max-h-24 overflow-hidden': isLongContent(review.content) && !expandedIds.has(review.id) }">
                  <RichContent :content="review.content" format="markdown" class="text-sm" />
                  <div v-if="isLongContent(review.content) && !expandedIds.has(review.id)" class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white" />
                </div>
                <button
                  v-if="isLongContent(review.content)"
                  type="button"
                  class="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
                  @click="toggleExpand(review.id)"
                >
                  {{ $t(expandedIds.has(review.id) ? 'reviews.collapse' : 'reviews.expand') }}
                </button>
              </div>

              <!-- Row 5: Reactions + Date + Actions -->
              <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-400">
                    {{ formatDate(review.created_at) }}
                    <span
                      v-if="review.updated_at !== review.created_at"
                      class="text-gray-300 ml-1"
                    >({{ $t('reviews.edited') }})</span>
                  </span>
                  <!-- Reaction counts -->
                  <div class="flex items-center gap-2.5 text-xs">
                    <span
                      v-if="review.useful_count > 0"
                      class="inline-flex items-center gap-1 text-blue-500"
                      :title="$t('reviews.reactions.useful')"
                    >
                      <Icon name="lucide:thumbs-up" class="w-3 h-3" />
                      {{ review.useful_count }}
                    </span>
                    <span
                      v-if="review.dislike_count > 0"
                      class="inline-flex items-center gap-1 text-red-400"
                      :title="$t('reviews.reactions.dislike')"
                    >
                      <Icon name="lucide:thumbs-down" class="w-3 h-3" />
                      {{ review.dislike_count }}
                    </span>
                    <span
                      v-if="review.fun_count > 0"
                      class="inline-flex items-center gap-1 text-amber-500"
                      :title="$t('reviews.reactions.fun')"
                    >
                      <Icon name="lucide:laugh" class="w-3 h-3" />
                      {{ review.fun_count }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full
                           transition-colors hover:bg-gray-100"
                    :title="$t('common.edit')"
                    @click="emit('edit', review)"
                  >
                    <Icon name="lucide:pencil" class="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full
                           transition-colors hover:bg-red-50"
                    :title="$t('common.delete')"
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

      <CommonPagination
        :page="currentPage"
        :total-pages="totalPages"
        :disabled="isLoading"
        @update:page="emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumReview } from '~/types/reviews'

interface Props {
  reviews: AlbumReview[]
  isLoading: boolean
  total: number
  currentPage: number
  pageSize: number
}

const props = defineProps<Props>()
const { formatDate } = useLocaleFormatting()

const emit = defineEmits<{
  edit: [review: AlbumReview]
  delete: [reviewId: number]
  'page-change': [page: number]
}>()

// Expand/collapse state
const expandedIds = ref(new Set<number>())

const isLongContent = (content: string): boolean => {
  return content.length > 200 || content.split('\n').length > 4
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

// Pagination
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
</script>
