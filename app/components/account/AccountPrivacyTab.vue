<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">隐私设置</h2>
        <p class="text-sm text-gray-500 mt-1">控制你的个人信息可见性和数据隐私</p>
      </div>

      <div class="p-10 flex flex-col items-center text-center">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <ShieldCheck :size="24" class="text-amber-400" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 mb-1">功能准备中</h3>
        <p class="text-xs text-gray-400 max-w-xs">隐私设置功能正在开发中，上线后你可以精细控制个人信息的可见范围。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ShieldCheck } from 'lucide-vue-next'
</script>
