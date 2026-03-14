<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

      <!-- Modal Card -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        <!-- Header -->
        <div class="shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
              <FileText :size="15" class="text-sky-500" />
            </div>
            <div>
              <h2 class="text-base font-bold text-gray-900">歌词</h2>
              <p v-if="songTitle" class="text-xs text-gray-400 mt-0.5">{{ songTitle }}</p>
            </div>
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            @click="close"
          >
            <X :size="18" class="text-gray-400" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-8 flex items-center justify-center">
          <div class="text-center text-gray-400">
            <FileText :size="36" class="mx-auto mb-3 opacity-30" />
            <p class="text-sm font-medium text-gray-500">歌词内容待添加</p>
            <p class="text-xs text-gray-400 mt-1">Song ID: {{ songId }}</p>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { FileText, X } from 'lucide-vue-next'

defineProps<{
  modelValue: boolean
  songId: number | null
  songTitle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const close = () => emit('update:modelValue', false)
</script>
