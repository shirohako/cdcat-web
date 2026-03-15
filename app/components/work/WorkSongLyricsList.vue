<template>
  <div class="flex-1 overflow-y-auto">

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex items-center justify-center gap-3 py-12 px-6">
      <AlertCircle :size="20" class="text-red-400 shrink-0" />
      <p class="text-sm text-gray-500">加载失败，请重试</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!items.length" class="flex flex-col items-center justify-center py-12 px-6 text-center">
      <FileText :size="36" class="text-gray-200 mb-3" />
      <p class="text-sm font-medium text-gray-500">暂无歌词</p>
      <p class="text-xs text-gray-400 mt-1">点击右上角「提交歌词或翻译」来贡献内容</p>
    </div>

    <!-- List -->
    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer"
        @click="emit('select', item.id)"
      >
        <!-- Avatar -->
        <div class="shrink-0">
          <img
            v-if="item.submitter?.avatar"
            :src="item.submitter.avatar"
            :alt="item.submitter.nickname"
            class="w-8 h-8 rounded-full object-cover"
          />
          <div v-else class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User :size="15" class="text-gray-400" />
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 space-y-1.5">
          <!-- Who -->
          <span class="text-sm font-semibold text-gray-800 truncate">
            {{ item.submitter ? (item.submitter.nickname || item.submitter.username) : '匿名用户' }}
          </span>

          <!-- Language + extra tags -->
          <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              <Globe :size="10" class="shrink-0 text-gray-400" />
              <span class="text-[11px] font-medium">{{ langName(item.language) }}</span>
              <span class="font-mono text-[10px] text-gray-400">({{ item.language }})</span>
            </span>
            <span v-if="item.is_primary" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600">
              <Star :size="8" fill="currentColor" />
              主歌词
            </span>
            <span v-if="item.is_ai_generated" class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600">
              AI 生成
            </span>
            <span
              v-if="item.is_translation && item.authorship"
              class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
              :class="item.authorship === 'original' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'"
            >
              {{ item.authorship === 'original' ? '原创' : '转载' }}
            </span>
            <a
              v-if="item.source"
              :href="item.source"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] text-gray-400 bg-gray-100 hover:text-sky-500 hover:bg-sky-50 transition-colors max-w-40 truncate"
              @click.stop
            >
              <Link2 :size="9" class="shrink-0" />
              <span class="truncate">{{ item.source }}</span>
            </a>
          </div>
        </div>

        <!-- Type + time (far right) -->
        <div class="shrink-0 flex flex-col items-end gap-1.5">
          <span
            class="px-2 py-1 rounded-lg text-xs font-bold"
            :class="item.is_translation ? 'bg-teal-50 text-teal-600' : 'bg-sky-50 text-sky-600'"
          >
            {{ item.is_translation ? '翻译' : '歌词' }}
          </span>
          <span class="text-[11px] text-gray-400 tabular-nums">{{ formatDate(item.created_at) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { LyricsItem } from '~/types/work'
import { FileText, AlertCircle, User, Star, Link2, Globe } from 'lucide-vue-next'

defineProps<{
  pending: boolean
  error: boolean
  items: LyricsItem[]
}>()

const emit = defineEmits<{
  select: [id: number]
}>()


const displayNames = new Intl.DisplayNames(['zh-Hans'], { type: 'language' })
const langName = (code: string) => {
  try { return displayNames.of(code) ?? code }
  catch { return code }
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>
