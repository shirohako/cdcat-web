<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleBackdropClick" />

      <!-- Modal Card -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">

        <!-- Header -->
        <div class="shrink-0 px-6 py-4 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 min-w-0">
              <!-- Back button (detail / create view) -->
              <button
                v-if="showCreate || activeDetailId !== null"
                type="button"
                class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
                @click="showCreate ? (showCreate = false) : (activeDetailId = null)"
              >
                <ChevronLeft :size="18" class="text-gray-500" />
              </button>
              <div v-else class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <FileText :size="15" class="text-sky-500" />
              </div>
              <div class="min-w-0">
                <h2 class="text-base font-bold text-gray-900">
                  {{ showCreate ? '提交歌词' : activeDetailId !== null ? '歌词详情' : '歌词 & 翻译' }}
                </h2>
                <p v-if="songTitle" class="text-xs text-gray-400 mt-0.5 truncate">{{ songTitle }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <!-- Action buttons: visible on sm+ only -->
              <template v-if="!showCreate && activeDetailId === null">
                <button
                  type="button"
                  @click="fileInputRef?.click()"
                  class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors"
                >
                  <Upload :size="13" />
                  上传文件
                </button>
                <button
                  type="button"
                  @click="openCreate()"
                  class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition-colors"
                >
                  <Plus :size="13" />
                  提交歌词或翻译
                </button>
              </template>
              <button
                type="button"
                class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                @click="close()"
              >
                <X :size="18" class="text-gray-400" />
              </button>
            </div>
          </div>
          <!-- Action buttons: mobile only, below title row -->
          <div v-if="!showCreate && activeDetailId === null" class="sm:hidden flex gap-2 mt-3">
            <button
              type="button"
              @click="fileInputRef?.click()"
              class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors"
            >
              <Upload :size="13" />
              上传文件
            </button>
            <button
              type="button"
              @click="openCreate()"
              class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold transition-colors"
            >
              <Plus :size="13" />
              提交歌词或翻译
            </button>
          </div>
        </div>

        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".txt,.lrc,.srt"
          class="hidden"
          @change="handleFileUpload"
        />

        <!-- Filter tabs -->
        <div v-if="!showCreate && activeDetailId === null" class="shrink-0 flex items-center gap-1 px-5 py-2.5 border-b border-gray-100">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            @click="setFilter(tab.value)"
            class="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
            :class="activeFilter === tab.value
              ? 'bg-sky-500 text-white'
              : 'text-gray-500 hover:bg-gray-100'"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- List view -->
        <WorkSongLyricsList
          v-if="!showCreate && activeDetailId === null"
          :pending="pending"
          :error="fetchError"
          :items="lyricsList"
          @select="activeDetailId = $event"
        />

        <!-- Detail view -->
        <WorkSongLyricsDetail
          v-else-if="!showCreate && activeDetailId !== null"
          :lyric-id="activeDetailId"
        />

        <!-- Create form -->
        <WorkSongLyricsForm
          v-else
          :song-id="songId"
          :uploaded-file-name="uploadedFileName"
          :initial-values="formInitialValues"
          @submitted="onSubmitted"
          @cancel="showCreate = false"
        />

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { LyricsItem, LyricsFormData } from '~/types/work'
import { FileText, X, Plus, Upload, ChevronLeft } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  songId: number | null
  songTitle?: string
  initialFilter?: '' | 'lyric' | 'translation'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { $api } = useNuxtApp()
const { isAuthenticated } = useAuth()
const route = useRoute()

const showCreate = ref(false)
const activeDetailId = ref<number | null>(null)
const uploadedFileName = ref<string | null>(null)
const formInitialValues = ref<Partial<LyricsFormData>>({})
const fileInputRef = ref<HTMLInputElement | null>(null)

// ── Filter ──
type FilterValue = '' | 'lyric' | 'translation'

const tabs: { label: string; value: FilterValue }[] = [
  { label: '全部', value: '' },
  { label: '歌词', value: 'lyric' },
  { label: '翻译', value: 'translation' },
]

const activeFilter = ref<FilterValue>('')

const setFilter = (val: FilterValue) => {
  activeFilter.value = val
  fetchLyrics()
}

// ── Fetch lyrics list ──
const lyricsList = ref<LyricsItem[]>([])
const pending = ref(false)
const fetchError = ref(false)

const fetchLyrics = async () => {
  if (!props.songId) return
  pending.value = true
  fetchError.value = false
  try {
    const params = activeFilter.value ? `?type=${activeFilter.value}` : ''
    const data = await $api<{ lyrics: LyricsItem[] }>(`/v1/songs/${props.songId}/lyrics${params}`)
    lyricsList.value = data?.lyrics ?? []
  } catch {
    fetchError.value = true
  } finally {
    pending.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    showCreate.value = false
    activeDetailId.value = null
    uploadedFileName.value = null
    formInitialValues.value = {}
    activeFilter.value = props.initialFilter ?? ''
    fetchLyrics()
  }
})

watch(showCreate, (val) => {
  if (!val) uploadedFileName.value = null
})

// ── File upload ──
const guessLanguage = (name: string): string => {
  const lower = name.toLowerCase()
  if (/\bja[-_]?latn\b/.test(lower)) return 'ja-Latn'
  if (/\bzh[-_]?hant\b/.test(lower)) return 'zh-Hant'
  if (/\bzh[-_]?hans\b/.test(lower) || /\bzh[-_]?cn\b/.test(lower) || /\bchinese\b/.test(lower)) return 'zh-Hans'
  if (/\bja(p(anese)?)?\b/.test(lower)) return 'ja'
  if (/\bko(rean)?\b/.test(lower)) return 'ko'
  if (/\ben(g(lish)?)?\b/.test(lower)) return 'en'
  return ''
}

const handleFileUpload = async (e: Event) => {
  if (!await requireAuth()) return
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (fileInputRef.value) fileInputRef.value.value = ''

  const ext = file.name.split('.').pop()?.toLowerCase()
  const format = ext === 'lrc' ? 'lrc' : ext === 'srt' ? 'srt' : 'plain'
  const language = guessLanguage(file.name)

  const reader = new FileReader()
  reader.onload = (ev) => {
    formInitialValues.value = { content: (ev.target?.result as string) ?? '', format, language }
    uploadedFileName.value = file.name
    showCreate.value = true
  }
  reader.readAsText(file, 'UTF-8')
}

const requireAuth = async (): Promise<boolean> => {
  if (isAuthenticated.value) return true
  await navigateTo(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
  return false
}

const openCreate = async () => {
  if (!await requireAuth()) return
  formInitialValues.value = {}
  uploadedFileName.value = null
  showCreate.value = true
}

const onSubmitted = () => {
  showCreate.value = false
  fetchLyrics()
}

const handleBackdropClick = () => {
  if (!showCreate.value) close()
}

const close = () => emit('update:modelValue', false)
</script>
