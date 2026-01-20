<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Save, Sparkles } from 'lucide-vue-next'
import type { MetaItem, RelatedItem, SeriesCreateForm, SeriesGroup } from '~/components/series/seriesFormTypes'

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
  { id: 'related-works', label: '关联专辑', icon: 'lucide:disc-3' }
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

const isSubmitting = ref(false)
const submitMessage = ref('')
const showPreview = ref(false)
const errors = reactive<{ name?: string; image_url?: string }>({})

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

const submissionPayload = computed(() => ({
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
}))

const previewJson = computed(() => JSON.stringify(submissionPayload.value, null, 2))

const openPreview = () => {
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
  showPreview.value = true
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
    await $api('/v1/franchises', {
      method: 'POST',
      body: formData
    })
    // await navigateTo('/series')
  } finally {
    isSubmitting.value = false
  }

  submitMessage.value = `系列「${form.name}」已提交。`
  showPreview.value = false
}

useHead({
  title: '创建系列'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl">
      <SeriesCreateHeader />

      <div class="max-w-5xl">
        <!-- 表单 -->
        <div class="space-y-6">
          <form class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6" @submit.prevent="openPreview">
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

            <!-- 提交按钮 -->
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <Save class="w-4 h-4" />
                {{ isSubmitting ? '生成中...' : '预览' }}
              </button>
              <span class="text-sm text-gray-500">提交后由管理员审核，审核通过后公开展示。</span>
            </div>

            <div v-if="showPreview" class="border border-blue-100 bg-blue-50/50 rounded-lg p-4 space-y-3">
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

            <div v-if="submitMessage" class="alert alert-success mt-4">
              <Sparkles class="w-5 h-5" />
              <span>{{ submitMessage }}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
