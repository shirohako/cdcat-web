<template>
  <section class="animate-fade-in-up-slow">
    <div class="bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50">
            <Music :size="17" class="text-rose-500" />
          </span>
          <div>
            <h2 class="text-sm font-semibold text-gray-900">{{ $t('profile.favorite_songs') }}</h2>
            <p class="mt-0.5 text-xs text-gray-400">{{ $t('profile.favorite_songs_desc') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="tabular-nums text-2xl font-bold text-gray-900">{{ count }}</span>
          <button
            v-if="count > 0"
            class="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 ring-1 ring-black/5 transition-all hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            @click="$emit('view-all')"
          >
            {{ $t('common.view_all') }}
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ChevronRight, Music } from 'lucide-vue-next'

defineProps({
  count: {
    type: Number,
    required: true
  }
})

defineEmits(['view-all'])
</script>
