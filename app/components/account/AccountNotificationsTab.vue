<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">通知偏好</h2>
        <p class="text-sm text-gray-500 mt-1">选择你希望接收的通知类型</p>
      </div>

      <div class="divide-y divide-gray-100">
        <label
          v-for="item in settings"
          :key="item.key"
          class="px-6 py-5 flex items-center justify-between gap-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ item.label }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ item.description }}</p>
          </div>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-sm shrink-0"
            :checked="item.enabled"
            @change="item.enabled = !item.enabled"
          />
        </label>
      </div>

      <div class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex justify-end">
        <button type="button" class="btn btn-primary btn-sm gap-1.5" @click="$emit('save', '通知偏好已保存')">
          <Save :size="14" />
          保存偏好
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Save } from 'lucide-vue-next'

defineEmits(['save'])

const settings = reactive([
  { key: 'album_update', label: '专辑更新', description: '当你关注的专辑有新信息时通知', enabled: true },
  { key: 'artist_update', label: '艺术家动态', description: '当你关注的艺术家有新发布时通知', enabled: true },
  { key: 'system', label: '系统通知', description: '重要的系统更新和公告', enabled: true },
  { key: 'email_digest', label: '邮件摘要', description: '每周一封包含最新动态的邮件', enabled: false }
])
</script>
