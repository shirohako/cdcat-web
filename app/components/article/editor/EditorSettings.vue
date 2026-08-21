<template>
  <transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 translate-x-4"
    enter-to-class="opacity-100 translate-x-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 translate-x-4"
  >
    <aside
      v-if="open"
      class="hidden md:flex flex-col w-72 shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <!-- 侧边栏头部 -->
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">{{ $t('article_ui.settings') }}</span>
        <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="$emit('update:open', false)">
          <X :size="15" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-5">

        <!-- 发布状态 -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ $t('article_ui.status') }}</label>
          <div class="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            <button
              type="button"
              class="flex-1 py-2 transition-colors"
              :class="modelValue.status === 'draft'
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:bg-gray-50'"
              @click="update('status', 'draft')"
            >{{ $t('article_ui.draft') }}</button>
            <button
              type="button"
              class="flex-1 py-2 transition-colors border-l border-gray-200"
              :class="modelValue.status === 'published'
                ? 'bg-violet-600 text-white'
                : 'text-gray-500 hover:bg-gray-50'"
              @click="update('status', 'published')"
            >{{ $t('article_ui.published') }}</button>
          </div>
        </div>

        <div class="h-px bg-gray-100" />

        <!-- 封面图 -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ $t('article_ui.cover') }}</label>
          <input
            :value="modelValue.cover_url"
            :placeholder="$t('article_ui.cover_placeholder')"
            class="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 focus:bg-white transition-colors placeholder:text-gray-300"
            @input="update('cover_url', $event.target.value)"
          />
          <div
            v-if="modelValue.cover_url"
            class="rounded-lg overflow-hidden border border-gray-100 aspect-video bg-gray-50"
          >
            <img :src="modelValue.cover_url" :alt="$t('article_ui.cover_preview')" class="w-full h-full object-cover" />
          </div>
        </div>

        <div class="h-px bg-gray-100" />

        <!-- Slug -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">Slug</label>
          <input
            :value="modelValue.slug"
            :placeholder="$t('article_ui.slug_placeholder')"
            class="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 focus:bg-white transition-colors placeholder:text-gray-300 font-mono"
            @input="update('slug', $event.target.value)"
          />
          <p class="text-xs text-gray-400">{{ $t('article_ui.slug_hint') }}</p>
        </div>

        <div class="h-px bg-gray-100" />

        <!-- 关联作品 -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ $t('article_ui.related_works') }}</label>
          <input
            :value="modelValue.work_ids"
            :placeholder="$t('article_ui.related_works_placeholder')"
            class="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 focus:bg-white transition-colors placeholder:text-gray-300 font-mono"
            @input="update('work_ids', $event.target.value)"
          />
          <p class="text-xs text-gray-400">{{ $t('article_ui.example_ids') }}</p>
        </div>

      </div>
    </aside>
  </transition>
</template>

<script setup>
import { X } from '@lucide/vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  modelValue: {
    type: Object,
    default: () => ({ status: 'draft', cover_url: '', slug: '' }),
  },
})

const emit = defineEmits(['update:open', 'update:modelValue'])

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
