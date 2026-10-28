<template>
  <div class="relative flex min-h-[70vh] items-center justify-center px-4">
    <!-- Decorative background -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-linear-to-br from-btn/40 to-btn/15 blur-3xl" />
      <div class="absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-linear-to-br from-primary/15 to-primary/5 blur-3xl" />
    </div>

    <div class="relative flex flex-col items-center text-center">
      <!-- Ghost avatar -->
      <div class="relative mb-6">
        <div class="flex h-24 w-24 items-center justify-center rounded-full bg-card">
          <UserX :size="40" class="text-meta" />
        </div>
        <div class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-card ring-1 ring-line">
          <SearchX :size="14" class="text-meta" />
        </div>
      </div>

      <!-- Text -->
      <h1 class="text-xl font-semibold tracking-tight text-title">
        {{ $t('profile.not_found') }}
      </h1>
      <p class="mt-2 max-w-xs text-sm leading-relaxed text-meta">
        {{ $t('profile.not_found_desc', { username }) }}
      </p>

      <!-- Actions -->
      <div class="mt-8 flex items-center gap-3">
        <UiButton to="/" variant="primary" :icon="Home">
          {{ $t('common.back_home') }}
        </UiButton>
        <UiButton :icon="ArrowLeft" @click="$router.back()">
          {{ $t('common.go_back') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, Home, SearchX, UserX } from '@lucide/vue'

defineProps({
  username: {
    type: String,
    required: true
  }
})
</script>
