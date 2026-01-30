<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="emit('close')"
    />

    <!-- Modal Card -->
    <div
      class="relative bg-white rounded-2xl shadow-xl ring-1 ring-black/5
             w-full max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div
        class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4
               rounded-t-2xl flex items-center justify-between z-10"
      >
        <h2 class="text-lg font-bold text-gray-900">
          {{ isEditing ? '编辑评价' : '写评价' }}
        </h2>
        <button
          type="button"
          class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          @click="emit('close')"
        >
          <Icon name="lucide:x" class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-6 space-y-6">
        <!-- 1. Album Selector (create mode only) -->
        <div v-if="!isEditing">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            选择专辑 <span class="text-red-400">*</span>
          </label>

          <!-- Selected album display -->
          <div
            v-if="selectedAlbum"
            class="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl ring-1 ring-blue-200"
          >
            <img
              :src="selectedAlbum.imageUrl"
              :alt="selectedAlbum.title"
              class="w-12 h-12 rounded-md object-cover"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ selectedAlbum.title }}</p>
              <p class="text-xs text-gray-500 truncate">
                {{ selectedAlbum.artists.map(a => a.name).join(', ') }}
              </p>
            </div>
            <button
              type="button"
              class="w-6 h-6 rounded-full hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0"
              @click="selectedAlbum = null"
            >
              <Icon name="lucide:x" class="w-4 h-4 text-blue-500" />
            </button>
          </div>

          <!-- Search input (shown when no album selected) -->
          <template v-else>
            <div class="relative">
              <Icon
                name="lucide:search"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              />
              <input
                v-model="albumQuery"
                type="text"
                class="input input-bordered w-full pl-10 text-sm"
                placeholder="搜索专辑名称或艺术家..."
              />
              <Icon
                v-if="isSearching"
                name="lucide:loader"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin"
              />
            </div>

            <!-- Search results -->
            <div
              v-if="albumResults.length > 0"
              class="mt-2 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto"
            >
              <button
                v-for="album in albumResults"
                :key="album.id"
                type="button"
                class="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50
                       transition-colors text-left border-b border-gray-100 last:border-0"
                @click="selectAlbum(album)"
              >
                <img
                  :src="album.imageUrl"
                  :alt="album.title"
                  class="w-10 h-10 rounded-md object-cover shrink-0"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ album.title }}</p>
                  <p class="text-xs text-gray-500 truncate">
                    {{ album.artists.map(a => a.name).join(', ') }} · {{ album.releaseDate }}
                  </p>
                </div>
              </button>
            </div>

            <!-- No results -->
            <div
              v-else-if="albumQuery.trim() && !isSearching && hasSearched"
              class="mt-2 text-center py-4 text-sm text-gray-400"
            >
              未找到匹配的专辑
            </div>
          </template>
        </div>

        <!-- Edit mode: show album info as read-only -->
        <div v-if="isEditing && review" class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <img
            :src="review.workImageUrl"
            :alt="review.workTitle"
            class="w-12 h-12 rounded-md object-cover"
          />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-900 truncate">{{ review.workTitle }}</p>
            <p class="text-xs text-gray-500 truncate">
              {{ review.artists.map(a => a.name).join(', ') }}
            </p>
          </div>
        </div>

        <!-- 2. Score Input (optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            评分 (0-10)
            <span class="text-gray-400 font-normal ml-1">(可选)</span>
          </label>
          <div class="flex items-center gap-3">
            <!-- Interactive stars -->
            <div class="flex gap-0.5">
              <button
                v-for="i in 10"
                :key="i"
                type="button"
                class="p-0.5 transition-transform hover:scale-110"
                @click="toggleScore(i)"
                @mouseenter="hoverScore = i"
                @mouseleave="hoverScore = null"
              >
                <Icon
                  name="lucide:star"
                  class="w-6 h-6 transition-colors duration-150"
                  :class="getStarClass(i)"
                />
              </button>
            </div>
            <!-- Score display + clear -->
            <div v-if="form.score !== null" class="flex items-center gap-2">
              <span
                class="text-lg font-bold"
                :class="getScoreColorClass(form.score)"
              >
                {{ form.score }}
              </span>
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                @click="form.score = null"
              >
                清除
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Review Content (required) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            评价内容 <span class="text-red-400">*</span>
          </label>
          <textarea
            v-model="form.content"
            class="textarea textarea-bordered w-full text-sm h-40 resize-none"
            placeholder="分享你对这张专辑的想法..."
            maxlength="5000"
          />
          <p class="text-xs text-gray-400 mt-1 text-right">
            {{ form.content.length }} / 5000
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4
               rounded-b-2xl flex items-center justify-end gap-3"
      >
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          type="button"
          :disabled="!canSubmit || isSubmitting"
          class="btn btn-primary btn-sm gap-2"
          @click="handleSubmit"
        >
          <Icon
            v-if="isSubmitting"
            name="lucide:loader"
            class="w-4 h-4 animate-spin"
          />
          {{ isEditing ? '更新评价' : '提交评价' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserReview, SearchableAlbum } from '~/types/reviews'

interface Props {
  review?: UserReview | null
}

const props = withDefaults(defineProps<Props>(), {
  review: null
})

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { searchAlbums, createReview, updateReview } = useReviews()

const isEditing = computed(() => props.review !== null)

// Form state
const form = reactive({
  content: props.review?.content ?? '',
  score: props.review?.score ?? null as number | null
})

// Album search state
const albumQuery = ref('')
const albumResults = ref<SearchableAlbum[]>([])
const selectedAlbum = ref<SearchableAlbum | null>(null)
const isSearching = ref(false)
const hasSearched = ref(false)

// Score hover state
const hoverScore = ref<number | null>(null)

// Submit state
const isSubmitting = ref(false)

const canSubmit = computed(() => {
  if (!form.content.trim()) return false
  if (!isEditing.value && !selectedAlbum.value) return false
  return true
})

// Album search with debounce
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(albumQuery, (query) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (!query.trim()) {
    albumResults.value = []
    hasSearched.value = false
    return
  }
  isSearching.value = true
  searchTimer = setTimeout(async () => {
    albumResults.value = await searchAlbums(query)
    isSearching.value = false
    hasSearched.value = true
  }, 300)
})

const selectAlbum = (album: SearchableAlbum) => {
  selectedAlbum.value = album
  albumQuery.value = ''
  albumResults.value = []
  hasSearched.value = false
}

// Score interaction
const toggleScore = (value: number) => {
  form.score = form.score === value ? null : value
}

const getStarClass = (index: number): string => {
  const activeScore = hoverScore.value ?? form.score
  if (activeScore !== null && index <= activeScore) {
    return 'fill-yellow-400 text-yellow-400'
  }
  return 'text-gray-300'
}

const getScoreColorClass = (score: number): string => {
  if (score >= 7) return 'text-green-500'
  if (score >= 5) return 'text-yellow-500'
  return 'text-red-500'
}

// Submit handler
const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true

  try {
    if (isEditing.value && props.review) {
      await updateReview({
        reviewId: props.review.id,
        content: form.content.trim(),
        score: form.score
      })
    } else if (selectedAlbum.value) {
      await createReview({
        workId: selectedAlbum.value.id,
        content: form.content.trim(),
        score: form.score
      })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save review:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Prevent body scroll when modal is open
onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
  if (searchTimer) clearTimeout(searchTimer)
})
</script>
