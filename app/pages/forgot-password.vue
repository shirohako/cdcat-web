<template>
  <div class="min-h-screen relative overflow-hidden bg-linear-to-br from-sky-50 via-slate-50 to-amber-50 flex items-center justify-center p-4">
    <!-- Decorative Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute bottom-0 inset-x-0 h-[40%] bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[50px_50px] mask-[linear-gradient(to_top,black_0%,transparent_100%)] animate-[grid-flow_20s_linear_infinite]"></div>
      <div class="absolute rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.15),transparent_70%)] blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-75 h-75 -bottom-25 -left-12.5"></div>
      <div class="absolute rounded-full blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-62.5 h-62.5 -bottom-20 right-[20%] bg-[radial-gradient(circle,rgba(244,165,96,0.15),transparent_70%)] [animation-delay:2s]"></div>
      <div class="absolute rounded-full blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-50 h-50 -bottom-15 -right-7.5 bg-[radial-gradient(circle,rgba(16,185,129,0.15),transparent_70%)] [animation-delay:4s]"></div>
    </div>

    <!-- Card -->
    <div class="relative z-10 w-full max-w-md">
      <div class="bg-[linear-gradient(140deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] border border-white/80 rounded-4xl p-10 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-md">

        <!-- Step 3: Success -->
        <template v-if="step === 3">
          <div class="text-center animate-[fade-in_0.6s_ease_both]">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
              <CheckCircle :size="32" class="text-emerald-500" />
            </div>
            <h1 class="text-2xl font-black text-slate-900 mb-2">{{ $t('auth.forgot_password.success_title') }}</h1>
            <p class="text-slate-600 mb-6">{{ $t('auth.forgot_password.success_message') }}</p>
            <NuxtLink
              to="/auth/login"
              class="inline-flex items-center gap-2 py-3 px-6 bg-linear-to-r from-sky-500 to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_10px_30px_-20px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-22px_rgba(14,165,233,0.6)]"
            >
              <LogIn :size="18" />
              <span>{{ $t('auth.forgot_password.back_to_login') }}</span>
            </NuxtLink>
          </div>
        </template>

        <!-- Step 1: Enter Email -->
        <template v-else-if="step === 1">
          <!-- Header -->
          <div class="text-center mb-8 animate-[fade-in_0.6s_ease_both]">
            <div class="inline-flex items-center gap-2 mb-4">
              <div class="h-12 w-12 rounded-xl bg-linear-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                <KeyRound :size="24" />
              </div>
            </div>
            <h1 class="text-3xl font-black text-slate-900 mb-2">{{ $t('auth.forgot_password.title') }}</h1>
            <p class="text-slate-600">{{ $t('auth.forgot_password.subtitle') }}</p>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="animate-[fade-in_0.6s_ease_both] bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
          </div>

          <!-- Email Form -->
          <form @submit.prevent="handleSendCode" class="space-y-4 animate-[fade-in_0.7s_ease_both]">
            <div class="flex flex-col gap-2">
              <label for="email" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Mail :size="16" />
                <span>{{ $t('auth.forgot_password.email') }}</span>
              </label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="example@email.com"
                class="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-sky-500 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)] focus:bg-white placeholder:text-slate-400"
                required
              />
            </div>

            <button
              type="submit"
              class="group flex items-center justify-center gap-2 w-full py-3 px-6 bg-linear-to-r from-sky-500 to-emerald-500 text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 shadow-[0_10px_30px_-20px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-22px_rgba(14,165,233,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!formData.email || isSendingCode"
            >
              <div v-if="isSendingCode" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <Mail v-else :size="20" />
              <span>{{ isSendingCode ? $t('auth.forgot_password.sending') : $t('auth.forgot_password.send_code') }}</span>
              <ArrowRight v-if="!isSendingCode" :size="18" class="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>

          <!-- Back to Login -->
          <div class="mt-6 text-center text-sm animate-[fade-in_0.8s_ease_both]">
            <NuxtLink
              to="/auth/login"
              class="text-sky-600 hover:text-sky-700 font-semibold transition-colors"
            >
              {{ $t('auth.forgot_password.back_to_login') }}
            </NuxtLink>
          </div>
        </template>

        <!-- Step 2: Enter Code & New Password -->
        <template v-else-if="step === 2">
          <!-- Header -->
          <div class="text-center mb-8 animate-[fade-in_0.6s_ease_both]">
            <div class="inline-flex items-center gap-2 mb-4">
              <div class="h-12 w-12 rounded-xl bg-linear-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                <KeyRound :size="24" />
              </div>
            </div>
            <h1 class="text-3xl font-black text-slate-900 mb-2">{{ $t('auth.forgot_password.step2_title') }}</h1>
            <p class="text-slate-600">{{ $t('auth.forgot_password.step2_subtitle') }}</p>
          </div>

          <!-- Email Display -->
          <div class="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mb-4 animate-[fade-in_0.6s_ease_both]">
            <div class="flex items-center gap-2 text-sm text-sky-700">
              <Mail :size="16" />
              <span>{{ formData.email }}</span>
            </div>
            <button
              type="button"
              @click="step = 1; errorMessage = ''; errorDetails = []"
              class="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
            >
              {{ $t('auth.forgot_password.change_email') }}
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage || errorDetails.length" class="animate-[fade-in_0.6s_ease_both] bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p v-if="errorMessage" class="text-sm text-red-600 font-bold">{{ errorMessage }}</p>
            <ul v-if="errorDetails.length" class="text-sm text-red-600 list-disc list-inside">
              <li v-for="detail in errorDetails" :key="detail">{{ detail }}</li>
            </ul>
          </div>

          <!-- Reset Form -->
          <form @submit.prevent="handleResetPassword" class="space-y-4 animate-[fade-in_0.7s_ease_both]">
            <!-- Verification Code -->
            <div class="flex flex-col gap-2">
              <label for="verificationCode" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <ShieldCheck :size="16" />
                <span>{{ $t('auth.forgot_password.verification_code') }}</span>
              </label>
              <div class="flex gap-2">
                <input
                  id="verificationCode"
                  v-model="formData.verificationCode"
                  type="text"
                  :placeholder="$t('auth.forgot_password.code_placeholder')"
                  maxlength="6"
                  class="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-sky-500 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)] focus:bg-white placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  @click="handleSendCode"
                  :disabled="countdown > 0 || isSendingCode"
                  class="shrink-0 px-4 py-3 text-sm font-semibold rounded-xl border transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="countdown > 0 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100'"
                >
                  {{ countdown > 0 ? `${countdown}s` : $t('auth.forgot_password.resend') }}
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div class="flex flex-col gap-2">
              <label for="password" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Lock :size="16" />
                <span>{{ $t('auth.forgot_password.new_password') }}</span>
              </label>
              <div class="relative">
                <input
                  id="password"
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('auth.forgot_password.password_placeholder')"
                  class="w-full py-3 px-4 pr-12 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-sky-500 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)] focus:bg-white placeholder:text-slate-400"
                  required
                  minlength="8"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Eye v-if="!showPassword" :size="20" />
                  <EyeOff v-if="showPassword" :size="20" />
                </button>
              </div>
              <!-- Password strength indicator -->
              <div class="flex gap-1 mt-2">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-all duration-300"
                  :class="passwordStrength >= i ? 'bg-emerald-500' : 'bg-slate-200'"
                ></div>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ $t('auth.forgot_password.password_strength') }}:
                <span :class="passwordStrengthColor">{{ passwordStrengthText }}</span>
              </p>
            </div>

            <!-- Confirm Password -->
            <div class="flex flex-col gap-2">
              <label for="confirmPassword" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Lock :size="16" />
                <span>{{ $t('auth.forgot_password.confirm_password') }}</span>
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :placeholder="$t('auth.forgot_password.confirm_placeholder')"
                  class="w-full py-3 px-4 pr-12 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-sky-500 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)] focus:bg-white placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Eye v-if="!showConfirmPassword" :size="20" />
                  <EyeOff v-if="showConfirmPassword" :size="20" />
                </button>
              </div>
              <p
                v-if="formData.confirmPassword && formData.password !== formData.confirmPassword"
                class="text-xs text-red-500 mt-1"
              >
                {{ $t('auth.forgot_password.password_mismatch') }}
              </p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="group flex items-center justify-center gap-2 w-full py-3 px-6 bg-linear-to-r from-sky-500 to-emerald-500 text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 shadow-[0_10px_30px_-20px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-22px_rgba(14,165,233,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!isResetFormValid || isLoading"
            >
              <div v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <KeyRound v-else :size="20" />
              <span>{{ isLoading ? $t('auth.forgot_password.resetting') : $t('auth.forgot_password.reset') }}</span>
              <ArrowRight v-if="!isLoading" :size="18" class="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </form>

          <!-- Back to Login -->
          <div class="mt-6 text-center text-sm animate-[fade-in_0.8s_ease_both]">
            <NuxtLink
              to="/auth/login"
              class="text-sky-600 hover:text-sky-700 font-semibold transition-colors"
            >
              {{ $t('auth.forgot_password.back_to_login') }}
            </NuxtLink>
          </div>
        </template>
      </div>

      <!-- Back to Home -->
      <div class="mt-6 text-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft :size="16" />
          <span>{{ $t('common.back_home') }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, KeyRound, CheckCircle, LogIn } from 'lucide-vue-next'

