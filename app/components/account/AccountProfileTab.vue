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
          <div class="flex gap-2">
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="input input-bordered flex-1 bg-white"
              placeholder="unique_username"
              @change="validateUsername"
            />
            <button
              type="button"
              class="btn btn-primary btn-sm shrink-0"
              :disabled="isUpdatingUsername || !isUsernameChanged"
              @click="updateUsername"
            >
              <span v-if="isUpdatingUsername" class="loading loading-spinner loading-xs"></span>
              <span v-else>更新</span>
            </button>
          </div>
          <p class="text-xs text-gray-400">唯一标识，用于登录和资料链接，仅限字母、数字和下划线</p>
          <p v-if="usernameStatus" :class="usernameStatus.class">
            {{ usernameStatus.message }}
          </p>
        </div>

        <!-- Nickname -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="nickname" class="text-sm font-medium text-gray-700">昵称</label>
          <div class="flex gap-2">
            <input
              id="nickname"
              v-model="form.nickname"
              type="text"
              class="input input-bordered flex-1 bg-white"
              placeholder="你的显示名称"
            />
            <button
              type="button"
              class="btn btn-primary btn-sm shrink-0"
              :disabled="isUpdatingNickname || !isNicknameChanged"
              @click="updateNickname"
            >
              <span v-if="isUpdatingNickname" class="loading loading-spinner loading-xs"></span>
              <span v-else>更新</span>
            </button>
          </div>
          <p class="text-xs text-gray-400">公开显示的名称，最多 20 个字符</p>
          <p v-if="nicknameStatus" :class="nicknameStatus.class">
            {{ nicknameStatus.message }}
          </p>
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
            :disabled="isLoadingBio"
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

      <div class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
        <p v-if="bioStatus" :class="bioStatus.class">
          {{ bioStatus.message }}
        </p>
        <div v-else></div>
        <button
          type="button"
          class="btn btn-primary btn-sm gap-1.5"
          :disabled="isUpdatingBio || !isBioChanged"
          @click="updateBio"
        >
          <span v-if="isUpdatingBio" class="loading loading-spinner loading-xs"></span>
          <template v-else>
            <Save :size="14" />
            更新简介
          </template>
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

const { $api } = useNuxtApp()
const { fetchUser } = useAuth()

const form = reactive({
  username: props.user?.username || '',
  nickname: props.user?.nickname || '',
  bio: ''
})

const originalBio = ref('')
const isLoadingBio = ref(false)
const usernameStatus = ref(null)
const isUpdatingUsername = ref(false)
const nicknameStatus = ref(null)
const isUpdatingNickname = ref(false)
const bioStatus = ref(null)
const isUpdatingBio = ref(false)

// 加载用户简介
const loadBio = async () => {
  isLoadingBio.value = true
  try {
    const response = await $api('/v1/me/bio')
    form.bio = response?.bio || ''
    originalBio.value = form.bio
  } catch {
    // 静默处理
  } finally {
    isLoadingBio.value = false
  }
}

onMounted(() => {
  loadBio()
})

const isUsernameChanged = computed(() => {
  return form.username.trim() !== '' && form.username !== props.user?.username
})

const isNicknameChanged = computed(() => {
  return form.nickname.trim() !== '' && form.nickname !== props.user?.nickname
})

const isBioChanged = computed(() => {
  return (form.bio || '') !== originalBio.value
})

const validateUsername = () => {
  const username = form.username.trim()
  if (!username) {
    usernameStatus.value = null
    return false
  }

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username)
  if (isValid) {
    usernameStatus.value = {
      class: 'text-xs text-emerald-600 font-medium',
      message: '✓ 用户名有效'
    }
    return true
  } else {
    usernameStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: '✗ 用户名格式不正确（3-20字符，仅限字母、数字、下划线）'
    }
    return false
  }
}

const updateUsername = async () => {
  if (!validateUsername()) {
    return
  }

  isUpdatingUsername.value = true
  usernameStatus.value = null

  try {
    await $api('/v1/me/username', {
      method: 'PUT',
      body: {
        username: form.username.trim()
      }
    })

    usernameStatus.value = {
      class: 'text-xs text-emerald-600 font-medium',
      message: '✓ 用户名更新成功'
    }

    // 刷新全局用户信息
    await fetchUser()
  } catch (error) {
    usernameStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: error?.data?.message || '✗ 更新失败，请稍后重试'
    }
  } finally {
    isUpdatingUsername.value = false
  }
}

const updateNickname = async () => {
  const nickname = form.nickname.trim()
  if (!nickname) {
    nicknameStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: '✗ 昵称不能为空'
    }
    return
  }

  isUpdatingNickname.value = true
  nicknameStatus.value = null

  try {
    await $api('/v1/me/nickname', {
      method: 'PUT',
      body: { nickname }
    })

    nicknameStatus.value = {
      class: 'text-xs text-emerald-600 font-medium',
      message: '✓ 昵称更新成功'
    }

    await fetchUser()
  } catch (error) {
    nicknameStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: error?.data?.message || '✗ 更新失败，请稍后重试'
    }
  } finally {
    isUpdatingNickname.value = false
  }
}

const updateBio = async () => {
  isUpdatingBio.value = true
  bioStatus.value = null

  try {
    await $api('/v1/me/bio', {
      method: 'PUT',
      body: { bio: form.bio || '' }
    })

    bioStatus.value = {
      class: 'text-xs text-emerald-600 font-medium',
      message: '✓ 简介更新成功'
    }

    originalBio.value = form.bio || ''
    await fetchUser()
  } catch (error) {
    bioStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: error?.data?.message || '✗ 更新失败，请稍后重试'
    }
  } finally {
    isUpdatingBio.value = false
  }
}
</script>
