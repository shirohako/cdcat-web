<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2">
      <TagIcon class="w-5 h-5 text-blue-500" />
      <h2 class="text-lg font-semibold text-gray-900">基础信息</h2>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Series Name <span class="text-red-500">*</span></span>
      </label>
      <input
        v-model="form.name"
        type="text"
        placeholder="如：Atelier"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.name }"
        required
      />
      <label class="label">
        <span class="label-text-alt text-xs text-gray-400">Use English title.</span>
      </label>
      <label v-if="errors.name" class="label">
        <span class="label-text-alt text-error">{{ errors.name }}</span>
      </label>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">封面图 URL <span class="text-red-500">*</span></span>
      </label>
      <input
        v-model="form.image_url"
        type="url"
        placeholder="https://example.com/cover.jpg"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.image_url }"
        required
      />
      <label class="label">
        <span class="label-text-alt text-xs text-gray-400">16:9 横向封面</span>
      </label>
      <label v-if="errors.image_url" class="label">
        <span class="label-text-alt text-error">{{ errors.image_url }}</span>
      </label>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Meta (JSON)</h3>
          <p class="text-xs text-gray-400">添加属性和值，自动生成 JSON</p>
        </div>
        <button type="button" class="btn btn-xs btn-outline" @click="onAddMeta">
          添加属性
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(item, index) in form.meta"
          :key="index"
          class="flex flex-col md:flex-row gap-2"
        >
          <input
            v-model="item.key"
            type="text"
            class="input input-sm input-bordered flex-1"
            placeholder="key"
          />
          <input
            v-model="item.value"
            type="text"
            class="input input-sm input-bordered flex-1"
            placeholder="value"
          />
          <button type="button" class="btn btn-ghost btn-xs text-error md:self-center" @click="onRemoveMeta(index)">
            移除
          </button>
        </div>
      </div>

      <div class="text-xs text-gray-400">预览</div>
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap">
        {{ metaPreview }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tag as TagIcon } from 'lucide-vue-next'
import type { SeriesCreateForm } from './seriesFormTypes'

const props = defineProps<{
  form: SeriesCreateForm
  errors: { name?: string; image_url?: string }
  onAddMeta: () => void
  onRemoveMeta: (index: number) => void
}>()

const metaPreview = computed(() => {
  const output: Record<string, string> = {}
  props.form.meta.forEach((item) => {
    const key = item.key.trim()
    if (!key) return
    output[key] = item.value
  })
  return JSON.stringify(output, null, 2)
})
</script>
