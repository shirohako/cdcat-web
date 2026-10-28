<template>
  <div class="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4 gap-4">
    <!-- Decorative Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute bottom-0 inset-x-0 h-[40%] bg-[linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] bg-size-[50px_50px] mask-[linear-gradient(to_top,black_0%,transparent_100%)] animate-[grid-flow_20s_linear_infinite]"></div>
      <div class="absolute rounded-full bg-radial from-primary/15 to-transparent to-70% blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-75 h-75 -bottom-25 -left-12.5"></div>
      <div class="absolute rounded-full blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-62.5 h-62.5 -bottom-20 right-[20%] bg-radial from-primary/10 to-transparent to-70% [animation-delay:2s]"></div>
      <div class="absolute rounded-full blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-50 h-50 -bottom-15 -right-7.5 bg-radial from-primary/15 to-transparent to-70% [animation-delay:4s]"></div>
    </div>

    <!-- Login Card -->
    <div class="relative z-10 w-full max-w-md">
      <div class="card p-10">
        <!-- Header -->
        <div class="text-center mb-8 animate-[fade-in_0.6s_ease_both]">
          <div class="inline-flex items-center gap-2 mb-4">
            <div class="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-on-primary">
              <Music :size="24" />
            </div>
          </div>
          <h1 class="text-3xl font-black text-title mb-2">{{ $t('auth.login.title') }}</h1>
          <p class="text-body">{{ $t('auth.login.subtitle') }}</p>
        </div>

        <!-- Error Message (a danger UiAlert is role="alert"; the admin smoke test finds it by that role) -->
        <UiAlert v-if="errorMessage" tone="danger" class="animate-[fade-in_0.6s_ease_both] mb-4">
          {{ errorMessage }}
        </UiAlert>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4 animate-[fade-in_0.7s_ease_both]">
          <!-- Email Input -->
          <div class="flex flex-col gap-2">
            <label for="email" class="flex items-center gap-2 text-sm font-semibold text-body">
              <Mail :size="16" />
              <span>{{ $t('auth.login.email') }}</span>
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              :placeholder="$t('auth.login.email_placeholder')"
              class="input w-full h-11"
              required
            />
          </div>

          <!-- Password Input -->
          <div class="flex flex-col gap-2">
            <label for="password" class="flex items-center gap-2 text-sm font-semibold text-body">
              <Lock :size="16" />
              <span>{{ $t('auth.login.password') }}</span>
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="$t('auth.login.password_placeholder')"
                class="input w-full h-11 pr-12"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-meta hover:text-primary transition-colors"
              >
                <Eye v-if="!showPassword" :size="20" />
                <EyeOff v-if="showPassword" :size="20" />
              </button>
            </div>
          </div>

          <!-- Remember & Forgot -->
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                v-model="formData.remember"
                type="checkbox"
                class="checkbox checkbox-sm cursor-pointer"
              />
              <span class="text-body group-hover:text-title transition-colors">{{ $t('auth.login.remember_me') }}</span>
            </label>
            <NuxtLink
              to="/forgot-password"
              class="link font-semibold"
            >
              {{ $t('auth.login.forgot_password') }}
            </NuxtLink>
          </div>

          <!-- Submit Button -->
          <UiButton
            type="submit"
            variant="primary"
            size="lg"
            :icon="LogIn"
            :loading="isLoading"
            block
            class="group"
          >
            <span>{{ isLoading ? $t('auth.login.logging_in') : $t('auth.login.login') }}</span>
            <ArrowRight v-if="!isLoading" :size="18" class="transition-transform duration-150 ease-out group-hover:translate-x-1" />
          </UiButton>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-line"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card px-3 text-meta font-semibold tracking-wider">{{ $t('auth.login.or_use') }}</span>
          </div>
        </div>

        <!-- Social Login -->
        <div class="space-y-3 animate-[fade-in_0.8s_ease_0.05s_both]">
          <UiButton
            variant="outline"
            size="lg"
            block
            @click="handleGithubLogin"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span>{{ $t('auth.login.github_login') }}</span>
          </UiButton>
        </div>

        <!-- Sign Up Link -->
        <div class="mt-6 text-center text-sm animate-[fade-in_0.9s_ease_0.1s_both]">
          <span class="text-body">{{ $t('auth.login.no_account') }}</span>
          <NuxtLink
            to="/auth/register"
            class="link ml-1 font-semibold"
          >
            {{ $t('auth.login.register_now') }}
          </NuxtLink>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="mt-6 text-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-body hover:text-primary transition-colors"
        >
          <ArrowLeft :size="16" />
          <span>{{ $t('common.back_home') }}</span>
        </NuxtLink>
      </div>
    </div>

    <div
      v-if="showGithubDialog"
      class="fixed inset-0 z-120 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="showGithubDialog = false"
    >
      <div
        role="dialog"
        aria-modal="true"
        class="w-full max-w-sm rounded-2xl bg-card p-6 ring-1 ring-line shadow-overlay"
      >
        <h2 class="text-lg font-bold text-title">{{ $t('auth.login.github_coming_soon_title') }}</h2>
        <p class="mt-2 text-sm text-body">{{ $t('auth.login.github_coming_soon_message') }}</p>
        <UiButton
          variant="primary"
          block
          class="mt-5"
          @click="showGithubDialog = false"
        >
          {{ $t('auth.login.github_coming_soon_confirm') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Music, Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, ArrowLeft } from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()
const { t } = useI18n()
const { localizeError } = useLocalizedApiError()

const formData = ref({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showGithubDialog = ref(false)

const handleGithubLogin = () => {
  showGithubDialog.value = true
}

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
      // 登录成功，检查是否有重定向参数
      const redirectQuery = route.query.redirect
      const redirectTo = typeof redirectQuery === 'string' ? redirectQuery : '/'
      await router.push(redirectTo)
    } else {
      // 登录失败，显示错误信息
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

<style scoped>
@keyframes grid-flow {
  0% { background-position: 0 0, 0 0; }
  100% { background-position: 50px 50px, 50px 50px; }
}

@keyframes float-circle {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
