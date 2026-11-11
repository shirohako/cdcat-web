<template>
  <div class="space-y-6">
    <section class="card overflow-hidden">
      <div class="p-6 pb-5 border-b border-line">
        <h2 class="text-base font-semibold text-title">{{ t('account_pages.profile.title') }}</h2>
        <p class="text-sm text-meta mt-1">{{ t('account_pages.profile.description') }}</p>
      </div>

      <div class="p-6 space-y-8">
        <!-- Avatar and banner: uploads, as in the artist editor, saved as soon as one is picked. The old picture, if
             nothing else uses it, is removed by images:prune after the site's cleanup days. -->
        <div class="grid max-w-2xl gap-6 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <div class="space-y-1.5">
            <p class="text-sm font-medium text-body">{{ t('account_pages.profile.avatar') }}</p>
            <EditorImageSlot
              variant="avatar"
              purpose="profile"
              :file="images?.avatar_image"
              :preview-url="images?.avatar_image ? null : (images?.avatar_url ?? user?.avatar_url)"
              :error="avatarStatus?.error"
              @use="saveAvatar"
            />
            <p v-if="avatarStatus?.done" class="text-xs font-medium text-success">{{ avatarStatus.done }}</p>
          </div>
          <div class="space-y-1.5">
            <p class="text-sm font-medium text-body">{{ t('account_pages.profile.banner') }}</p>
            <EditorImageSlot
              variant="banner"
              purpose="profile"
              :file="images?.banner_image"
              :preview-url="images?.banner_image ? null : images?.banner_url"
              :error="bannerStatus?.error"
              removable
              @use="saveBanner"
              @remove="saveBanner(null)"
            />
            <p v-if="bannerStatus?.done" class="text-xs font-medium text-success">{{ bannerStatus.done }}</p>
            <p v-else class="text-xs text-meta">{{ t('account_pages.profile.banner_hint') }}</p>
          </div>
        </div>

        <!-- Username -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="username" class="text-sm font-medium text-body">{{ t('account_pages.profile.username') }}</label>
          <div class="flex gap-2">
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="input flex-1"
              placeholder="unique_username"
              @change="validateUsername"
            >
            <UiButton
              variant="primary"
              size="sm"
              class="shrink-0"
              :loading="isUpdatingUsername"
              :disabled="!isUsernameChanged"
              @click="updateUsername"
            >
              {{ t('account_pages.profile.update') }}
            </UiButton>
          </div>
          <p class="text-xs text-meta">{{ t('account_pages.profile.username_hint') }}</p>
          <p v-if="usernameStatus" :class="usernameStatus.class">
            {{ usernameStatus.message }}
          </p>
        </div>

        <!-- Nickname -->
        <div class="grid gap-1.5 max-w-sm">
          <label for="nickname" class="text-sm font-medium text-body">{{ t('account_pages.profile.nickname') }}</label>
          <div class="flex gap-2">
            <input
              id="nickname"
              v-model="form.nickname"
              type="text"
              class="input flex-1"
              :placeholder="t('account_pages.profile.nickname_placeholder')"
            >
            <UiButton
              variant="primary"
              size="sm"
              class="shrink-0"
              :loading="isUpdatingNickname"
              :disabled="!isNicknameChanged"
              @click="updateNickname"
            >
              {{ t('account_pages.profile.update') }}
            </UiButton>
          </div>
          <p class="text-xs text-meta">{{ t('account_pages.profile.nickname_hint') }}</p>
          <p v-if="nicknameStatus" :class="nicknameStatus.class">
            {{ nicknameStatus.message }}
          </p>
        </div>

        <!-- Bio -->
        <div class="grid gap-1.5">
          <div class="flex items-center justify-between">
            <label for="bio" class="text-sm font-medium text-body">{{ t('account_pages.profile.bio') }}</label>
            <span class="text-xs text-meta">{{ t('account_pages.profile.markdown') }}</span>
          </div>
          <textarea
            id="bio"
            v-model="form.bio"
            rows="4"
            class="textarea w-full resize-none text-sm"
            :disabled="isLoadingBio"
            :placeholder="t('account_pages.profile.bio_placeholder')"
            maxlength="500"
          />
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <p class="text-xs text-meta">{{ t('account_pages.profile.bio_hint') }}</p>
              <p class="text-xs text-meta">{{ form.bio?.length || 0 }}/500</p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs text-meta">
              <span class="px-2 py-1 bg-sunken rounded">**{{ t('account_pages.profile.markdown_bold') }}**</span>
              <span class="px-2 py-1 bg-sunken rounded">*{{ t('account_pages.profile.markdown_italic') }}*</span>
              <span class="px-2 py-1 bg-sunken rounded"># {{ t('account_pages.profile.markdown_heading') }}</span>
              <span class="px-2 py-1 bg-sunken rounded">- {{ t('account_pages.profile.markdown_list') }}</span>
              <span class="px-2 py-1 bg-sunken rounded">[{{ t('account_pages.profile.markdown_link') }}](url)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-sunken border-t border-line flex items-center justify-between">
        <p v-if="bioStatus" :class="bioStatus.class">
          {{ bioStatus.message }}
        </p>
        <div v-else/>
        <UiButton variant="primary" size="sm" :icon="Save" :loading="isUpdatingBio" :disabled="!isBioChanged" @click="updateBio">
          {{ t('account_pages.profile.update_bio') }}
        </UiButton>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Save } from '@lucide/vue'

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

