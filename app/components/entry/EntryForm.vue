<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Check, Save, X } from 'lucide-vue-next'

interface EntryFormData {
  name: string
  slug: string
  type: string
  source: string
  release_date: string
  image_url: string
  meta: Record<string, any>
}

const props = defineProps<{
  initialData?: Record<string, any>
  entryId?: string | number
}>()

const router = useRouter()

// 判断是否为编辑模式
const isEditMode = computed(() => !!props.entryId)

// 条目类型选项
const typeOptions = [
  { value: 'anime', label: '动画 (Anime)' },
  { value: 'movie', label: '电影 (Movie)' },
  { value: 'tv', label: '电视剧 (TV)' },
  { value: 'game', label: '游戏 (Game)' },
  { value: 'other', label: '其他 (Other)' }
]

// 标签页
const tabs = [
  { id: 'basic', label: '基础信息', icon: 'lucide:tag' },
  { id: 'meta', label: 'Meta', icon: 'lucide:code' }
]

const currentTab = ref('basic')

const form = reactive<EntryFormData>({
  name: '',
  slug: '',
  type: 'anime',
  source: '',
  release_date: '',
  image_url: '',
  meta: {}
})

// Meta JSON 编辑器
const metaJsonText = ref('{}')
const metaJsonError = ref('')

// 原始数据用于比对（编辑模式）
const originalJson = ref('')

const initFormFromData = (data: any) => {
  if (!data) return

  form.name = data.name || ''
  form.slug = data.slug || ''
  form.type = data.type || 'anime'
  form.source = data.source || ''
  form.release_date = data.release_date || ''
  form.image_url = data.image_url || ''
  form.meta = data.meta || {}

  // 同步 meta 到 JSON 编辑器
  metaJsonText.value = JSON.stringify(form.meta, null, 2)

  // 保存原始 JSON 用于比对
  if (isEditMode.value) {
    originalJson.value = JSON.stringify(buildSubmissionPayload(), null, 2)
  }
}

// 监听 initialData 变化
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    initFormFromData(newData)
  }
}, { immediate: true, deep: true })

const isSubmitting = ref(false)
const submitMessage = ref('')
const showPreview = ref(false)
const showComparison = ref(false)
const confirmSubmit = ref(false)
const errors = reactive<{ name?: string; type?: string; slug?: string; image_url?: string }>({})

// 验证并同步 meta JSON
const validateMetaJson = () => {
  metaJsonError.value = ''
  try {
    const parsed = JSON.parse(metaJsonText.value)
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      metaJsonError.value = 'Meta 必须是一个 JSON 对象'
      return false
    }
    form.meta = parsed
    return true
  } catch (e: any) {
    metaJsonError.value = `JSON 解析错误: ${e.message}`
    return false
  }
}

// 切换到 meta tab 时同步
watch(currentTab, (tab) => {
  if (tab === 'meta') {
    metaJsonText.value = JSON.stringify(form.meta, null, 2)
    metaJsonError.value = ''
  }
})

const buildSubmissionPayload = () => {
  // 确保 meta 是最新的
  try {
    form.meta = JSON.parse(metaJsonText.value)
  } catch {
    // 保持原有 meta
  }

  return {
    name: form.name,
    slug: form.slug || null,
    type: form.type,
    source: form.source || null,
    release_date: form.release_date || null,
    image_url: form.image_url,
    meta: form.meta
  }
}

const submissionPayload = computed(() => buildSubmissionPayload())
const currentJson = computed(() => JSON.stringify(submissionPayload.value, null, 2))
const previewJson = computed(() => JSON.stringify(submissionPayload.value, null, 2))

// 验证表单
const validateForm = () => {
  errors.name = undefined
  errors.type = undefined
  errors.slug = undefined
  errors.image_url = undefined

  if (!form.name.trim()) {
    errors.name = '请输入条目名称'
    currentTab.value = 'basic'
    return false
  }
  if (!form.type) {
    errors.type = '请选择条目类型'
    currentTab.value = 'basic'
    return false
  }
  if (!form.image_url.trim()) {
    errors.image_url = '请输入封面图 URL'
    currentTab.value = 'basic'
    return false
  }
  // 验证 meta JSON
  if (!validateMetaJson()) {
    currentTab.value = 'meta'
    return false
  }
  return true
}

