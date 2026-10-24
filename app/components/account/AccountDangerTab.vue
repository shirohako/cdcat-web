<template>
  <div class="space-y-6">
    <section class="card overflow-hidden ring-1 ring-danger/25">
      <div class="p-6 pb-5 border-b border-danger/25">
        <h2 class="text-base font-semibold text-danger">{{ $t('account_pages.danger.title') }}</h2>
        <p class="text-sm text-meta mt-1">{{ $t('account_pages.danger.description') }}</p>
      </div>

      <div class="divide-y divide-line">
        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-title">{{ $t('account_pages.danger.export') }}</p>
            <p class="text-xs text-meta mt-0.5">{{ $t('account_pages.danger.export_hint') }}</p>
          </div>
          <span class="text-xs text-meta bg-sunken px-2.5 py-1 rounded-full font-medium">{{ $t('common.coming_soon') }}</span>
        </div>

        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-title">{{ $t('account_pages.danger.delete') }}</p>
            <p class="text-xs text-meta mt-0.5">{{ $t('account_pages.danger.delete_hint') }}</p>
          </div>
          <span class="text-xs text-meta bg-sunken px-2.5 py-1 rounded-full font-medium">{{ $t('common.coming_soon') }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>
