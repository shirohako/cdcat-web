<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
        <MessageSquare :size="15" class="text-amber-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('work.section.reviews') }}</h2>
      <span v-if="reviewsCount > 0" class="ml-auto text-xs text-gray-400">共 {{ reviewsCount }} 条</span>
    </div>

    <!-- Empty state -->
    <div v-if="allReviews.length === 0" class="flex items-center justify-center gap-3 py-5 px-6">
      <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
        <MessageSquare :size="15" class="text-amber-400" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-600">{{ $t('work.empty.reviews_title') }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ $t('work.empty.reviews_desc') }}</p>
      </div>
    </div>

    <!-- Review list -->
    <div v-else class="divide-y divide-gray-50/80">
      <div
        v-for="review in allReviews"
        :key="review.id"
        class="px-6 py-5 hover:bg-gray-50/50 transition-colors"
      >
        <!-- Top row: avatar + content + rating -->
        <div class="flex items-center gap-3">
          <NuxtLink :to="`/profile/${review.user.username}`" class="shrink-0">
            <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-white shadow-sm overflow-hidden">
              <UserRound :size="30" class="text-gray-400" />
            </div>
          </NuxtLink>

          <div class="flex-1 min-w-0">
            <!-- Name + date -->
            <div class="flex items-center gap-2 mb-2">
              <NuxtLink
                :to="`/profile/${review.user.username}`"
                class="text-sm font-semibold text-gray-800 hover:text-indigo-600 transition-colors truncate"
              >
                {{ review.user.nickname || review.user.username }}
              </NuxtLink>
              <time class="shrink-0 text-[11px] text-gray-400">{{ formatDate(review.created_at) }}</time>
            </div>

            <!-- Content -->
            <p class="text-sm text-gray-600 leading-relaxed">{{ review.content }}</p>

            <!-- Reactions -->
            <div class="flex items-center gap-1 mt-3">
              <button
                v-for="reaction in reactions"
                :key="reaction.key"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] transition-colors"
                :class="reaction.color"
                @click="reactionDialog.showModal()"
              >
                <component :is="reaction.icon" :size="12" />
                <span>{{ reaction.label }}</span>
                <span v-if="review[reaction.key] > 0">{{ review[reaction.key] }}</span>
              </button>
            </div>
          </div>

          <!-- Metacritic-style rating box -->
          <div
            v-if="review.rating != null"
            class="shrink-0 w-10 h-10 rounded text-base flex items-center justify-center font-black text-white leading-none"
            :class="ratingBadgeClass(review.rating)"
          >
            {{ review.rating }}
          </div>
        </div>
      </div>
    </div>

  <!-- Reaction coming soon dialog -->
  <dialog ref="reactionDialog" class="modal">
    <div class="modal-box max-w-xs p-0 overflow-hidden">
      <div class="flex flex-col items-center gap-4 px-8 pt-8 pb-6 text-center">
        <div class="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shadow-md">
          <Smile :size="24" class="text-white" />
        </div>
        <div>
          <h3 class="font-bold text-gray-900 text-base">功能开发中</h3>
          <p class="text-sm text-gray-400 mt-1.5">敬请期待。</p>
        </div>
        <button class="btn btn-sm w-full bg-gray-900 hover:bg-gray-700 text-white border-0" @click="reactionDialog.close()">知道了</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>

    <!-- Load more -->
    <div v-if="hasMore" class="px-6 py-3.5 border-t border-gray-100 flex justify-center">
      <button
        class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        <span v-if="loadingMore" class="loading loading-spinner loading-xs"></span>
        <ChevronDown v-else :size="13" />
        {{ loadingMore ? '加载中…' : `查看更多 · 还有 ${remaining} 条` }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { MessageSquare, ChevronDown, UserRound, ThumbsUp, ThumbsDown, Smile } from 'lucide-vue-next'

const props = defineProps({
  initialReviews: {
    type: Array,
    default: () => [],
  },
  reviewsCount: {
    type: Number,
    default: 0,
  },
  workId: {
    type: [String, Number],
    required: true,
  },
})

const { $api } = useNuxtApp()

const reactionDialog = ref(null)

const reactions = [
  { key: 'useful_count',  label: '有帮助', icon: ThumbsUp,   color: 'text-blue-400 bg-blue-50 hover:text-blue-600 hover:bg-blue-100' },
  { key: 'dislike_count', label: '没帮助', icon: ThumbsDown, color: 'text-rose-400 bg-rose-50 hover:text-rose-600 hover:bg-rose-100' },
  { key: 'fun_count',     label: '欢乐',   icon: Smile,      color: 'text-green-600 bg-green-50 hover:text-green-700 hover:bg-green-100' },
]

const extraReviews = ref([])

const currentPage = ref(1)

watch(() => props.initialReviews, () => {
  extraReviews.value = []
  currentPage.value = 1
})
const loadingMore = ref(false)

const allReviews = computed(() => [...props.initialReviews, ...extraReviews.value])
const remaining = computed(() => props.reviewsCount - allReviews.value.length)
const hasMore = computed(() => remaining.value > 0)

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const data = await $api(`/v1/works/${props.workId}/reviews`, {
      params: { page: nextPage, per_page: 10 },
    })
    const newReviews = data?.data ?? data ?? []
    extraReviews.value.push(...newReviews)
    currentPage.value = nextPage
  } catch (e) {
    console.error('Failed to load reviews:', e)
  } finally {
    loadingMore.value = false
  }
}

const ratingBadgeClass = (rating) => {
  if (rating >= 8) return 'bg-emerald-500'
  if (rating >= 6) return 'bg-yellow-500'
  if (rating >= 4) return 'bg-orange-500'
  return 'bg-red-600'
}

const formatDate = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diff = (now - date) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
