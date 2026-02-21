<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">通知设置</h2>
        <p class="text-sm text-gray-500 mt-1">管理你的通知方式和接收偏好</p>
      </div>

      <div class="p-10 flex flex-col items-center text-center">
        <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <Bell :size="24" class="text-blue-400" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 mb-1">功能准备中</h3>
        <p class="text-xs text-gray-400 max-w-xs">通知设置功能正在开发中，上线后你可以自定义通知方式和接收偏好。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Bell } from 'lucide-vue-next'
</script>
