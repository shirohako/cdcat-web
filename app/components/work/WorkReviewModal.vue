<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

      <!-- Modal Card -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <!-- Header -->
        <div class="shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <MessageSquare :size="15" class="text-amber-500" />
            </div>
            <h2 class="text-base font-bold text-gray-900">{{ $t('work.actions.write_review') }}</h2>
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
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <!-- Score -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {{ $t('review_ui.score') }} <span class="text-gray-400 font-normal text-xs ml-1">{{ $t('collection_components.optional') }}</span>
            </label>
            <div class="flex items-center gap-3">
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
                  <Star :size="22" class="transition-colors duration-100" :class="getStarClass(i)" />
                </button>
              </div>
              <div v-if="form.score !== null" class="flex items-center gap-2">
                <span
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  :style="{ backgroundColor: getScoreColor(form.score) }"
                >{{ form.score }}</span>
                <button
                  type="button"
                  class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  @click="form.score = null"
                >{{ $t('collection_components.clear') }}</button>
              </div>
            </div>
          </div>

          <!-- Language -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <span class="flex items-center gap-1.5">
                <Globe :size="13" />
                {{ $t('review_ui.language') }}
              </span>
            </label>
            <select
              v-model="form.language"
              class="w-full max-w-xs text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option v-for="lang in LANGUAGES" :key="lang.code" :value="lang.code">
                {{ lang.label }}
              </option>
            </select>
          </div>

          <!-- Content -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {{ $t('review_ui.content') }} <span class="text-red-400">*</span>
            </label>

            <MarkdownEditor
              v-model="form.content"
              :disabled="isSubmitting"
              :placeholder="$t('review_ui.placeholder')"
            />
            <div class="flex items-center justify-between mt-1.5">
              <span class="text-xs text-gray-400">{{ $t('review_ui.markdown') }}</span>
              <span class="text-xs" :class="form.content.length > MAX_CONTENT ? 'text-red-500' : form.content.length > 4500 ? 'text-orange-400' : 'text-gray-400'">
                {{ form.content.length }} / {{ MAX_CONTENT }}
              </span>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMessage" class="mx-6 mb-0 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <!-- Footer -->
        <div class="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            @click="close"
          >{{ $t('common.cancel') }}</button>
          <button
            type="button"
            :disabled="!canSubmit || isSubmitting"
            class="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            @click="handleSubmit"
          >
            <Loader2 v-if="isSubmitting" :size="14" class="animate-spin" />
            {{ $t('review_ui.submit') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Star, X, Loader2, Globe, MessageSquare } from '@lucide/vue'

const LANGUAGE_CODES = ['zh-Hans', 'zh-Hant', 'ja', 'en', 'ko', 'fr', 'de', 'es', 'pt', 'ru'] as const

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
const { languageName } = useLocaleFormatting()
const { localizeError } = useLocalizedApiError()
const LANGUAGES = computed(() => LANGUAGE_CODES.map(code => ({ code, label: languageName(code) })))

const form = reactive({
  content: '',
  score: null as number | null,
  language: 'zh-Hans',
})

const hoverScore = ref<number | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

const MAX_CONTENT = 5000

const canSubmit = computed(() =>
  form.content.trim().length > 0 && form.content.length <= MAX_CONTENT)

function toggleScore(value: number) {
  form.score = form.score === value ? null : value
}

function getStarClass(index: number): string {
  const active = hoverScore.value ?? form.score
  return active !== null && index <= active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
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
      body: { content: form.content.trim(), rating: form.score, language: form.language },
    })
    form.content = ''
    form.score = null
    form.language = 'zh-Hans'
    emit('saved')
    close()
  } catch (e: any) {
    errorMessage.value = localizeError(e, 'collection_components.submit_failed')
  } finally {
    isSubmitting.value = false
  }
}

watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>
