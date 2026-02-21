<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-red-200/60 overflow-hidden">
      <div class="p-6 pb-5 border-b border-red-100">
        <h2 class="text-base font-semibold text-red-600">危险操作</h2>
        <p class="text-sm text-gray-500 mt-1">以下操作不可逆转，请谨慎操作</p>
      </div>

      <div class="divide-y divide-gray-100">
        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900">导出数据</p>
            <p class="text-xs text-gray-400 mt-0.5">下载你的所有数据的副本</p>
          </div>
          <span class="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">功能准备中</span>
        </div>

        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900">删除账户</p>
            <p class="text-xs text-gray-400 mt-0.5">永久删除你的账户和所有数据，此操作无法撤销</p>
          </div>
          <span class="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">功能准备中</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>
