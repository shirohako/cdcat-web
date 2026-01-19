<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2">
      <Link2 class="w-5 h-5 text-amber-500" />
      <div>
        <h2 class="text-lg font-semibold text-gray-900">关联专辑</h2>
        <p class="text-sm text-gray-500">将系列关联到现有专辑</p>
      </div>
    </div>

    <div class="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">专辑列表</h3>
        <button type="button" class="btn btn-xs btn-outline" @click="onAdd">
          <Plus class="w-4 h-4" />
          添加专辑
        </button>
      </div>

      <div v-if="items.length === 0" class="text-sm text-gray-500">暂无关联专辑。</div>
      <div
        v-for="(item, index) in items"
        :key="`work-${index}`"
        class="border border-gray-100 rounded-lg p-3 space-y-3"
      >
        <div class="flex flex-col md:flex-row gap-2">
          <input
            v-model="item.id"
            type="text"
            class="input input-sm input-bordered flex-1"
            placeholder="专辑 ID"
          />
          <select v-model="item.group_id" class="select select-bordered select-sm w-full md:w-40">
            <option value="">未分组</option>
            <option v-for="groupId in groupOptions" :key="groupId" :value="groupId">
              {{ groupId }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-semibold text-gray-900">Meta (JSON)</h4>
              <p class="text-xs text-gray-400">添加属性和值，自动生成 JSON</p>
            </div>
            <button type="button" class="btn btn-ghost btn-xs" @click="addMeta(index)">
              添加属性
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(metaItem, metaIndex) in item.meta"
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
              <button type="button" class="btn btn-ghost btn-xs text-error md:self-center" @click="removeMeta(index, metaIndex)">
                移除
              </button>
            </div>
          </div>

          <div class="text-xs text-gray-400">预览</div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap">
            {{ formatMeta(item.meta) }}
          </div>
        </div>

        <div class="text-right">
          <button type="button" class="btn btn-ghost btn-xs text-error" @click="onRemove(index)">
            <Trash2 class="w-4 h-4" />
            移除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Link2, Plus, Trash2 } from 'lucide-vue-next'
import type { MetaItem, RelatedItem } from './seriesFormTypes'

const props = defineProps<{
  items: RelatedItem[]
  groupOptions: string[]
  onAdd: () => void
  onRemove: (index: number) => void
}>()

const createEmptyMeta = (): MetaItem => ({
  key: '',
  value: ''
})

const addMeta = (itemIndex: number) => {
  props.items[itemIndex]?.meta.push(createEmptyMeta())
}

const removeMeta = (itemIndex: number, metaIndex: number) => {
  const meta = props.items[itemIndex]?.meta
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
