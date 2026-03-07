<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
        <Trophy :size="15" class="text-amber-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">Rankings</h2>
    </div>

    <!-- User Score -->
    <div class="px-6 py-4">
      <div class="flex items-center gap-4">
        <!-- Score box -->
        <div
          class="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-black text-white leading-none shadow-sm"
          :class="ratingCount > 0 ? (userScore >= 100 ? 'text-xl' : 'text-2xl') : 'text-sm tracking-widest'"
          :style="{ backgroundColor: scoreColor }"
        >
          {{ ratingCount > 0 ? Math.round(userScore) : 'TBD' }}
        </div>

        <!-- Labels -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
            <Star :size="13" fill="#eab308" color="#eab308" />
            User Score
          </div>
          <div class="text-sm text-gray-400">
            {{ ratingCount > 0 ? `${ratingCount} 个评分` : '暂无评分' }}
          </div>
        </div>
      </div>

      <!-- Write review button -->
      <div class="mt-4">
        <CommonButtonButton01 class="w-full!" @click="emit('writeReview')">
          写评价
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
  userScore: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
});

const scoreColor = computed(() => {
  if (props.ratingCount === 0) return '#64748b';   // slate-500，TBD
  const s = props.userScore;
  if (s >= 80) return '#059669';   // emerald-600
  if (s >= 65) return '#2563eb';   // blue-600
  if (s >= 50) return '#d97706';   // amber-600
  if (s >= 30) return '#ea580c';   // orange-600
  return '#dc2626';                // red-600
});
</script>
