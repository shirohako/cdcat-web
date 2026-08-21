<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">{{ $t('account_pages.privacy.title') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ $t('account_pages.privacy.description') }}</p>
      </div>

      <div class="p-10 flex flex-col items-center text-center">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <ShieldCheck :size="24" class="text-amber-400" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 mb-1">{{ $t('common.coming_soon') }}</h3>
        <p class="text-xs text-gray-400 max-w-xs">{{ $t('account_pages.privacy.body') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ShieldCheck } from '@lucide/vue'
</script>