// 创建模式：打开预览
const openPreview = () => {
  submitMessage.value = ''
  if (!validateForm()) return
  showPreview.value = true
}

// 编辑模式：打开比对
const openComparison = () => {
  submitMessage.value = ''
  if (!validateForm()) return
  showComparison.value = true
  confirmSubmit.value = false
}

const closeComparison = () => {
  showComparison.value = false
  confirmSubmit.value = false
}

const proceedToConfirm = () => {
  confirmSubmit.value = true
}

// 计算 JSON 差异行（编辑模式）
const diffLines = computed(() => {
  const oldLines = originalJson.value.split('\n')
  const newLines = currentJson.value.split('\n')
  const result: Array<{ type: 'same' | 'added' | 'removed'; content: string }> = []

  let oldIdx = 0
  let newIdx = 0

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx]
    const newLine = newLines[newIdx]

    if (oldLine === newLine) {
      result.push({ type: 'same', content: oldLine || '' })
      oldIdx++
      newIdx++
    } else if (oldLine !== undefined && (newLine === undefined || !newLines.slice(newIdx).includes(oldLine))) {
      result.push({ type: 'removed', content: oldLine })
      oldIdx++
    } else {
      result.push({ type: 'added', content: newLine || '' })
      newIdx++
    }
  }

  return result
})

const hasChanges = computed(() => originalJson.value !== currentJson.value)

