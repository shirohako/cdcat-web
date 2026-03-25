<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
        <Trophy :size="15" class="text-amber-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('work.section.rankings') }}</h2>
    </div>

    <!-- User Score -->
    <div class="px-6 py-4">
      <div class="flex items-center gap-4">
        <!-- Score box -->
        <div
          class="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-black text-white leading-none shadow-sm"
          :class="ratingCount >= 5 ? (userScore >= 100 ? 'text-xl' : 'text-2xl') : 'text-sm tracking-widest'"
          :style="{ backgroundColor: scoreColor }"
        >
          {{ ratingCount >= 5 ? Math.round(userScore) : 'TBD' }}
        </div>

        <!-- Labels + Rankings -->
        <div class="flex-1 min-w-0 space-y-2">
          <div>
            <div class="flex items-center gap-1 text-sm font-bold text-gray-700 uppercase tracking-wide mb-0.5">
              <Star :size="13" fill="#eab308" color="#eab308" />
              User Score
            </div>
            <div class="text-sm text-gray-400">
              {{ ratingCount >= 5 ? `${ratingCount} 个评分` : ratingCount > 0 ? `${ratingCount}/5 个评分` : $t('work.empty.ratings') }}
            </div>
          </div>

          <!-- Rankings list -->
          <div class="pt-1 border-t border-gray-100">
            <template v-if="allTimeRank || yearRank || genreRank">
              <div class="space-y-1">
                <div v-if="allTimeRank" class="flex items-center justify-between">
                  <span class="text-xs text-gray-400 uppercase tracking-wide">All-Time</span>
                  <span class="text-xs font-bold text-gray-700">#{{ allTimeRank }}</span>
                </div>
                <div v-if="yearRank" class="flex items-center justify-between">
                  <span class="text-xs text-gray-400 uppercase tracking-wide">{{ rankYear }}</span>
                  <span class="text-xs font-bold text-gray-700">#{{ yearRank }}</span>
                </div>
                <div v-if="genreRank" class="flex items-center justify-between">
                  <span class="text-xs text-gray-400 uppercase tracking-wide">{{ genreName }}</span>
                  <span class="text-xs font-bold text-gray-700">#{{ genreRank }}</span>
                </div>
              </div>
            </template>
            <template v-else>
                <div class="flex items-center gap-2 py-1">
                  <div class="flex gap-0.5">
                    <div class="w-5 h-1.5 rounded-full bg-gray-200"></div>
                    <div class="w-3 h-1.5 rounded-full bg-gray-100"></div>
                    <div class="w-4 h-1.5 rounded-full bg-gray-100"></div>
                  </div>
                  <span class="text-xs text-gray-300">{{ $t('work.empty.rankings') }}</span>
                </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Write review button -->
      <div class="mt-4">
        <CommonButtonButton01 class="w-full!" @click="emit('writeReview')">
          {{ $t('work.actions.write_review') }}
          <template #icon><PenLine :size="14" /></template>
        </CommonButtonButton01>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Trophy, Star, PenLine } from "lucide-vue-next";

const emit = defineEmits(['writeReview']);

const props = defineProps({
  userScore: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  allTimeRank: { type: Number, default: null },
  yearRank: { type: Number, default: null },
  rankYear: { type: [String, Number], default: new Date().getFullYear() },
  genreRank: { type: Number, default: null },
  genreName: { type: String, default: null },
});

const scoreColor = computed(() => {
  if (props.ratingCount < 5) return '#1f2937';   // gray-800，TBD
  const s = props.userScore;
  if (s >= 80) return '#059669';   // emerald-600
  if (s >= 65) return '#2563eb';   // blue-600
  if (s >= 50) return '#d97706';   // amber-600
  if (s >= 30) return '#ea580c';   // orange-600
  return '#dc2626';                // red-600
});
</script>
