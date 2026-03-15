<template>
  <div class="flex-1 overflow-y-auto flex flex-col min-h-0">

    <!-- Loading -->
    <div v-if="pending" class="flex-1 flex items-center justify-center py-12">
      <div class="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center gap-3 py-12 px-6">
      <AlertCircle :size="20" class="text-red-400 shrink-0" />
      <p class="text-sm text-gray-500">加载失败，请重试</p>
    </div>

    <template v-else-if="item">
      <!-- Meta bar -->
      <div class="shrink-0 flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
        <!-- Language -->
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
          <Globe :size="11" class="shrink-0 text-gray-400" />
          <span class="text-[11px] font-medium">{{ langName(item.language) }}</span>
          <span class="font-mono text-[10px] text-gray-400">({{ item.language }})</span>
        </span>
        <!-- Type -->
        <span
          class="px-2 py-0.5 rounded text-[11px] font-bold"
          :class="item.is_translation ? 'bg-teal-50 text-teal-600' : 'bg-sky-50 text-sky-600'"
        >{{ item.is_translation ? '翻译' : '歌词' }}</span>
        <!-- Format -->
        <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500 uppercase tracking-wide">{{ item.format }}</span>
        <!-- Badges -->
        <span v-if="item.is_primary" class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-50 text-violet-600">
          <Star :size="9" fill="currentColor" />
          主歌词
        </span>
        <span v-if="item.is_ai_generated" class="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-600">AI 生成</span>
        <span
          v-if="item.is_translation && item.authorship"
          class="px-2 py-0.5 rounded text-[11px] font-semibold"
          :class="item.authorship === 'original' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'"
        >{{ item.authorship === 'original' ? '原创' : '转载' }}</span>
        <!-- Submitter -->
        <div class="ml-auto flex items-center gap-1.5">
          <img
            v-if="item.submitter?.avatar"
            :src="item.submitter.avatar"
            :alt="item.submitter.nickname"
            class="w-4 h-4 rounded-full object-cover"
          />
          <span class="text-[11px] text-gray-400">
            {{ item.submitter ? (item.submitter.nickname || item.submitter.username) : '匿名' }}
          </span>
          <span class="text-[11px] text-gray-300">·</span>
          <span class="text-[11px] text-gray-400 tabular-nums">{{ formatDate(item.created_at) }}</span>
        </div>
      </div>

      <!-- Source -->
      <div v-if="item.source" class="shrink-0 flex items-center gap-1.5 px-5 py-2 border-b border-gray-100 bg-gray-50/50">
        <Link2 :size="11" class="text-gray-400 shrink-0" />
        <a
          :href="item.source"
          target="_blank"
          rel="noopener"
          class="text-[11px] text-gray-400 hover:text-sky-500 transition-colors truncate"
        >{{ item.source }}</a>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-6 min-h-48">
        <!-- Empty content -->
        <div v-if="!item.content" class="flex flex-col items-center justify-center py-10 text-center">
          <FileText :size="32" class="text-gray-200 mb-2" />
          <p class="text-sm text-gray-400">暂无内容</p>
        </div>

        <!-- LRC -->
        <template v-else-if="item.format === 'lrc'">
          <div class="space-y-0.5">
            <div
              v-for="(line, idx) in parsedLrc"
              :key="idx"
              class="flex items-baseline gap-3 py-0.5"
            >
              <span v-if="line.time" class="shrink-0 font-mono text-[10px] text-sky-400/70 w-14 tabular-nums">{{ line.time }}</span>
              <span v-else class="shrink-0 w-14" />
              <span class="text-sm text-gray-800 leading-relaxed">{{ line.text }}</span>
            </div>
          </div>
        </template>

        <!-- Plain / SRT -->
        <pre v-else class="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{{ item.content }}</pre>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { LyricsItem } from '~/types/work'
import { AlertCircle, Globe, Star, Link2, FileText } from 'lucide-vue-next'

const props = defineProps<{
  lyricId: number
}>()

const { $api } = useNuxtApp()

const item = ref<LyricsItem | null>(null)
const pending = ref(false)
const error = ref(false)

const fetchDetail = async () => {
  pending.value = true
  error.value = false
  try {
    item.value = await $api<LyricsItem>(`/v1/lyrics/${props.lyricId}`)
  } catch {
    error.value = true
  } finally {
    pending.value = false
  }
}

watch(() => props.lyricId, fetchDetail, { immediate: true })

// Language name
const displayNames = new Intl.DisplayNames(['zh-Hans'], { type: 'language' })
const langName = (code: string) => {
  try { return displayNames.of(code) ?? code }
  catch { return code }
}

// Date
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// LRC parser
interface LrcLine { time: string | null; text: string }
const parsedLrc = computed<LrcLine[]>(() => {
  if (!item.value?.content) return []
  return item.value.content.split('\n').map(line => {
    const m = line.match(/^\[(\d{2}:\d{2}[.:]\d{2,3})\](.*)$/)
    if (m) return { time: m[1], text: m[2].trim() }
    return { time: null, text: line }
  }).filter(l => l.text || l.time)
})
</script>
