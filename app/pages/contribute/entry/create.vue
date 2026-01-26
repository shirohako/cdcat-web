<script setup lang="ts">
import { Film, ArrowLeft } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()

// 从查询参数获取导入的数据
const importedData = computed(() => {
  if (route.query.from === 'bangumi' && route.query.data) {
    try {
      return JSON.parse(route.query.data as string)
    } catch {
      return null
    }
  }
  return null
})

// 页面标题
const pageTitle = computed(() => {
  if (importedData.value) {
    return `创建条目 - ${importedData.value.name || '从 Bangumi 导入'}`
  }
  return '创建条目'
})

useHead({
  title: pageTitle
})

// 是否从 Bangumi 导入
const isFromBangumi = computed(() => route.query.from === 'bangumi')
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
      <!-- 页面头部 -->
      <div class="mb-8">
        <NuxtLink
          to="/contribute/entry"
          class="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft class="w-4 h-4" />
          返回选择
        </NuxtLink>

        <div class="flex items-center gap-4">
          <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Film class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">创建新条目</h1>
            <p class="text-gray-600 text-sm">
              <template v-if="isFromBangumi">
                已从 Bangumi 导入数据，请确认并补充信息
              </template>
              <template v-else>
                填写条目信息，提交后将由管理员审核
              </template>
            </p>
          </div>
        </div>

        <!-- Bangumi 导入提示 -->
        <div v-if="isFromBangumi && importedData" class="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
              <Icon name="lucide:download" class="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <p class="font-medium text-pink-800">已从 Bangumi 导入</p>
              <p class="text-sm text-pink-600 mt-1">
                条目数据已自动填充，请检查并补充缺失的信息。
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 表单 -->
      <EntryForm :initial-data="importedData" />
    </div>
  </div>
</template>
