<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">{{ t('account_pages.profile.title') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ t('account_pages.profile.description') }}</p>
      </div>

      <div class="p-6 space-y-8">
        <!-- Avatar -->
        <div class="flex items-center gap-6">
          <div class="relative group shrink-0">
            <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-black/5 overflow-hidden">
              <NuxtImg
                v-if="avatarPreview"
                :src="avatarPreview"
                :alt="t('account_pages.profile.avatar_alt')"
                class="w-full h-full object-cover"
                @error="avatarPreview = ''"
              />
              <UserIcon v-else :size="32" class="text-gray-400" />
            </div>
            <button
              type="button"
              class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
              @click="showAvatarInput = !showAvatarInput"
            >
              <Camera :size="18" class="text-white" />
            </button>
          </div>
          <div class="space-y-2 flex-1 max-w-sm">
            <p class="text-sm font-medium text-gray-900">{{ t('account_pages.profile.avatar') }}</p>
            <div v-if="showAvatarInput" class="flex gap-2">
              <input
                v-model="form.avatar"
                type="url"
                class="input input-bordered input-sm flex-1 bg-white text-sm"
                placeholder="https://example.com/avatar.jpg"
                @input="onAvatarUrlInput"
              />
              <button
                type="button"
                class="btn btn-primary btn-sm shrink-0"
                :disabled="isUpdatingAvatar || !isAvatarChanged"
                @click="updateAvatar"
              >
                <span v-if="isUpdatingAvatar" class="loading loading-spinner loading-xs"></span>
                <span v-else>{{ t('common.save') }}</span>
              </button>
            </div>
            <p v-if="avatarStatus" :class="avatarStatus.class">{{ avatarStatus.message }}</p>
            <p v-else class="text-xs text-gray-400">{{ t('account_pages.profile.avatar_hint') }}</p>
          </div>
        </div>

        <!-- Banner -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="banner" class="text-sm font-medium text-gray-700">{{ t('account_pages.profile.banner') }}</label>
          <div class="flex gap-2">
            <input
              id="banner"
              v-model="form.banner"
              type="url"
              class="input input-bordered flex-1 bg-white"
              placeholder="https://example.com/banner.jpg"
            />
            <button
              v-if="form.banner?.trim() && form.banner.trim() === originalBanner"
              type="button"
              class="btn btn-ghost btn-sm shrink-0 text-gray-500"
              :disabled="isUpdatingBanner"
              @click="clearBanner"
            >
              {{ t('account_pages.profile.clear') }}
            </button>
            <button
              v-else
              type="button"
              class="btn btn-primary btn-sm shrink-0"
              :disabled="isUpdatingBanner || !isBannerChanged"
              @click="updateBanner"
            >
              <span v-if="isUpdatingBanner" class="loading loading-spinner loading-xs"></span>
              <span v-else>{{ t('common.save') }}</span>
            </button>
          </div>
          <p class="text-xs text-gray-400">{{ t('account_pages.profile.banner_hint') }}</p>
          <p v-if="bannerStatus" :class="bannerStatus.class">
            {{ bannerStatus.message }}
          </p>
        </div>

        <!-- Username -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="username" class="text-sm font-medium text-gray-700">{{ t('account_pages.profile.username') }}</label>
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
              <span v-else>{{ t('account_pages.profile.update') }}</span>
            </button>
          </div>
          <p class="text-xs text-gray-400">{{ t('account_pages.profile.username_hint') }}</p>
          <p v-if="usernameStatus" :class="usernameStatus.class">
            {{ usernameStatus.message }}
          </p>
        </div>

        <!-- Nickname -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="nickname" class="text-sm font-medium text-gray-700">{{ t('account_pages.profile.nickname') }}</label>
          <div class="flex gap-2">
            <input
              id="nickname"
              v-model="form.nickname"
              type="text"
              class="input input-bordered flex-1 bg-white"
              :placeholder="t('account_pages.profile.nickname_placeholder')"
            />
            <button
              type="button"
              class="btn btn-primary btn-sm shrink-0"
              :disabled="isUpdatingNickname || !isNicknameChanged"
              @click="updateNickname"
            >
              <span v-if="isUpdatingNickname" class="loading loading-spinner loading-xs"></span>
              <span v-else>{{ t('account_pages.profile.update') }}</span>
            </button>
          </div>
          <p class="text-xs text-gray-400">{{ t('account_pages.profile.nickname_hint') }}</p>
          <p v-if="nicknameStatus" :class="nicknameStatus.class">
            {{ nicknameStatus.message }}
          </p>
        </div>

        <!-- Bio -->
        <div class="grid gap-1.5">
          <div class="flex items-center justify-between">
            <label for="bio" class="text-sm font-medium text-gray-700">{{ t('account_pages.profile.bio') }}</label>
            <span class="text-xs text-gray-400">{{ t('account_pages.profile.markdown') }}</span>
          </div>
          <textarea
            id="bio"
            v-model="form.bio"
            rows="4"
            class="textarea textarea-bordered w-full bg-white resize-none font-mono text-sm"
            :disabled="isLoadingBio"
            :placeholder="t('account_pages.profile.bio_placeholder')"
            maxlength="500"
          />
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-400">{{ t('account_pages.profile.bio_hint') }}</p>
              <p class="text-xs text-gray-400">{{ form.bio?.length || 0 }}/500</p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs text-gray-500">
              <span class="px-2 py-1 bg-gray-50 rounded">**{{ t('account_pages.profile.markdown_bold') }}**</span>
              <span class="px-2 py-1 bg-gray-50 rounded">*{{ t('account_pages.profile.markdown_italic') }}*</span>
              <span class="px-2 py-1 bg-gray-50 rounded"># {{ t('account_pages.profile.markdown_heading') }}</span>
              <span class="px-2 py-1 bg-gray-50 rounded">- {{ t('account_pages.profile.markdown_list') }}</span>
              <span class="px-2 py-1 bg-gray-50 rounded">[{{ t('account_pages.profile.markdown_link') }}](url)</span>
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
            {{ t('account_pages.profile.update_bio') }}
          </template>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Camera, Save, User as UserIcon } from '@lucide/vue'