// Avatar and banner (GET /v1/me/profile-images: /me has no images, it is kept whole in a cookie)
const images = ref(null)
const avatarStatus = ref(null)
const bannerStatus = ref(null)

const loadImages = async () => {
  try {
    images.value = await $api('/v1/me/profile-images')
  } catch {
    // The slots show the avatar from /me and no banner.
  }
}

const saveAvatar = async (image) => {
  avatarStatus.value = null
  try {
    const saved = await $api('/v1/me/avatar', { method: 'PUT', body: { image_id: image.id } })
    images.value = { ...images.value, avatar_url: saved.avatar_url, avatar_image: saved.avatar_image }
    avatarStatus.value = { done: t('account_pages.profile.avatar_updated') }
    await fetchUser()
  } catch (error) {
    avatarStatus.value = { error: localizeError(error, 'account_pages.profile.update_failed') }
  }
}

/** A new banner, or none (null). */
const saveBanner = async (image) => {
  bannerStatus.value = null
  try {
    const saved = await $api('/v1/me/banner', { method: 'PUT', body: { image_id: image?.id ?? null } })
    images.value = { ...images.value, banner_url: saved.banner_url, banner_image: saved.banner_image }
    bannerStatus.value = { done: t(image ? 'account_pages.profile.banner_updated' : 'account_pages.profile.banner_cleared') }
  } catch (error) {
    bannerStatus.value = { error: localizeError(error, 'account_pages.profile.update_failed') }
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
  loadImages()
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
      class: 'text-xs text-success font-medium',
      message: t('account_pages.profile.username_available')
    }
    return true
  } else {
    usernameStatus.value = {
      class: 'text-xs text-danger font-medium',
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
      class: 'text-xs text-success font-medium',
      message: t('account_pages.profile.username_updated')
    }

    // 刷新全局用户信息
    await fetchUser()
  } catch (error) {
    usernameStatus.value = {
      class: 'text-xs text-danger font-medium',
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
      class: 'text-xs text-danger font-medium',
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
      class: 'text-xs text-success font-medium',
      message: t('account_pages.profile.nickname_updated')
    }

    await fetchUser()
  } catch (error) {
    nicknameStatus.value = {
      class: 'text-xs text-danger font-medium',
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
      class: 'text-xs text-success font-medium',
      message: t('account_pages.profile.bio_updated')
    }

    originalBio.value = form.bio || ''
    await fetchUser()
  } catch (error) {
    bioStatus.value = {
      class: 'text-xs text-danger font-medium',
      message: localizeError(error, 'account_pages.profile.update_failed')
    }
  } finally {
    isUpdatingBio.value = false
  }
}
</script>
