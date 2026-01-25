<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Check, Save, X } from 'lucide-vue-next'
import type { MetaItem, RelatedItem, SeriesCreateForm, SeriesGroup } from '~/components/series/seriesFormTypes'

const props = defineProps<{
  initialData?: Record<string, any>
  seriesId?: string | number
}>()

const router = useRouter()

// 判断是否为编辑模式
const isEditMode = computed(() => !!props.seriesId)

let seed = 0
const nextId = () => Date.now() + seed++
let groupSeed = 1
const createGroupId = () => `group-${groupSeed++}`

const createEmptyRelated = (): RelatedItem => ({
  id: '',
  group_id: '',
  meta: [createEmptyMeta()]
})

const createEmptyMeta = (): MetaItem => ({
  key: '',
  value: ''
})

const createEmptyGroup = (): SeriesGroup => ({
  uid: nextId(),
  id: createGroupId(),
  meta: [createEmptyMeta()]
})

// 编辑模式下多一个 JSON 编辑 tab
const tabs = computed(() => {
  const baseTabs = [
    { id: 'basic', label: '基础信息', icon: 'lucide:tag' },
    { id: 'groups', label: '系列分组', icon: 'lucide:layers' },
    { id: 'related-entries', label: '关联条目', icon: 'lucide:film' },
    { id: 'related-works', label: '关联专辑', icon: 'lucide:disc-3' }
  ]
  if (isEditMode.value) {
    baseTabs.push({ id: 'json', label: 'JSON 编辑', icon: 'lucide:code' })
  }
  return baseTabs
})

const currentTab = ref('basic')

const form = reactive<SeriesCreateForm>({
  name: '',
  image_url: '',
  meta: [createEmptyMeta()],
  groups: [],
  relatedEntries: [],
  relatedWorks: []
})

// 原始数据用于比对（编辑模式）
const originalJson = ref('')

// 将 schema 数据转换为表单格式
const convertMetaToArray = (meta: Record<string, any> | undefined): MetaItem[] => {
  if (!meta || Object.keys(meta).length === 0) {
    return [createEmptyMeta()]
  }
  return Object.entries(meta).map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value)
  }))
}

const initFormFromSchema = (data: any) => {
  if (!data) return

  form.name = data.name || ''
  form.image_url = data.image_url || ''
  form.meta = convertMetaToArray(data.meta)

  // 转换 groups
  if (data.groups && Array.isArray(data.groups)) {
    form.groups = data.groups.map((group: any) => ({
      uid: nextId(),
      id: group.id || '',
      meta: convertMetaToArray(group.meta)
    }))
  } else {
    form.groups = []
  }

  // 转换 related_entries (支持 entries 或 related_entries 字段)
  const entriesData = data.related_entries || data.entries
  if (entriesData && Array.isArray(entriesData)) {
    form.relatedEntries = entriesData.map((entry: any) => ({
      id: String(entry.id || ''),
      group_id: entry.group_id || '',
      meta: convertMetaToArray(entry.meta)
    }))
  } else {
    form.relatedEntries = []
  }

  // 转换 related_works (支持 works 或 related_works 字段)
  const worksData = data.related_works || data.works
  if (worksData && Array.isArray(worksData)) {
    form.relatedWorks = worksData.map((work: any) => ({
      id: String(work.id || ''),
      group_id: work.group_id || '',
      meta: convertMetaToArray(work.meta)
    }))
  } else {
    form.relatedWorks = []
  }

  // 保存原始 JSON 用于比对
  if (isEditMode.value) {
    originalJson.value = JSON.stringify(buildSubmissionPayload(), null, 2)
  }
}

// 监听 initialData 变化
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    initFormFromSchema(newData)
  }
}, { immediate: true, deep: true })

const isSubmitting = ref(false)
const submitMessage = ref('')
const showPreview = ref(false)
const showComparison = ref(false)
const confirmSubmit = ref(false)
const errors = reactive<{ name?: string; image_url?: string }>({})

// JSON 编辑器状态
const jsonText = ref('')
const jsonError = ref('')
const jsonSuccess = ref('')

const groupOptions = computed(() => form.groups.map((group) => group.id).filter((id) => id.trim()))

const addGroup = () => {
  form.groups.push(createEmptyGroup())
}

const removeGroup = (index: number) => {
  if (index < 0 || index >= form.groups.length) return
  form.groups.splice(index, 1)
}

const moveGroup = (fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex) return
  if (fromIndex < 0 || toIndex < 0) return
  if (fromIndex >= form.groups.length || toIndex >= form.groups.length) return
  const [group] = form.groups.splice(fromIndex, 1)
  if (!group) return
  form.groups.splice(toIndex, 0, group)
}

const normalizeRelatedGroups = () => {
  const validIds = new Set(groupOptions.value)
  const normalize = (items: RelatedItem[]) => {
    items.forEach((item) => {
      if (item.group_id && !validIds.has(item.group_id)) {
        item.group_id = ''
      }
    })
  }
  normalize(form.relatedEntries)
  normalize(form.relatedWorks)
}

watch(groupOptions, normalizeRelatedGroups)

const addMeta = () => {
  form.meta.push(createEmptyMeta())
}

const removeMeta = (index: number) => {
  if (form.meta.length === 1) {
    form.meta[0] = createEmptyMeta()
    return
  }
  form.meta.splice(index, 1)
}

const addRelatedEntry = () => {
  form.relatedEntries.push(createEmptyRelated())
}

const removeRelatedEntry = (index: number) => {
  if (index < 0 || index >= form.relatedEntries.length) return
  form.relatedEntries.splice(index, 1)
}

const addRelatedWork = () => {
  form.relatedWorks.push(createEmptyRelated())
}

