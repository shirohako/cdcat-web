<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-gray-900">Basic Information</h2>

    <!-- 作品标题 -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Title <span class="text-red-500">*</span></span>
      </label>
      <input
        :value="formData.title"
        type="text"
        placeholder="Enter work title"
        class="input input-bordered w-full"
        :class="{ 'input-error': errors.title }"
        required
        @input="$emit('update:formData', { ...formData, title: ($event.target as HTMLInputElement).value })"
      />
      <label v-if="errors.title" class="label">
        <span class="label-text-alt text-error">{{ errors.title }}</span>
      </label>
    </div>

    <!-- 作品类型 -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Type <span class="text-red-500">*</span></span>
      </label>
      <select
        :value="formData.type"
        class="select select-bordered w-full"
        :class="{ 'select-error': errors.type }"
        required
        @change="$emit('update:formData', { ...formData, type: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">Select type</option>
        <option value="album">Album</option>
        <option value="single">Single</option>
        <option value="ep">EP</option>
        <option value="compilation">Compilation</option>
      </select>
      <label v-if="errors.type" class="label">
        <span class="label-text-alt text-error">{{ errors.type }}</span>
      </label>
    </div>

    <!-- 目录编号 -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Catalog Number</span>
      </label>
      <input
        :value="formData.catalog_number"
        type="text"
        placeholder="e.g., ABCD-1234"
        class="input input-bordered w-full"
        @input="$emit('update:formData', { ...formData, catalog_number: ($event.target as HTMLInputElement).value })"
      />
      <label class="label">
        <span class="label-text-alt text-gray-500">The catalog number for this work</span>
      </label>
    </div>

    <!-- 发行日期 -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Release Date</span>
      </label>
      <input
        :value="formData.release_date"
        type="date"
        class="input input-bordered w-full"
        @input="$emit('update:formData', { ...formData, release_date: ($event.target as HTMLInputElement).value })"
      />
      <label class="label">
        <span class="label-text-alt text-gray-500">When was this work released</span>
      </label>
    </div>

    <!-- 封面图片 URL -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Cover Image URL</span>
      </label>
      <input
        :value="formData.image_url"
        type="url"
        placeholder="https://example.com/cover.jpg"
        class="input input-bordered w-full"
        @input="$emit('update:formData', { ...formData, image_url: ($event.target as HTMLInputElement).value })"
      />
      <label class="label">
        <span class="label-text-alt text-gray-500">URL to the work's cover image</span>
      </label>
      <!-- 封面图片预览 -->
      <div v-if="formData.image_url" class="mt-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Cover Preview:</p>
        <div class="flex items-center justify-center w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
          <img
            :src="formData.image_url"
            alt="Cover Preview"
            class="w-full h-full object-cover"
            @error="imageError = true"
          />
        </div>
        <p v-if="imageError" class="text-xs text-error mt-1">Failed to load image</p>
      </div>
    </div>

    <!-- 横幅图片 URL -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Banner Image URL</span>
      </label>
      <input
        :value="formData.banner_url"
        type="url"
        placeholder="https://example.com/banner.jpg"
        class="input input-bordered w-full"
        @input="$emit('update:formData', { ...formData, banner_url: ($event.target as HTMLInputElement).value })"
      />
      <label class="label">
        <span class="label-text-alt text-gray-500">URL to the work's banner image (optional, used for background)</span>
      </label>
      <!-- 横幅图片预览 -->
      <div v-if="formData.banner_url" class="mt-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Banner Preview:</p>
        <div class="flex items-center justify-center w-full h-32 rounded-lg overflow-hidden border border-gray-200">
          <img
            :src="formData.banner_url"
            alt="Banner Preview"
            class="w-full h-full object-cover"
            @error="bannerError = true"
          />
        </div>
        <p v-if="bannerError" class="text-xs text-error mt-1">Failed to load banner</p>
      </div>
    </div>

    <!-- 简介 -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Description</span>
      </label>
      <textarea
        :value="formData.description"
        class="textarea textarea-bordered w-full resize-none"
        rows="5"
        placeholder="Brief description about the work..."
        @input="$emit('update:formData', { ...formData, description: ($event.target as HTMLTextAreaElement).value })"
      ></textarea>
      <label class="label">
        <span class="label-text-alt text-gray-500">Optional description or notes about this work</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FormData {
  title: string
  type: string
  catalog_number: string
  release_date: string
  image_url: string
  banner_url: string
  description: string
  [key: string]: unknown
}

interface Errors {
  title?: string
  type?: string
}

defineProps<{
  formData: FormData
  errors: Errors
}>()

defineEmits<{
  'update:formData': [value: FormData]
}>()

const imageError = ref(false)
const bannerError = ref(false)
</script>
