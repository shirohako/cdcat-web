<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <ImageIcon class="w-5 h-5 text-emerald-500" />
      <h2 class="text-lg font-semibold text-gray-900">图片</h2>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">封面图 URL</span>
      </label>
      <input
        v-model="form.image_url"
        type="url"
        placeholder="https://example.com/cover.jpg"
        class="input input-bordered w-full"
      />
      <label class="label">
        <span class="label-text-alt text-xs text-gray-400">16:9 横向封面</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Image as ImageIcon } from 'lucide-vue-next'
import type { SeriesCreateForm } from './seriesFormTypes'

defineProps<{
  form: SeriesCreateForm
}>()
</script>
