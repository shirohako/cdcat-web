<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="close"
      />

      <!-- Modal Card -->
      <div
        class="relative bg-white rounded-2xl shadow-xl ring-1 ring-black/5
               w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="shrink-0 border-b border-gray-200 px-6 py-4
                 rounded-t-2xl flex items-center justify-between"
        >
          <h2 class="text-lg font-bold text-gray-900">写评价</h2>
          <button
            type="button"
            class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            @click="close"
          >
            <X :size="20" class="text-gray-500" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <!-- Score Input (optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              评分
              <span class="text-gray-400 font-normal ml-1">(可选)</span>
            </label>
            <div class="flex items-center gap-3">
              <!-- Interactive stars -->
              <div class="flex gap-0.5">
                <button
                  v-for="i in 10"
                  :key="i"
                  type="button"
                  class="p-0.5 transition-transform hover:scale-110"
                  @click="toggleScore(i)"
                  @mouseenter="hoverScore = i"
                  @mouseleave="hoverScore = null"
                >
                  <Star
                    :size="24"
                    class="transition-colors duration-150"
                    :class="getStarClass(i)"
                  />
                </button>
              </div>
              <!-- Score display + clear -->
              <div v-if="form.score !== null" class="flex items-center gap-2">
                <span
                  class="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-sm"
                  :style="{ backgroundColor: getScoreColor(form.score) }"
                >
                  {{ form.score }}
                </span>
                <button
                  type="button"
                  class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  @click="form.score = null"
                >
                  清除
                </button>
              </div>
            </div>
          </div>

          <!-- Language Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <span class="flex items-center gap-1">
                <Globe :size="14" />
                评价语言
              </span>
            </label>
            <select
              v-model="form.language"
              class="select select-bordered select-sm w-full max-w-xs text-sm"
            >
              <option v-for="lang in LANGUAGES" :key="lang.code" :value="lang.code">
                {{ lang.label }}
              </option>
            </select>
          </div>

          <!-- Review Content (markdown) -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">
                评价内容 <span class="text-red-400">*</span>
              </label>
              <div class="flex gap-1">
                <button
                  type="button"
                  class="px-2.5 py-1 text-xs rounded-md transition-colors"
                  :class="activeTab === 'write' ? 'bg-gray-200 text-gray-800 font-medium' : 'text-gray-500 hover:text-gray-700'"
                  @click="activeTab = 'write'"
                >
                  <span class="flex items-center gap-1">
                    <Pencil :size="12" />
                    编辑
                  </span>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 text-xs rounded-md transition-colors"
                  :class="activeTab === 'preview' ? 'bg-gray-200 text-gray-800 font-medium' : 'text-gray-500 hover:text-gray-700'"
                  @click="activeTab = 'preview'"
                >
                  <span class="flex items-center gap-1">
                    <Eye :size="12" />
                    预览
                  </span>
                </button>
              </div>
            </div>

            <!-- Write tab -->
            <textarea
              v-show="activeTab === 'write'"
              v-model="form.content"
              class="textarea textarea-bordered w-full text-sm h-48 resize-none font-mono"
              placeholder="分享你对这张专辑的想法... 支持 Markdown 格式"
              maxlength="5000"
            />

            <!-- Preview tab -->
            <div
              v-show="activeTab === 'preview'"
              class="border border-gray-300 rounded-lg px-4 py-3 min-h-48 max-h-64 overflow-y-auto prose prose-sm max-w-none"
              v-html="renderedMarkdown"
            />

            <div class="flex items-center justify-between mt-1">
              <span class="text-xs text-gray-400">支持 Markdown 格式</span>
              <span class="text-xs text-gray-400">{{ form.content.length }} / 5000</span>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mx-6 mb-0 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <!-- Footer -->
        <div
          class="shrink-0 border-t border-gray-200 px-6 py-4
                 rounded-b-2xl flex items-center justify-end gap-3"
        >
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="close"
          >
            取消
          </button>
          <button
            type="button"
            :disabled="!canSubmit || isSubmitting"
            class="btn btn-primary btn-sm gap-2"
            @click="handleSubmit"
          >
            <Loader2
              v-if="isSubmitting"
              :size="16"
              class="animate-spin"
            />
            提交评价
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Star, X, Pencil, Eye, Loader2, Globe } from 'lucide-vue-next'

const LANGUAGES = [
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
] as const

interface Props {
  modelValue: boolean
  workId: string | number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const { $api } = useNuxtApp()

// Form state
const form = reactive({
  content: '',
  score: null as number | null,
  language: 'zh-Hans',
})

// UI state
const hoverScore = ref<number | null>(null)
const activeTab = ref<'write' | 'preview'>('write')
const isSubmitting = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => form.content.trim().length > 0)

// Simple markdown rendering
const renderedMarkdown = computed(() => {
  if (!form.content.trim()) {
    return '<p class="text-gray-400">暂无内容</p>'
  }
  return renderSimpleMarkdown(form.content)
})

function renderSimpleMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // Line breaks → paragraphs
  html = html
    .split(/\n\n+/)
    .map(p => {
      p = p.trim()
      if (!p) return ''
      if (/^<(h[1-3]|blockquote)>/.test(p)) return p
      return `<p>${p.replace(/\n/g, '<br>')}</p>`
    })
    .filter(Boolean)
    .join('')

  return html
}

// Score interaction
function toggleScore(value: number) {
  form.score = form.score === value ? null : value
}

function getStarClass(index: number): string {
  const active = hoverScore.value ?? form.score
  if (active !== null && index <= active) {
    return 'fill-yellow-400 text-yellow-400'
  }
  return 'text-gray-300'
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#1e88e5'
  if (score >= 6.5) return '#43a047'
  if (score >= 5) return '#f9a825'
  if (score >= 3) return '#ef6c00'
  return '#e53935'
}

function close() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $api(`/v1/works/${props.workId}/reviews`, {
      method: 'POST',
      body: {
        content: form.content.trim(),
        rating: form.score,
        language: form.language,
      },
    })
    form.content = ''
    form.score = null
    form.language = 'zh-Hans'
    activeTab.value = 'write'
    emit('saved')
    close()
  } catch (e: any) {
    errorMessage.value = e?.message || '提交失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

// Lock body scroll
watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