const props = defineProps({
  user: { type: Object, default: null }
})

const { $api } = useNuxtApp()
const { fetchUser } = useAuth()
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()

const form = reactive({
  username: props.user?.username || '',
  nickname: props.user?.nickname || '',
  bio: '',
  avatar: props.user?.avatar || '',
  banner: props.user?.banner || ''
})

const originalBio = ref('')
const isLoadingBio = ref(false)
const usernameStatus = ref(null)
const isUpdatingUsername = ref(false)
const nicknameStatus = ref(null)
const isUpdatingNickname = ref(false)
const bioStatus = ref(null)
const isUpdatingBio = ref(false)

// Banner
const bannerStatus = ref(null)
const isUpdatingBanner = ref(false)
const originalBanner = ref(props.user?.banner || '')

const isBannerChanged = computed(() => {
  return (form.banner?.trim() || '') !== originalBanner.value
})

const updateBanner = async () => {
  isUpdatingBanner.value = true
  bannerStatus.value = null
  const url = form.banner?.trim() || null

  try {
    await $api('/v1/me/banner', {
      method: 'PUT',
      body: { banner: url }
    })

    bannerStatus.value = {
      class: 'text-xs text-emerald-600 font-medium',
      message: t('account_pages.profile.banner_updated')
    }

    originalBanner.value = url || ''
    await fetchUser()
  } catch (error) {
    bannerStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: localizeError(error, 'account_pages.profile.update_failed')
    }
  } finally {
    isUpdatingBanner.value = false
  }
}

const clearBanner = async () => {
  isUpdatingBanner.value = true
  bannerStatus.value = null

  try {
    await $api('/v1/me/banner', {
      method: 'PUT',
      body: { banner: null }
    })

    bannerStatus.value = {
      class: 'text-xs text-emerald-600 font-medium',
      message: t('account_pages.profile.banner_cleared')
    }

    form.banner = ''
    originalBanner.value = ''
    await fetchUser()
  } catch (error) {
    bannerStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: localizeError(error, 'account_pages.profile.clear_failed')
    }
  } finally {
    isUpdatingBanner.value = false
  }
}

// Avatar
const showAvatarInput = ref(false)
const avatarPreview = ref(props.user?.avatar || '')
const avatarStatus = ref(null)
const isUpdatingAvatar = ref(false)
const originalAvatar = ref(props.user?.avatar || '')

const isAvatarChanged = computed(() => {
  return form.avatar.trim() !== originalAvatar.value
})

const onAvatarUrlInput = () => {
  avatarStatus.value = null
  const url = form.avatar.trim()
  avatarPreview.value = url || originalAvatar.value
}

const updateAvatar = async () => {
  const url = form.avatar.trim()
  isUpdatingAvatar.value = true
  avatarStatus.value = null

  try {
    await $api('/v1/me/avatar', {
      method: 'PUT',
      body: { avatar: url }
    })

    avatarStatus.value = {
      class: 'text-xs text-emerald-600 font-medium',
      message: t('account_pages.profile.avatar_updated')
    }

    originalAvatar.value = url
    avatarPreview.value = url
    await fetchUser()
  } catch (error) {
    avatarStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: localizeError(error, 'account_pages.profile.update_failed')
    }
  } finally {
    isUpdatingAvatar.value = false
  }
}

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
      message: t('account_pages.profile.username_available')
    }
    return true
  } else {
    usernameStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: t('account_pages.profile.username_invalid')
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
      message: t('account_pages.profile.username_updated')
    }

    // 刷新全局用户信息
    await fetchUser()
  } catch (error) {
    usernameStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: localizeError(error, 'account_pages.profile.update_failed')
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
      message: t('account_pages.profile.nickname_required')
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
      message: t('account_pages.profile.nickname_updated')
    }

    await fetchUser()
  } catch (error) {
    nicknameStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: localizeError(error, 'account_pages.profile.update_failed')
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
      message: t('account_pages.profile.bio_updated')
    }

    originalBio.value = form.bio || ''
    await fetchUser()
  } catch (error) {
    bioStatus.value = {
      class: 'text-xs text-red-600 font-medium',
      message: localizeError(error, 'account_pages.profile.update_failed')
    }
  } finally {
    isUpdatingBio.value = false
  }
}
</script>
