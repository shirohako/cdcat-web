<script setup lang="ts">
/** After sign-up: a welcome, the new account (already signed in), and where to go next. */
const { user } = useAuth()
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- A record with a tick -->
    <svg class="size-16" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#1c1a24" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#fff" stroke-opacity=".12" />
      <circle cx="32" cy="32" r="15" fill="none" stroke="#fff" stroke-opacity=".12" />
      <circle cx="32" cy="32" r="9" fill="#25d0c2" />
      <circle cx="32" cy="32" r="2" fill="#1c1a24" />
      <circle cx="50" cy="50" r="11" class="fill-success" stroke="#fff" stroke-width="3" />
      <path d="m45 50 3.5 3.5L55 47" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <AuthStepHead :title="$t('auth.register.done.title')" :lead="$t('auth.register.done.lead')" />
    <div v-if="user" class="flex items-center gap-3 rounded-lg bg-sunken p-3">
      <UiAvatar :src="user.avatar_url" :name="user.nickname" />
      <div class="min-w-0">
        <p class="truncate font-bold text-title">{{ user.nickname }}</p>
        <p class="truncate text-[13px] text-meta">@{{ user.username }}</p>
      </div>
    </div>
    <div class="flex flex-wrap gap-2.5">
      <UiButton to="/" variant="primary" size="lg" class="flex-1 rounded-md">{{ $t('auth.register.done.home') }}</UiButton>
      <UiButton to="/account" size="lg" class="flex-1 rounded-md">{{ $t('auth.register.done.profile') }}</UiButton>
    </div>
    <p class="text-xs text-meta">{{ $t('auth.register.done.tip') }}</p>
  </div>
</template>
