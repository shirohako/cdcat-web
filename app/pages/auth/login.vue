<template>
  <div class="flex w-full max-w-[24rem] flex-col gap-6 px-5 py-8 sm:py-12 lg:py-14">
    <AuthStepHead :title="t('auth.login.title')" :lead="t('auth.login.subtitle')" />

    <!-- A danger UiAlert is role="alert"; the admin smoke test finds it by that role -->
    <UiAlert v-if="errorMessage" tone="danger">{{ errorMessage }}</UiAlert>

    <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
      <UiField id="email" :label="t('auth.login.email')">
        <template #default="{ id }">
          <UiInput :id="id" v-model="formData.email" type="email" autocomplete="email" :placeholder="t('auth.login.email_placeholder')" class="h-11 w-full rounded-md" required />
        </template>
      </UiField>
      <UiField id="password" :label="t('auth.login.password')">
        <template #default="{ id }">
          <div class="relative">
            <UiInput
              :id="id"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :placeholder="t('auth.login.password_placeholder')"
              class="h-11 w-full rounded-md pr-11"
              required
            />
            <button
              type="button"
              class="absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-meta transition-colors hover:text-title"
              :aria-label="showPassword ? t('auth.password.hide') : t('auth.password.show')"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <UiIcon :icon="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="size-[18px]" />
            </button>
          </div>
        </template>
      </UiField>
      <div class="flex items-center justify-between gap-3">
        <UiFlipCheckbox v-model="formData.remember">{{ t('auth.login.remember_me') }}</UiFlipCheckbox>
        <NuxtLink to="/auth/forgot-password" class="link text-[13px] font-semibold">{{ t('auth.login.forgot_password') }}</NuxtLink>
      </div>
      <UiButton type="submit" variant="primary" size="lg" block class="rounded-md" :loading="isLoading" :icon-right="isLoading ? undefined : 'lucide:arrow-right'">
        {{ isLoading ? t('auth.login.logging_in') : t('auth.login.login') }}
      </UiButton>
    </form>

    <div class="flex items-center gap-3 text-xs text-faint before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
      {{ t('auth.login.or_use') }}
    </div>
    <UiButton size="lg" block class="rounded-md" @click="showGithubDialog = true">
      <svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
      <span>{{ t('auth.login.github_login') }}</span>
    </UiButton>

    <p class="text-center text-[13px] text-meta">
      {{ t('auth.login.no_account') }}
      <NuxtLink to="/auth/register" class="link ml-1 font-semibold">{{ t('auth.login.register_now') }}</NuxtLink>
    </p>

    <div
      v-if="showGithubDialog"
      class="fixed inset-0 z-120 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      @click.self="showGithubDialog = false"
    >
      <div role="dialog" aria-modal="true" class="w-full max-w-sm rounded-2xl bg-card p-6 shadow-overlay ring-1 ring-line">
        <h2 class="text-lg font-bold text-title">{{ t('auth.login.github_coming_soon_title') }}</h2>
        <p class="mt-2 text-sm text-body">{{ t('auth.login.github_coming_soon_message') }}</p>
        <UiButton variant="primary" block class="mt-5 rounded-md" @click="showGithubDialog = false">
          {{ t('auth.login.github_coming_soon_confirm') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const { login } = useAuth()
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()
// The login record, its stylus on the first track
useAuthStageTrack().value = 1

const formData = ref({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showGithubDialog = ref(false)

const handleLogin = async () => {
  if (isLoading.value) return

  errorMessage.value = ''
  isLoading.value = true

  try {
    const result = await login({
      email: formData.value.email,
      password: formData.value.password,
      remember: formData.value.remember
    })

    if (result.success) {
      // Back to where the reader was sent from, if anywhere
      const redirectQuery = route.query.redirect
      const redirectTo = typeof redirectQuery === 'string' ? redirectQuery : '/'
      await router.push(redirectTo)
    } else {
      errorMessage.value = result.error || t('auth.login.login_failed')
    }
  } catch (error) {
    errorMessage.value = localizeError(error, 'auth.login.login_failed')
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: computed(() => t('user.login')),
  meta: [
    { name: 'robots', content: 'noindex' },
    {
      name: 'description',
      content: computed(() => t('auth.login.meta_description'))
    }
  ]
})
</script>
