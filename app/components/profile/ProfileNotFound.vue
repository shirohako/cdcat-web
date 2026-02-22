<template>
  <div class="relative flex min-h-[70vh] items-center justify-center px-4">
    <!-- Decorative background -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-linear-to-br from-slate-200/40 to-gray-200/20 blur-3xl" />
      <div class="absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-linear-to-br from-blue-200/30 to-indigo-200/15 blur-3xl" />
    </div>

    <div class="relative flex flex-col items-center text-center">
      <!-- Ghost avatar -->
      <div class="relative mb-6">
        <div class="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-gray-100 to-slate-200 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)]">
          <UserX :size="40" class="text-slate-400" />
        </div>
        <div class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5">
          <SearchX :size="14" class="text-slate-400" />
        </div>
      </div>

      <!-- Text -->
      <h1 class="text-xl font-semibold tracking-tight text-slate-800">
        {{ $t('profile.not_found') }}
      </h1>
      <p class="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
        {{ $t('profile.not_found_desc', { username }) }}
      </p>

      <!-- Actions -->
      <div class="mt-8 flex items-center gap-3">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
        >
          <Home :size="15" />
          {{ $t('common.back_home') }}
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:shadow-md"
          @click="$router.back()"
        >
          <ArrowLeft :size="15" />
          {{ $t('common.go_back') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, Home, SearchX, UserX } from 'lucide-vue-next'

defineProps({
  username: {
    type: String,
    required: true
  }
})
</script>