// 提交表单
const submitForm = async () => {
  submitMessage.value = ''

  if (!form.name.trim()) {
    errors.name = '请输入条目名称'
    return
  }

  isSubmitting.value = true
  try {
    const { $api } = useNuxtApp()
    const formData = new FormData()
    formData.append('payload', JSON.stringify(submissionPayload.value))
    formData.append('resource_type', 'entry')
    formData.append('action', isEditMode.value ? 'update' : 'create')
    await $api('/v1/revisions', {
      method: 'POST',
      body: formData
    })

    // 提交成功，跳转到成功页面
    router.push({
      path: '/contribute/success',
      query: {
        type: 'entry',
        action: isEditMode.value ? 'update' : 'create'
      }
    })
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; message?: string }
    submitMessage.value = err.data?.message || err.message || '提交失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}

// 表单提交处理
const handleFormSubmit = () => {
  if (isEditMode.value) {
    openComparison()
  } else {
    openPreview()
  }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
    <form @submit.prevent="handleFormSubmit">
      <!-- 标签页导航 -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex gap-1 -mb-px overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              currentTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
            @click="currentTab = tab.id"
          >
            <Icon :name="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- 基础信息 Tab -->
      <div v-show="currentTab === 'basic'" class="space-y-6">
        <h2 class="text-xl font-bold text-gray-900">基础信息</h2>

        <!-- 名称 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">条目名称 <span class="text-error">*</span></span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="输入条目名称"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.name }"
          />
          <label v-if="errors.name" class="label">
            <span class="label-text-alt text-error">{{ errors.name }}</span>
          </label>
        </div>

        <!-- Slug -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Slug</span>
          </label>
          <input
            v-model="form.slug"
            type="text"
            placeholder="url-friendly-name"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">URL 友好的标识符，留空则自动生成</span>
          </label>
        </div>

        <!-- 类型 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">条目类型 <span class="text-error">*</span></span>
          </label>
          <select
            v-model="form.type"
            class="select select-bordered w-full"
            :class="{ 'select-error': errors.type }"
          >
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <label v-if="errors.type" class="label">
            <span class="label-text-alt text-error">{{ errors.type }}</span>
          </label>
        </div>

        <!-- 发行日期 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">发行日期</span>
          </label>
          <input
            v-model="form.release_date"
            type="date"
            class="input input-bordered w-full"
          />
        </div>

        <!-- 封面图 URL -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">封面图 URL <span class="text-error">*</span></span>
          </label>
          <input
            v-model="form.image_url"
            type="url"
            placeholder="https://example.com/cover.jpg"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.image_url }"
          />
          <label v-if="errors.image_url" class="label">
            <span class="label-text-alt text-error">{{ errors.image_url }}</span>
          </label>
          <label v-else class="label">
            <span class="label-text-alt text-gray-500">建议使用 2:3 竖向封面图</span>
          </label>
          <!-- 封面预览 -->
          <div v-if="form.image_url" class="mt-2">
            <img
              :src="form.image_url"
              alt="封面预览"
              class="w-32 h-48 object-cover rounded-lg border border-gray-200"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
          </div>
        </div>
      </div>

      <!-- Meta Tab -->
      <div v-show="currentTab === 'meta'" class="space-y-6">
        <h2 class="text-xl font-bold text-gray-900">Meta</h2>

        <p class="text-sm text-gray-500">
          以 JSON 格式编辑条目的元数据，可包含 description、banner_url、bangumi_id 等字段。
        </p>

        <div class="form-control">
          <textarea
            v-model="metaJsonText"
            rows="16"
            spellcheck="false"
            class="textarea textarea-bordered w-full font-mono text-sm bg-gray-50"
            placeholder='{
  "description": "条目简介...",
  "banner_url": "https://example.com/banner.jpg",
  "bangumi_id": 123456
}'
            @blur="validateMetaJson"
          ></textarea>
          <label v-if="metaJsonError" class="label">
            <span class="label-text-alt text-error">{{ metaJsonError }}</span>
          </label>
          <label v-else class="label">
            <span class="label-text-alt text-gray-500">输入有效的 JSON 对象</span>
          </label>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="flex flex-wrap items-center gap-3 pt-6 border-t border-gray-100">
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <Save class="w-4 h-4" />
          {{ isSubmitting ? '处理中...' : (isEditMode ? '提交修改' : '预览') }}
        </button>
        <span class="text-sm text-gray-500">提交后由管理员审核，审核通过后公开展示。</span>
      </div>

      <!-- 创建模式：预览 -->
      <div v-if="!isEditMode && showPreview" class="border border-blue-100 bg-blue-50/50 rounded-lg p-4 space-y-3 mt-6">
        <h3 class="font-semibold text-gray-900">预览提交数据</h3>
        <div class="rounded-lg border border-blue-100 bg-white p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
          {{ previewJson }}
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm" :disabled="isSubmitting" @click="submitForm">
            {{ isSubmitting ? '提交中...' : '确认提交' }}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" @click="showPreview = false">
            返回编辑
          </button>
        </div>
      </div>

      <!-- 编辑模式：比对视图 -->
      <div v-if="isEditMode && showComparison" class="border border-blue-100 bg-blue-50/50 rounded-lg p-4 space-y-4 mt-6">
        <h3 class="font-semibold text-gray-900">修改对比</h3>

        <div v-if="!hasChanges" class="text-sm text-gray-500">
          没有检测到修改。
        </div>

        <div v-else class="rounded-lg border border-blue-100 bg-white p-3 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
          <div
            v-for="(line, idx) in diffLines"
            :key="idx"
            :class="{
              'bg-green-100 text-green-800': line.type === 'added',
              'bg-red-100 text-red-800': line.type === 'removed',
              'text-gray-700': line.type === 'same'
            }"
            class="whitespace-pre"
          >
            <span class="select-none opacity-50 mr-2">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}</span>{{ line.content }}
          </div>
        </div>

        <div v-if="!confirmSubmit" class="flex items-center gap-2">
          <button type="button" class="btn btn-primary btn-sm" :disabled="!hasChanges" @click="proceedToConfirm">
            确认修改
          </button>
          <button type="button" class="btn btn-ghost btn-sm" @click="closeComparison">
            返回编辑
          </button>
        </div>

        <!-- 最终确认提交 -->
        <div v-else class="border-t border-blue-200 pt-4 space-y-3">
          <p class="text-sm text-gray-700">确认要提交以上修改吗？</p>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-primary btn-sm" :disabled="isSubmitting" @click="submitForm">
              {{ isSubmitting ? '提交中...' : '确认提交' }}
            </button>
            <button type="button" class="btn btn-ghost btn-sm" @click="confirmSubmit = false">
              取消
            </button>
          </div>
        </div>
      </div>

      <!-- 提交结果消息 -->
      <div v-if="submitMessage" :class="submitMessage.includes('失败') ? 'alert alert-error' : 'alert alert-success'" class="mt-4">
        <Check v-if="!submitMessage.includes('失败')" class="w-5 h-5" />
        <X v-else class="w-5 h-5" />
        <span>{{ submitMessage }}</span>
      </div>
    </form>
  </div>
</template>
