<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">个人资料</h2>
        <p class="text-sm text-gray-500 mt-1">设置你的公开显示信息</p>
      </div>

      <div class="p-6 space-y-8">
        <!-- Avatar -->
        <div class="flex items-center gap-6">
          <div class="relative group shrink-0">
            <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-black/5">
              <UserIcon :size="32" class="text-gray-400" />
            </div>
            <button
              type="button"
              class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
            >
              <Camera :size="18" class="text-white" />
            </button>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-900">头像</p>
            <p class="text-xs text-gray-400">支持 JPG、PNG 格式，最大 2MB</p>
            <button type="button" class="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              上传新头像
            </button>
          </div>
        </div>

        <!-- Username -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="username" class="text-sm font-medium text-gray-700">用户名</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="input input-bordered w-full bg-white"
            placeholder="unique_username"
            @change="validateUsername"
          />
          <p class="text-xs text-gray-400">唯一标识，用于登录和资料链接，仅限字母、数字和下划线</p>
          <p v-if="usernameStatus" :class="usernameStatus.class">
            {{ usernameStatus.message }}
          </p>
        </div>

        <!-- Nickname -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="nickname" class="text-sm font-medium text-gray-700">昵称</label>
          <input
            id="nickname"
            v-model="form.nickname"
            type="text"
            class="input input-bordered w-full bg-white"
            placeholder="你的显示名称"
          />
          <p class="text-xs text-gray-400">公开显示的名称，最多 20 个字符</p>
        </div>

        <!-- Bio -->
        <div class="grid gap-1.5">
          <div class="flex items-center justify-between">
            <label for="bio" class="text-sm font-medium text-gray-700">个人简介</label>
            <span class="text-xs text-gray-400">支持 Markdown</span>
          </div>
          <textarea
            id="bio"
            v-model="form.bio"
            rows="4"
            class="textarea textarea-bordered w-full bg-white resize-none font-mono text-sm"
            placeholder="支持 Markdown 格式&#10;&#10;例如:&#10;**粗体**、*斜体*&#10;# 标题&#10;- 列表项&#10;[链接](url)&#10;&#10;最多 500 字符"
            maxlength="500"
          />
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">个性化介绍，可为空</p>
              <p class="text-xs text-gray-400">{{ form.bio?.length || 0 }}/500</p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs text-gray-500">
              <span class="px-2 py-1 bg-gray-50 rounded">**粗体**</span>
              <span class="px-2 py-1 bg-gray-50 rounded">*斜体*</span>
              <span class="px-2 py-1 bg-gray-50 rounded"># 标题</span>
              <span class="px-2 py-1 bg-gray-50 rounded">- 列表</span>
              <span class="px-2 py-1 bg-gray-50 rounded">[链接](url)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex justify-end">
        <button type="button" class="btn btn-primary btn-sm gap-1.5" @click="$emit('save')">
          <Save :size="14" />
          保存更改
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Camera, Save, User as UserIcon } from 'lucide-vue-next'

const props = defineProps({
  user: { type: Object, default: null }
})

defineEmits(['save'])

const form = reactive({
  username: props.user?.username || '',
  nickname: props.user?.nickname || '',
  bio: props.user?.bio || ''
})

const usernameStatus = ref(null)

const validateUsername = () => {
  const username = form.username.trim()
  if (!username) {
    usernameStatus.value = null
    return
  }

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username)
  if (isValid) {
    usernameStatus.value = {
      class: 'text-xs text-emerald-600 font-medium',
      message: '✓ 用户名有效'
    }
  } else {
    usernameStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: '✗ 用户名格式不正确（3-20字符，仅限字母、数字、下划线）'
    }
  }
}
</script>
