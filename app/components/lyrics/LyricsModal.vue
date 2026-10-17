<template>
  <Teleport to="body">
    <div v-if="modelValue && workId" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />
      <div class="relative flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div class="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-6 py-4">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50"><FileText :size="15" class="text-sky-500" /></div>
          <div class="min-w-0">
            <h2 class="text-base font-bold text-gray-900">{{ $t('lyrics_ui.lyrics_and_translations') }}</h2>
            <p v-if="title" class="mt-0.5 truncate text-xs text-gray-400">{{ title }}</p>
          </div>
          <NuxtLink :to="`/works/${workId}`" class="hover:underline ml-auto text-xs text-gray-500" @click="close">{{ $t('works.open') }}</NuxtLink>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100" @click="close"><X :size="18" class="text-gray-400" /></button>
        </div>
        <div class="overflow-y-auto px-6 py-4">
          <LyricsPanel :key="workId" :work-id="workId" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { FileText, X } from '@lucide/vue'

defineProps<{ modelValue: boolean, workId: number | null, title?: string }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
const close = () => emit('update:modelValue', false)
</script>