const { $api } = useNuxtApp()
const { t } = useI18n()
const router = useRouter()

const step = ref(1)
const formData = ref({
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)
const errorMessage = ref('')
const errorDetails = ref<string[]>([])
let countdownTimer: ReturnType<typeof setInterval> | null = null

const fieldLabels = computed(() => ({
  email: t('auth.forgot_password.email'),
  password: t('auth.forgot_password.new_password'),
  verification_code: t('auth.forgot_password.verification_code'),
  password_confirmation: t('auth.forgot_password.confirm_password')
}))

const setError = (message: string, details?: Record<string, string[]>) => {
  if (details && Object.keys(details).length) {
    errorDetails.value = Object.entries(details).flatMap(
      ([field, messages]) => messages.map(msg => `${(fieldLabels.value as Record<string, string>)[field] || field}: ${msg}`)
    )
  } else {
    errorDetails.value = []
  }
  errorMessage.value = message
}

const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer!)
      countdownTimer = null
    }
  }, 1000)
}

const handleSendCode = async () => {
  if (!formData.value.email || isSendingCode.value || countdown.value > 0) return

  isSendingCode.value = true
  errorMessage.value = ''
  errorDetails.value = []

  try {
    await $api('/v1/auth/forgot-password', {
      method: 'POST',
      body: { email: formData.value.email }
    })
    startCountdown()
    step.value = 2
  } catch (error: any) {
    const apiError = error.details
    setError(apiError?.message || error.message || t('auth.forgot_password.send_failed'), apiError?.details)
  } finally {
    isSendingCode.value = false
  }
}

