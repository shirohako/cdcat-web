<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <Layers class="w-5 h-5 text-indigo-500" />
        <div>
          <h2 class="text-lg font-semibold text-gray-900">系列分组</h2>
          <p class="text-sm text-gray-500">填写分组 ID，并补充元数据</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn btn-sm btn-outline" @click="toggleSort">
          <ArrowUpDown class="w-4 h-4" />
          {{ sortMode ? '完成排序' : '排序' }}
        </button>
        <button v-if="!sortMode" type="button" class="btn btn-sm btn-outline" @click="onAddGroup">
          <Plus class="w-4 h-4" />
          添加分组
        </button>
      </div>
    </div>

    <div v-if="sortMode" class="space-y-2">
      <div v-if="groups.length === 0" class="text-sm text-gray-500 bg-white rounded-lg border border-dashed border-gray-200 p-3">
        暂无分组可排序。
      </div>
      <div
        v-for="(group, groupIndex) in groups"
        :key="group.uid"
        class="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2 transition-colors"
        :class="overIndex === groupIndex ? 'border-blue-300 bg-blue-50/40' : ''"
        :draggable="groups.length > 1"
        @dragstart="handleDragStart(groupIndex, $event)"
        @dragover="handleDragOver(groupIndex, $event)"
        @dragenter="handleDragEnter(groupIndex)"
        @dragleave="handleDragLeave(groupIndex)"
        @drop="handleDrop(groupIndex)"
        @dragend="handleDragEnd"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-xs cursor-grab active:cursor-grabbing"
            aria-label="拖动排序"
          >
            <GripVertical class="w-4 h-4 text-gray-500" />
          </button>
          <span class="text-sm font-medium text-gray-700">
            {{ group.id || `分组 ${groupIndex + 1}` }}
          </span>
        </div>
      </div>
    </div>

    <div v-else>
      <div v-if="groups.length === 0" class="text-sm text-gray-500 bg-white rounded-lg border border-dashed border-gray-200 p-3">
        暂无分组，可直接提交或点击「添加分组」。
      </div>

      <div
        v-for="(group, groupIndex) in groups"
        :key="group.uid"
        class="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              分组 {{ groupIndex + 1 }}
            </span>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs text-error"
            @click="onRemoveGroup(groupIndex)"
          >
            <Trash2 class="w-4 h-4" />
            移除分组
          </button>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">分组 ID <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="group.id"
            type="text"
            class="input input-sm input-bordered w-full"
            placeholder="任意字符，例如：main-arc"
            required
          />
          <label class="label">
            <span class="label-text-alt text-xs text-gray-400">必填，可输入任意字符，用于排序与标识</span>
          </label>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-gray-900">Meta (JSON)</h3>
              <p class="text-xs text-gray-400">添加属性和值，自动生成 JSON</p>
            </div>
            <button type="button" class="btn btn-xs btn-outline" @click="addMeta(groupIndex)">
              添加属性
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(metaItem, metaIndex) in group.meta"
              :key="metaIndex"
              class="flex flex-col md:flex-row gap-2"
            >
              <input
                v-model="metaItem.key"
                type="text"
                class="input input-sm input-bordered flex-1"
                placeholder="key"
              />
              <input
                v-model="metaItem.value"
                type="text"
                class="input input-sm input-bordered flex-1"
                placeholder="value"
              />
              <button
                type="button"
                class="btn btn-ghost btn-xs text-error md:self-center"
                @click="removeMeta(groupIndex, metaIndex)"
              >
                移除
              </button>
            </div>
          </div>

          <div class="text-xs text-gray-400">预览</div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap">
            {{ formatMeta(group.meta) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUpDown, GripVertical, Layers, Plus, Trash2 } from 'lucide-vue-next'
import type { MetaItem, SeriesGroup } from './seriesFormTypes'

const props = defineProps<{
  groups: SeriesGroup[]
  onAddGroup: () => void
  onRemoveGroup: (index: number) => void
  onMoveGroup: (fromIndex: number, toIndex: number) => void
}>()

const draggingIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)
const sortMode = ref(false)

const toggleSort = () => {
  sortMode.value = !sortMode.value
  draggingIndex.value = null
  overIndex.value = null
}

const handleDragStart = (index: number, event: DragEvent) => {
  if (!event.dataTransfer) return
  draggingIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(index))
}

const handleDragOver = (index: number, event: DragEvent) => {
  event.preventDefault()
  if (draggingIndex.value === null) return
  overIndex.value = index
}

const handleDragEnter = (index: number) => {
  if (draggingIndex.value === null) return
  overIndex.value = index
}

const handleDragLeave = (index: number) => {
  if (overIndex.value === index) {
    overIndex.value = null
  }
}

const handleDrop = (index: number) => {
  if (draggingIndex.value === null) return
  const fromIndex = draggingIndex.value
  if (fromIndex !== index) {
    props.onMoveGroup(fromIndex, index)
  }
  draggingIndex.value = null
  overIndex.value = null
}

const handleDragEnd = () => {
  draggingIndex.value = null
  overIndex.value = null
}

const createEmptyMeta = (): MetaItem => ({
  key: '',
  value: ''
})

const addMeta = (groupIndex: number) => {
  props.groups[groupIndex]?.meta.push(createEmptyMeta())
}

const removeMeta = (groupIndex: number, metaIndex: number) => {
  const meta = props.groups[groupIndex]?.meta
  if (!meta) return
  if (meta.length === 1) {
    meta[0] = createEmptyMeta()
    return
  }
  meta.splice(metaIndex, 1)
}

const formatMeta = (meta: MetaItem[]) => {
  const output: Record<string, string> = {}
  meta.forEach((item) => {
    const key = item.key.trim()
    if (!key) return
    output[key] = item.value
  })
  return JSON.stringify(output, null, 2)
}
</script>
