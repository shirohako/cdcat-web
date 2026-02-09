<template>
  <section class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <h3 class="text-lg font-bold p-4 pb-3 flex items-center gap-2 border-b border-gray-100">
      <Trophy :size="20" />
      Rankings
    </h3>

    <!-- User Score + Rankings -->
    <div class="p-3 space-y-2">
      <!-- User Score -->
      <div class="rounded-lg px-3 py-2 border flex items-center gap-3" :class="scoreBorderClass">
        <div
          class="w-11 h-11 rounded-md flex items-center justify-center text-white font-bold text-xl shrink-0"
          :style="{ backgroundColor: scoreColor }"
        >
          {{ userScore.toFixed(1) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <Star :size="12" />
            USER SCORE
          </div>
          <div class="text-xs text-gray-500 mt-0.5">{{ ratingCount }} ratings</div>
        </div>
        <button
          class="shrink-0 text-xs font-medium text-gray-500 hover:text-primary
                 border border-gray-200 hover:border-primary/50
                 rounded-full px-3 py-1.5 transition-colors flex items-center gap-1"
          @click="emit('writeReview')"
        >
          <Pencil :size="12" />
          写评价
        </button>
      </div>

      <!-- All-Time Ranking -->
      <div class="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg px-3 py-2 border border-blue-200">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold text-blue-700 flex items-center gap-1">
            <TrendingUp :size="12" />
            ALL-TIME RANKING
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-blue-600">#{{ allTimeRank }}</span>
          <span class="text-xs text-blue-600">Top {{ allTimePercentage }}%</span>
        </div>
      </div>

      <!-- 2025 Ranking -->
      <div class="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg px-3 py-2 border border-purple-200">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold text-purple-700 flex items-center gap-1">
            <Sparkles :size="12" />
            2025 NEW RELEASES
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-purple-600">#{{ year2025Rank }}</span>
          <span class="text-xs text-purple-600">Top {{ year2025Percentage }}%</span>
        </div>
      </div>

      <!-- Genre Ranking -->
      <div class="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg px-3 py-2 border border-green-200">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold text-green-700 flex items-center gap-1">
            <Music :size="12" />
            {{ genreName }} GENRE
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-green-600">#{{ genreRank }}</span>
          <span class="text-xs text-green-600">Top {{ genrePercentage }}%</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Trophy, TrendingUp, Sparkles, Music, Star, Pencil } from "lucide-vue-next";

const emit = defineEmits(['writeReview']);

const props = defineProps({
  userScore: {
    type: Number,
    default: 7.8,
  },
  ratingCount: {
    type: Number,
    default: 234,
  },
  allTimeRank: {
    type: Number,
    default: 142,
  },
  allTimeTotal: {
    type: Number,
    default: 15234,
  },
  year2025Rank: {
    type: Number,
    default: 8,
  },
  year2025Total: {
    type: Number,
    default: 856,
  },
  genreRank: {
    type: Number,
    default: 23,
  },
  genreTotal: {
    type: Number,
    default: 2341,
  },
  genreName: {
    type: String,
    default: "Rock",
  },
});

// 评分颜色 - Metacritic 风格：高分蓝/绿，中等黄，低分红
const scoreColor = computed(() => {
  const s = props.userScore;
  if (s >= 8) return '#1e88e5';      // 蓝色
  if (s >= 6.5) return '#43a047';    // 绿色
  if (s >= 5) return '#f9a825';      // 黄色
  if (s >= 3) return '#ef6c00';      // 橙色
  return '#e53935';                   // 红色
});

const scoreBorderClass = computed(() => {
  const s = props.userScore;
  if (s >= 8) return 'border-blue-200 bg-blue-50/50';
  if (s >= 6.5) return 'border-green-200 bg-green-50/50';
  if (s >= 5) return 'border-yellow-200 bg-yellow-50/50';
  if (s >= 3) return 'border-orange-200 bg-orange-50/50';
  return 'border-red-200 bg-red-50/50';
});

// 计算百分比
const allTimePercentage = Math.round((props.allTimeRank / props.allTimeTotal) * 100 * 10) / 10;
const year2025Percentage = Math.round((props.year2025Rank / props.year2025Total) * 100 * 10) / 10;
const genrePercentage = Math.round((props.genreRank / props.genreTotal) * 100 * 10) / 10;
</script>