const passwordStrength = computed(() => {
  const password = formData.value.password
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++

  return Math.min(strength, 4)
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength === 0) return t('auth.forgot_password.strength_weak')
  if (strength === 1) return t('auth.forgot_password.strength_fair')
  if (strength === 2) return t('auth.forgot_password.strength_medium')
  if (strength === 3) return t('auth.forgot_password.strength_strong')
  return t('auth.forgot_password.strength_very_strong')
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'text-red-500'
  if (strength === 2) return 'text-amber-500'
  if (strength === 3) return 'text-emerald-500'
  return 'text-emerald-600 font-semibold'
})

const isResetFormValid = computed(() => {
  return (
    formData.value.verificationCode.length === 6 &&
    formData.value.password.length >= 8 &&
    formData.value.password === formData.value.confirmPassword
  )
})

const handleResetPassword = async () => {
  if (isLoading.value || !isResetFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''
  errorDetails.value = []

  try {
    await $api('/v1/auth/reset-password', {
      method: 'POST',
      body: {
        email: formData.value.email,
        verification_code: formData.value.verificationCode,
        password: formData.value.password,
        password_confirmation: formData.value.confirmPassword
      }
    })
    step.value = 3
    setTimeout(() => {
      router.push('/auth/login')
    }, 3000)
  } catch (error: any) {
    const apiError = error.details
    setError(apiError?.message || error.message || t('auth.forgot_password.reset_failed'), apiError?.details)
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

useHead({
  title: computed(() => `${t('auth.forgot_password.title')} - CDCAT`),
  meta: [
    {
      name: 'description',
      content: computed(() => t('auth.forgot_password.subtitle'))
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
