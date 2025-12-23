<template>
  <section class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <h3 class="text-lg font-bold p-4 pb-3 flex items-center gap-2 border-b border-gray-100">
      <Trophy :size="20" />
      Rankings
    </h3>

    <!-- Current Album Rankings -->
    <div class="p-4 space-y-3">
      <!-- All-Time Ranking -->
      <div class="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-blue-700 flex items-center gap-1">
            <TrendingUp :size="14" />
            ALL-TIME RANKING
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-bold text-blue-600">#{{ allTimeRank }}</span>
        </div>
        <p class="text-xs text-blue-600 mt-1">Top {{ allTimePercentage }}%</p>
      </div>

      <!-- 2025 Ranking -->
      <div class="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-purple-700 flex items-center gap-1">
            <Sparkles :size="14" />
            2025 NEW RELEASES
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-bold text-purple-600">#{{ year2025Rank }}</span>
        </div>
        <p class="text-xs text-purple-600 mt-1">Top {{ year2025Percentage }}%</p>
      </div>

      <!-- Genre Ranking -->
      <div class="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-green-700 flex items-center gap-1">
            <Music :size="14" />
            {{ genreName }} GENRE
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-bold text-green-600">#{{ genreRank }}</span>
        </div>
        <p class="text-xs text-green-600 mt-1">Top {{ genrePercentage }}%</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Trophy, TrendingUp, Sparkles, Music } from "lucide-vue-next";

const props = defineProps({
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

// 计算百分比
const allTimePercentage = Math.round((props.allTimeRank / props.allTimeTotal) * 100 * 10) / 10;
const year2025Percentage = Math.round((props.year2025Rank / props.year2025Total) * 100 * 10) / 10;
const genrePercentage = Math.round((props.genreRank / props.genreTotal) * 100 * 10) / 10;
</script>
