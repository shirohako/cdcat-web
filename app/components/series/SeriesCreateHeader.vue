<template>
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
    <div>
      <p class="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
        <Sparkles class="w-4 h-4" />
        {{ badge }}
      </p>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mt-3">
        {{ title }}
      </h1>
      <p class="text-gray-600 mt-2">
        {{ description }}
      </p>
    </div>

    <NuxtLink class="btn btn-outline btn-sm" :to="backTo">
      {{ backLabel }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'

defineProps({
  badge: {
    type: String,
    default: '新建系列'
  },
  title: {
    type: String,
    default: '创建系列'
  },
  description: {
    type: String,
    default: '填写系列的基础信息和展示素材，提交后将进入审核。'
  },
  backTo: {
    type: String,
    default: '/series'
  },
  backLabel: {
    type: String,
    default: '返回系列列表'
  }
})
</script>
