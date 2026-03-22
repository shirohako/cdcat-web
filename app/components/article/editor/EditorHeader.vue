<template>
  <header class="shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
    <NuxtLink
      :to="backTo"
      class="shrink-0 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft :size="16" />
      返回
    </NuxtLink>

    <div class="w-px h-5 bg-gray-200 shrink-0" />

    <span
      class="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      :class="status === 'published'
        ? 'bg-violet-100 text-violet-700'
        : 'bg-amber-100 text-amber-600'"
    >{{ status === 'published' ? '公开' : '草稿' }}</span>

    <input
      :value="title"
      placeholder="文章标题"
      class="flex-1 min-w-0 text-base font-semibold text-gray-900 bg-transparent outline-none placeholder:text-gray-300"
      @input="$emit('update:title', $event.target.value)"
    />

    <div class="shrink-0 flex items-center gap-2">
      <span v-if="saveStatus === 'saved'" class="text-xs text-green-500 flex items-center gap-1">
        <Check :size="13" /> 已保存
      </span>
      <span v-else-if="saveStatus === 'error'" class="text-xs text-red-500">保存失败</span>

      <button
        class="btn btn-sm btn-ghost"
        :class="settingsOpen && 'bg-gray-100'"
        title="文章设置"
        @click="$emit('update:settingsOpen', !settingsOpen)"
      >
        <Settings :size="15" />
      </button>

      <button
        class="btn btn-sm btn-primary"
        :disabled="saving"
        @click="$emit('save')"
      >
        <Loader v-if="saving" :size="14" class="animate-spin" />
        {{ saving ? '保存中' : '保存' }}
      </button>
    </div>
  </header>
</template>

<script setup>
import { ArrowLeft, Check, Loader, Settings } from 'lucide-vue-next'

defineProps({
  backTo:       { type: String, required: true },
  title:        { type: String, default: '' },
  status:       { type: String, default: 'draft' },
  saving:       { type: Boolean, default: false },
  saveStatus:   { type: String, default: null },
  settingsOpen: { type: Boolean, default: false },
})

defineEmits(['update:title', 'update:settingsOpen', 'save'])
</script>
