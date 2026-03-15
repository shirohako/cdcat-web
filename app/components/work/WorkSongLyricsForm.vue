<template>
  <form class="flex-1 overflow-y-auto px-6 py-5 space-y-4" novalidate @submit.prevent="handleSubmit">

    <!-- Uploaded file hint -->
    <div v-if="uploadedFileName" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 border border-sky-100 text-sky-700">
      <Upload :size="13" class="shrink-0" />
      <span class="text-xs font-medium truncate flex-1">{{ uploadedFileName }}</span>
      <span class="text-[11px] text-sky-500">已自动识别参数</span>
    </div>

    <!-- Type selector -->
    <div>
      <label class="block text-xs font-semibold text-gray-600 mb-1.5">类型 <span class="text-red-400">*</span></label>
      <div class="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
        <button
          type="button"
          @click="form.is_translation = false; form.authorship = ''; form.source = ''"
          class="flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors"
          :class="!form.is_translation ? 'bg-sky-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
        >
          <FileText :size="13" />
          歌词
        </button>
        <button
          type="button"
          @click="form.is_translation = true"
          class="flex-1 py-2 flex items-center justify-center gap-1.5 border-l border-gray-200 transition-colors"
          :class="form.is_translation ? 'bg-teal-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
        >
          <Languages :size="13" />
          翻译
        </button>
      </div>
    </div>

    <!-- language + format row -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">语言 <span class="text-red-400">*</span></label>
        <AppLanguageSelect v-model="form.language" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">格式</label>
        <select
          v-model="form.format"
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
        >
          <option value="plain">plain — 纯文本</option>
          <option value="lrc">lrc — 带时间轴</option>
          <option value="srt">srt — SRT 字幕</option>
        </select>
      </div>
    </div>

    <!-- content -->
    <div>
      <label class="block text-xs font-semibold text-gray-600 mb-1.5">歌词内容 <span class="text-red-400">*</span></label>
      <textarea
        v-model="form.content"
        rows="10"
        placeholder="在此粘贴歌词内容…"
        class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder-gray-300"
      />
    </div>

    <!-- toggles row -->
    <div class="flex flex-wrap gap-x-6 gap-y-3">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" v-model="form.is_primary" class="w-4 h-4 rounded accent-indigo-500" />
        <span class="text-sm text-gray-700">主歌词</span>
      </label>
<label class="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" v-model="form.is_ai_generated" class="w-4 h-4 rounded accent-amber-500" />
        <span class="text-sm text-gray-700">AI 生成</span>
      </label>
    </div>

    <!-- authorship + source (仅翻译时显示) -->
    <div v-if="form.is_translation" class="space-y-3">
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">是否转载 <span class="text-red-400">*</span></label>
        <div
          class="inline-flex rounded-lg overflow-hidden text-sm font-medium border transition-colors"
          :class="submitAttempted && !form.authorship ? 'border-red-400' : 'border-gray-200'"
        >
          <button
            type="button"
            @click="form.authorship = 'original'; form.source = ''"
            class="px-4 py-1.5 transition-colors"
            :class="form.authorship === 'original' ? 'bg-sky-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
          >原创</button>
          <button
            type="button"
            @click="form.authorship = 'repost'"
            class="px-4 py-1.5 border-l border-gray-200 transition-colors"
            :class="form.authorship === 'repost' ? 'bg-sky-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'"
          >转载</button>
        </div>
      </div>
      <div v-if="form.authorship === 'repost'">
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">来源 URL / 描述</label>
        <input
          v-model="form.source"
          type="text"
          placeholder="https://…"
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder-gray-300"
        />
      </div>
    </div>

    <!-- Validation errors -->
    <div v-if="submitAttempted && validationErrors.length" class="flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
      <p v-for="err in validationErrors" :key="err" class="flex items-center gap-1.5 text-xs text-red-600">
        <AlertCircle :size="12" class="shrink-0" />
        {{ err }}
      </p>
    </div>

    <!-- Form footer -->
    <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
      <button
        type="button"
        @click="emit('cancel')"
        class="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
      >
        取消
      </button>
      <button
        type="submit"
        :disabled="pending"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
      >
        <span v-if="pending" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        提交
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { LyricsFormData } from '~/types/work'
import { Upload, FileText, Languages, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  songId: number | null
  uploadedFileName?: string | null
  initialValues?: Partial<LyricsFormData>
}>()

const emit = defineEmits<{
  submitted: []
  cancel: []
}>()

const { $api } = useNuxtApp()
const { showToast } = useToast()

const defaultForm = (): LyricsFormData => ({
  language: '',
  content: '',
  format: 'plain',
  is_primary: false,
  is_translation: false,
  is_ai_generated: false,
  authorship: '',
  source: '',
})

const form = reactive(defaultForm())
const pending = ref(false)
const submitAttempted = ref(false)

const validationErrors = computed(() => {
  const errors: string[] = []
  if (!form.language) errors.push('请选择语言')
  if (!form.content?.trim()) errors.push('请填写歌词内容')
  if (form.is_translation && !form.authorship) errors.push('请选择是否转载')
  return errors
})

// Apply initial values when provided (e.g. from file upload)
watch(() => props.initialValues, (vals) => {
  if (vals) Object.assign(form, defaultForm(), vals)
}, { immediate: true })

// Reset state when becoming visible (parent sets initialValues fresh each time)
watch(() => props.uploadedFileName, () => {
  submitAttempted.value = false
})

const handleSubmit = async () => {
  if (!props.songId) return
  submitAttempted.value = true
  if (validationErrors.value.length) return
  pending.value = true
  try {
    await $api(`/v1/songs/${props.songId}/lyrics`, {
      method: 'POST',
      body: {
        language: form.language,
        content: form.content,
        format: form.format,
        is_primary: form.is_primary,
        is_translation: form.is_translation,
        is_ai_generated: form.is_ai_generated,
        authorship: form.authorship || null,
        source: form.source || null,
      },
    })
    showToast('歌词提交成功！', 'success')
    emit('submitted')
    Object.assign(form, defaultForm())
    submitAttempted.value = false
  } catch {
    showToast('提交失败，请稍后重试', 'error')
  } finally {
    pending.value = false
  }
}
</script>
