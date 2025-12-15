<template>
  <section class="bg-white rounded-lg border border-gray-200 p-6">
    <div class="text-center mb-4">
      <div class="text-5xl font-bold text-green-500 mb-2">{{ rating }}</div>
      <p class="text-sm text-gray-500">{{ ratingText }}</p>
      <p class="text-xs text-gray-400">基于 {{ reviewCount }} 位用户评价</p>
    </div>
    <div class="flex justify-center gap-2 mb-4">
      <Star
        v-for="i in 5"
        :key="i"
        :size="24"
        :fill="i <= filledStars ? 'currentColor' : 'none'"
        :class="i <= filledStars ? 'text-yellow-400' : 'text-gray-300'"
      />
    </div>
    <button class="btn btn-primary btn-block gap-2">
      <MessageCircle :size="18" />
      Post My Review
    </button>
  </section>
</template>

<script setup>
import { Star, MessageCircle } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps({
  rating: {
    type: Number,
    required: true,
  },
  ratingText: {
    type: String,
    default: "非常好评",
  },
  reviewCount: {
    type: Number,
    required: true,
  },
});

const filledStars = computed(() => Math.floor((props.rating / 10) * 5));
</script>
