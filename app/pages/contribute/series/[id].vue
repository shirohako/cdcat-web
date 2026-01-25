<script setup lang="ts">
import { ArrowLeft, X } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const seriesId = route.params.id as string

// 加载状态
const loading = ref(true)
const loadError = ref('')
const initialData = ref<Record<string, any>>({})

// 加载系列数据
onMounted(async () => {
  try {
    const { $api } = useNuxtApp()
    const data = await $api(`/v1/franchises/${seriesId}`)
    if (data) {
      initialData.value = data as Record<string, any>
    }
  } catch (error: any) {
    console.error('Failed to load series data:', error)
    loadError.value = error.message || '加载失败'
  } finally {
    loading.value = false
  }
})

useHead({
  title: '编辑系列'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink :to="`/series/${seriesId}`" class="btn btn-ghost btn-sm gap-2 mb-4">
          <ArrowLeft class="w-4 h-4" />
          返回系列详情
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">编辑系列</h1>
        <p class="text-gray-500 mt-1">修改系列信息，提交后由管理员审核。</p>
      </div>

      <!-- Loading 状态 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="loadError" class="alert alert-error">
        <X class="w-5 h-5" />
        <span>加载失败: {{ loadError }}</span>
      </div>

      <!-- 表单 -->
      <div v-else class="max-w-5xl">
        <SeriesForm :initial-data="initialData" :series-id="seriesId" />
      </div>
    </div>
  </div>
</template>
