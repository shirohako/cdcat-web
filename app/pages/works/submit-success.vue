<template>
  <div class="min-h-screen bg-base-100 flex items-center justify-center">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-lg">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <!-- 成功图标 -->
        <div class="mb-6">
          <div class="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle :size="48" class="text-green-500" />
          </div>
        </div>

        <!-- 标题 -->
        <h1 class="text-2xl font-bold text-gray-900 mb-3">
          {{ isUpdate ? 'Update Submitted' : 'Work Submitted' }}
        </h1>

        <!-- 描述 -->
        <p class="text-gray-600 mb-6">
          Your {{ isUpdate ? 'update' : 'work' }} has been submitted successfully and is now pending review.
          It will be visible once approved by our moderators.
        </p>

        <!-- 审核提示 -->
        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8">
          <div class="flex items-start gap-3">
            <Clock :size="20" class="text-blue-500 shrink-0 mt-0.5" />
            <div class="text-left">
              <p class="text-sm text-blue-800 font-medium">Under Review</p>
              <p class="text-sm text-blue-600 mt-1">
                Our team will review your submission shortly. You will be notified once it's approved.
              </p>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <NuxtLink to="/works" class="btn btn-primary flex-1">
            <ArrowLeft :size="18" />
            Browse Works
          </NuxtLink>
          <NuxtLink to="/contribute/work" class="btn btn-outline flex-1">
            <Plus :size="18" />
            Submit Another
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CheckCircle, Clock, ArrowLeft, Plus } from 'lucide-vue-next';

const route = useRoute();

const isUpdate = computed(() => route.query.action === 'update');
</script>
