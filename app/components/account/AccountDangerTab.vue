<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-red-200/60 overflow-hidden">
      <div class="p-6 pb-5 border-b border-red-100">
        <h2 class="text-base font-semibold text-red-600">{{ $t('account_pages.danger.title') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ $t('account_pages.danger.description') }}</p>
      </div>

      <div class="divide-y divide-gray-100">
        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ $t('account_pages.danger.export') }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ $t('account_pages.danger.export_hint') }}</p>
          </div>
          <span class="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{{ $t('common.coming_soon') }}</span>
        </div>

        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ $t('account_pages.danger.delete') }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ $t('account_pages.danger.delete_hint') }}</p>
          </div>
          <span class="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">{{ $t('common.coming_soon') }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>