const removeRelatedWork = (index: number) => {
  if (index < 0 || index >= form.relatedWorks.length) return
  form.relatedWorks.splice(index, 1)
}

const buildMetaObject = (meta: MetaItem[]) => {
  const output: Record<string, string> = {}
  meta.forEach((item) => {
    const key = item.key.trim()
    if (!key) return
    output[key] = item.value
  })
  return output
}

const buildSubmissionPayload = () => ({
  name: form.name,
  image_url: form.image_url,
  meta: buildMetaObject(form.meta),
  groups: form.groups.map((group) => ({
    id: group.id,
    meta: buildMetaObject(group.meta)
  })),
  related_entries: form.relatedEntries
    .filter((item) => item.id.trim())
    .map((item) => ({
      id: item.id,
      group_id: item.group_id || null,
      meta: buildMetaObject(item.meta)
    })),
  related_works: form.relatedWorks
    .filter((item) => item.id.trim())
    .map((item) => ({
      id: item.id,
      group_id: item.group_id || null,
      meta: buildMetaObject(item.meta)
    }))
})

const submissionPayload = computed(() => buildSubmissionPayload())
const currentJson = computed(() => JSON.stringify(submissionPayload.value, null, 2))
const previewJson = computed(() => JSON.stringify(submissionPayload.value, null, 2))

// 同步 JSON 到文本框（编辑模式）
watch(currentJson, (newVal) => {
  if (currentTab.value === 'json') {
    jsonText.value = newVal
  }
}, { immediate: true })

// 切换到 JSON tab 时同步
watch(currentTab, (tab) => {
  if (tab === 'json') {
    jsonText.value = currentJson.value
    jsonError.value = ''
    jsonSuccess.value = ''
  }
})

// 验证并应用 JSON 到表单
const validateAndApplyJson = () => {
  jsonError.value = ''
  jsonSuccess.value = ''

  try {
    const parsed = JSON.parse(jsonText.value)
    initFormFromSchema(parsed)
    jsonSuccess.value = 'JSON 已验证并同步到表单'
  } catch (e: any) {
    jsonError.value = `JSON 解析错误: ${e.message}`
  }
}

// 验证表单
const validateForm = () => {
  errors.name = undefined
  errors.image_url = undefined

  if (!form.name.trim()) {
    errors.name = '请输入系列名称'
    currentTab.value = 'basic'
    return false
  }
  if (!form.image_url.trim()) {
    errors.image_url = '请输入封面图 URL'
    currentTab.value = 'basic'
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
    errors.name = '请输入系列名称'
    return
  }

  isSubmitting.value = true
  try {
    const { $api } = useNuxtApp()
    const formData = new FormData()
    formData.append('payload', JSON.stringify(submissionPayload.value))
    formData.append('resource_type', 'franchise')
    formData.append('action', isEditMode.value ? 'update' : 'create')
    await $api('/v1/revisions', {
      method: 'POST',
      body: formData
    })

    // 提交成功，跳转到成功页面
    router.push({
      path: '/contribute/success',
      query: {
        type: 'series',
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
      <SeriesCreateTabs v-model="currentTab" :tabs="tabs" />

      <SeriesBasicSection
        v-show="currentTab === 'basic'"
        :form="form"
        :errors="errors"
        :on-add-meta="addMeta"
        :on-remove-meta="removeMeta"
      />
      <SeriesGroupsSection
        v-show="currentTab === 'groups'"
        :groups="form.groups"
        :on-add-group="addGroup"
        :on-remove-group="removeGroup"
        :on-move-group="moveGroup"
      />
      <SeriesRelatedEntriesSection
        v-show="currentTab === 'related-entries'"
        :items="form.relatedEntries"
        :group-options="groupOptions"
        :on-add="addRelatedEntry"
        :on-remove="removeRelatedEntry"
      />
      <SeriesRelatedWorksSection
        v-show="currentTab === 'related-works'"
        :items="form.relatedWorks"
        :group-options="groupOptions"
        :on-add="addRelatedWork"
        :on-remove="removeRelatedWork"
      />

      <!-- JSON 编辑器（仅编辑模式） -->
      <div v-if="isEditMode" v-show="currentTab === 'json'" class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-xl font-bold text-gray-900">JSON 编辑器</h2>
        </div>

        <p class="text-sm text-gray-500">
          直接编辑 JSON，点击验证按钮同步到表单。
        </p>

        <textarea
          v-model="jsonText"
          rows="20"
          spellcheck="false"
          class="textarea textarea-bordered w-full font-mono text-xs bg-gray-50"
          placeholder='输入系列 JSON...'
        />

        <div class="flex flex-wrap gap-3 items-center">
          <button type="button" class="btn btn-sm btn-primary" @click="validateAndApplyJson">
            验证并同步
          </button>
          <span v-if="jsonSuccess" class="text-sm text-green-600 flex items-center gap-1">
            <Check class="w-4 h-4" /> {{ jsonSuccess }}
          </span>
          <span v-else-if="jsonError" class="text-sm text-red-600 flex items-center gap-1">
            <X class="w-4 h-4" /> {{ jsonError }}
          </span>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="flex flex-wrap items-center gap-3 pt-6">
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <Save class="w-4 h-4" />
          {{ isSubmitting ? '处理中...' : (isEditMode ? '提交修改' : '预览') }}
        </button>
        <span class="text-sm text-gray-500">提交后由管理员审核，审核通过后公开展示。</span>
      </div>

      <!-- 创建模式：预览 -->
      <div v-if="!isEditMode && showPreview" class="border border-blue-100 bg-blue-50/50 rounded-lg p-4 space-y-3 mt-6">
        <div class="rounded-lg border border-blue-100 bg-white p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap">
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
