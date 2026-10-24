<script setup lang="ts">
import type { UserSummary } from '~/types/catalog'

/** A user's avatar, or their initial on a colour picked from the username. */
const props = withDefaults(defineProps<{ user: Pick<UserSummary, 'username' | 'nickname' | 'avatar_url'> | null, size?: 'xs' | 'sm' | 'md' | 'lg' }>(), { size: 'md' })
const SIZES = { xs: 'size-5 text-[10px]', sm: 'size-7 text-xs', md: 'size-9 text-sm', lg: 'size-11 text-base' }
const TONES = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-fuchsia-500']
const initial = computed(() => (props.user?.nickname || props.user?.username || '?').trim().charAt(0).toUpperCase())
const tone = computed(() => {
  const name = props.user?.username ?? ''
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
})
</script>

<template>
  <span class="inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white" :class="[SIZES[size], user?.avatar_url ? 'bg-sunken' : tone]">
    <img v-if="user?.avatar_url" :src="user.avatar_url" :alt="user.nickname || user.username" class="size-full object-cover" loading="lazy" referrerpolicy="no-referrer">
    <span v-else aria-hidden="true">{{ initial }}</span>
  </span>
</template>
