<script setup lang="ts">
import { Film, Download, PenLine, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: '创建条目'
})

const router = useRouter()
const showBangumiModal = ref(false)
const bangumiId = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// 是否可以导入
const canImport = computed(() => !isLoading.value && bangumiId.value.trim().length > 0)

// 打开 Bangumi 导入对话框
const openBangumiModal = () => {
  bangumiId.value = ''
  errorMessage.value = ''
  showBangumiModal.value = true
}

// 从 Bangumi 导入
const importFromBangumi = async () => {
  if (!bangumiId.value.trim()) {
    errorMessage.value = '请输入 Bangumi ID'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const { $api } = useNuxtApp()
    const response = await $api<{ entry: Record<string, any> }>(`/v1/entries/preview/bangumi`, {
      query: { subject_id: bangumiId.value.trim() }
    })

    // 提取 entry 数据，跳转到创建页面
    const entryData = response.entry
    router.push({
      path: '/contribute/entry/create',
      query: { from: 'bangumi', data: JSON.stringify(entryData) }
    })
  } catch (error: any) {
    errorMessage.value = error.data?.message || error.message || '获取 Bangumi 数据失败，请检查 ID 是否正确'
  } finally {
    isLoading.value = false
  }
}

// 从零创建
const createFromScratch = () => {
  router.push('/contribute/entry/create')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-4xl">
      <!-- 页面标题 -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Film class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-3">创建新条目</h1>
        <p class="text-gray-600 max-w-md mx-auto">
          选择一种方式开始创建条目。你可以从 Bangumi 导入现有数据，或者从零开始手动创建。
        </p>
      </div>

      <!-- 选项卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 从 Bangumi 导入 -->
        <button
          type="button"
          class="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-left hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer"
          @click="openBangumiModal"
        >
          <div class="flex items-start gap-4">
            <div class="shrink-0 w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors">
              <Download class="w-7 h-7 text-pink-600" />
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                从 Bangumi 导入
                <ArrowRight class="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </h2>
              <p class="text-gray-600 text-sm leading-relaxed">
                输入 Bangumi ID，自动获取动画、游戏等条目信息，包括名称、简介、封面图等数据。
              </p>
              <div class="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <span class="px-2 py-1 rounded-full bg-gray-100">推荐</span>
                <span>快速导入，减少手动输入</span>
              </div>
            </div>
          </div>
        </button>

        <!-- 从零创建 -->
        <button
          type="button"
          class="group bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-left hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer"
          @click="createFromScratch"
        >
          <div class="flex items-start gap-4">
            <div class="shrink-0 w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <PenLine class="w-7 h-7 text-blue-600" />
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                从零创建
                <ArrowRight class="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </h2>
              <p class="text-gray-600 text-sm leading-relaxed">
                手动填写所有信息，适用于 Bangumi 上没有收录的条目，或需要自定义内容的情况。
              </p>
              <div class="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <span class="px-2 py-1 rounded-full bg-gray-100">完全自定义</span>
                <span>自由度更高</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- 提示信息 -->
      <div class="mt-8 text-center text-sm text-gray-500">
        <p>创建的条目将提交审核，审核通过后会在网站上公开展示。</p>
      </div>
    </div>

    <!-- Bangumi ID 输入对话框 -->
    <dialog :class="['modal', { 'modal-open': showBangumiModal }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">从 Bangumi 导入</h3>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Bangumi ID</span>
            </label>
            <input
              v-model="bangumiId"
              type="text"
              placeholder="输入 Bangumi 条目 ID，例如: 302286"
              class="input input-bordered w-full"
              :disabled="isLoading"
              @keyup.enter="importFromBangumi"
            />
            <label class="label">
              <span class="label-text-alt text-gray-500">
                可在 bangumi.tv 条目页面 URL 中找到 ID
              </span>
            </label>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="isLoading"
            @click="showBangumiModal = false"
          >
            取消
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!canImport"
            @click="importFromBangumi"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
            {{ isLoading ? '获取中...' : '导入' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="showBangumiModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
