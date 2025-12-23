<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
      <MessageSquare :size="24" />
      User Reviews
    </h2>

    <!-- Summary Section -->
    <div class="mb-6 pb-6 border-b border-gray-200">
      <div class="flex items-center gap-6">
        <div class="text-center">
          <div class="text-5xl font-bold mb-1" :class="getScoreColorClass(averageScore)">
            {{ averageScore.toFixed(1) }}
          </div>
          <div class="text-sm text-gray-500">Based on {{ reviews.length }} reviews</div>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <div class="flex gap-0.5">
              <Star
                v-for="i in 10"
                :key="i"
                :size="16"
                :class="i <= Math.round(averageScore) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
              />
            </div>
            <span class="text-sm text-gray-600 font-medium">{{ averageScore.toFixed(1) }}/10</span>
          </div>
          <div class="text-xs text-gray-500">
            {{ getScoreLabel(averageScore) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="space-y-3">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
      >
        <div class="flex gap-3">
          <!-- User Avatar -->
          <div class="shrink-0">
            <div class="w-11 h-11 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span class="text-lg font-semibold text-white">{{ getUserInitial(review.author) }}</span>
            </div>
          </div>

          <!-- Review Content -->
          <div class="flex-1 min-w-0">
            <!-- Header: Author, Score, Date -->
            <div class="flex items-center gap-2 mb-2">
              <h4 class="font-bold text-gray-900">{{ review.author }}</h4>

              <!-- Score Badge (Metacritic style) - Optional -->
              <div
                v-if="review.score !== null && review.score !== undefined"
                class="badge gap-1 font-bold text-white border-0 px-2.5 py-2.5"
                :class="getScoreBadgeClass(review.score)"
              >
                {{ review.score }}
              </div>

              <span class="text-xs text-gray-400 ml-auto">{{ review.date }}</span>
            </div>

            <!-- Review Title -->
            <h5 v-if="review.title" class="font-semibold text-gray-800 mb-1.5 text-sm">
              {{ review.title }}
            </h5>

            <!-- Review Content -->
            <p class="text-sm text-gray-600 leading-relaxed">{{ review.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <p v-if="reviews.length === 0" class="text-gray-500 text-sm">No reviews yet.</p>
  </section>
</template>

<script setup>
import { MessageSquare, Star } from "lucide-vue-next";

const props = defineProps({
  reviews: {
    type: Array,
    default: () => [],
  },
});

// 计算平均分 (0-10 分制) - 只计算有分数的评论
const averageScore = computed(() => {
  const scoredReviews = props.reviews.filter(r => r.score !== null && r.score !== undefined);
  if (scoredReviews.length === 0) return 0;
  const sum = scoredReviews.reduce((acc, review) => acc + review.score, 0);
  return sum / scoredReviews.length;
});

// 获取用户名首字母作为头像
const getUserInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

// Metacritic 风格的评分徽章颜色 (0-10 分制)
const getScoreBadgeClass = (score) => {
  if (score >= 7) return 'bg-green-500';
  if (score >= 5) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getScoreColorClass = (score) => {
  if (score >= 7) return 'text-green-500';
  if (score >= 5) return 'text-yellow-500';
  return 'text-red-500';
};

const getScoreLabel = (score) => {
  if (score >= 7) return 'Generally favorable reviews';
  if (score >= 5) return 'Mixed or average reviews';
  return 'Generally unfavorable reviews';
};
</script>