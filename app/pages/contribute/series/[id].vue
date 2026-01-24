<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ArrowLeft, Check, Save, X } from 'lucide-vue-next'
import type { MetaItem, RelatedItem, SeriesCreateForm, SeriesGroup } from '~/components/series/seriesFormTypes'

const route = useRoute()
const seriesId = route.params.id as string

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

const tabs = [
  { id: 'basic', label: '基础信息', icon: 'lucide:tag' },
  { id: 'groups', label: '系列分组', icon: 'lucide:layers' },
  { id: 'related-entries', label: '关联条目', icon: 'lucide:film' },
  { id: 'related-works', label: '关联专辑', icon: 'lucide:disc-3' },
  { id: 'json', label: 'JSON 编辑', icon: 'lucide:code' }
]

const currentTab = ref('basic')

const form = reactive<SeriesCreateForm>({
  name: '',
  image_url: '',
  meta: [createEmptyMeta()],
  groups: [],
  relatedEntries: [],
  relatedWorks: []
})

// 加载状态
const loading = ref(true)
const loadError = ref('')

// 原始数据用于比对
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
  originalJson.value = JSON.stringify(buildSubmissionPayload(), null, 2)
}

// 加载系列数据
onMounted(async () => {
  try {
    const { $api } = useNuxtApp()
    const data = await $api(`/v1/franchises/${seriesId}`)
    if (data) {
      initFormFromSchema(data)
    }
  } catch (error: any) {
    console.error('Failed to load series data:', error)
    loadError.value = error.message || '加载失败'
  } finally {
    loading.value = false
  }
})

const isSubmitting = ref(false)
const submitMessage = ref('')
const showComparison = ref(false)
const confirmSubmit = ref(false)
const errors = reactive<{ name?: string; image_url?: string }>({})

// JSON 编辑器状态
const jsonText = ref('')
const jsonError = ref('')
const jsonSuccess = ref('')

const isMetaFilled = (meta: MetaItem[]) => meta.some((item) => item.key.trim() || item.value.trim())
const filledGroups = computed(() => form.groups.filter((group) => group.id.trim() || isMetaFilled(group.meta)))
const filledRelatedEntries = computed(() => form.relatedEntries.filter((item) => item.id.trim()))
const filledRelatedWorks = computed(() => form.relatedWorks.filter((item) => item.id.trim()))
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

// 同步 JSON 到文本框
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

    // 应用到表单
    initFormFromSchema(parsed)

    jsonSuccess.value = 'JSON 已验证并同步到表单'
  } catch (e: any) {
    jsonError.value = `JSON 解析错误: ${e.message}`
  }
}

const openComparison = () => {
  errors.name = undefined
  errors.image_url = undefined
  submitMessage.value = ''

  if (!form.name.trim()) {
    errors.name = '请输入系列名称'
    currentTab.value = 'basic'
    return
  }
  if (!form.image_url.trim()) {
    errors.image_url = '请输入封面图 URL'
    currentTab.value = 'basic'
    return
  }

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

const submitForm = async () => {
  errors.name = undefined
  errors.image_url = undefined
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
    await $api(`/v1/franchises/${seriesId}`, {
      method: 'PUT',
      body: formData
    })
    submitMessage.value = `系列「${form.name}」已更新。`
    showComparison.value = false
    confirmSubmit.value = false
    // 更新原始 JSON
    originalJson.value = currentJson.value
  } catch (e: any) {
    submitMessage.value = `提交失败: ${e.message || '未知错误'}`
  } finally {
    isSubmitting.value = false
  }
}

// 计算 JSON 差异行
const diffLines = computed(() => {
  const oldLines = originalJson.value.split('\n')
  const newLines = currentJson.value.split('\n')
  const result: Array<{ type: 'same' | 'added' | 'removed'; content: string }> = []

  const maxLen = Math.max(oldLines.length, newLines.length)
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

useHead({
  title: '编辑系列'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink :to="`/series/${seriesId}`" class="btn btn-ghost btn-sm gap-2 mb-4">
          <ArrowLeft class="w-4 h-4" />
          返回系列详情
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">编辑系列</h1>
        <p class="text-gray-500 mt-1">修改系列信息，提交后由管理员审核。</p>
      </div>

      <!-- Loading 状态 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="loadError" class="alert alert-error">
        <X class="w-5 h-5" />
        <span>加载失败: {{ loadError }}</span>
      </div>

      <!-- 表单 -->
      <div v-else class="max-w-5xl">
        <div class="space-y-6">
          <form class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6" @submit.prevent="openComparison">
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

            <!-- JSON 编辑器 -->
            <div v-show="currentTab === 'json'" class="space-y-4">
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
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <Save class="w-4 h-4" />
                提交修改
              </button>
              <span class="text-sm text-gray-500">提交后由管理员审核，审核通过后公开展示。</span>
            </div>

            <!-- 比对视图 -->
            <div v-if="showComparison" class="border border-blue-100 bg-blue-50/50 rounded-lg p-4 space-y-4">
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
      </div>
    </div>
  </div>
</template>
