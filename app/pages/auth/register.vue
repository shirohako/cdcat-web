<template>
  <div class="min-h-screen relative overflow-hidden bg-linear-to-br from-emerald-50 via-slate-50 to-sky-50 flex items-center justify-center p-4">
    <!-- Decorative Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute bottom-0 inset-x-0 h-[40%] bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[50px_50px] mask-[linear-gradient(to_top,black_0%,transparent_100%)] animate-[grid-flow_20s_linear_infinite]"></div>
      <div class="absolute rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.15),transparent_70%)] blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-75 h-75 -bottom-25 -left-12.5"></div>
      <div class="absolute rounded-full blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-62.5 h-62.5 -bottom-20 right-[20%] bg-[radial-gradient(circle,rgba(56,189,248,0.15),transparent_70%)] [animation-delay:2s]"></div>
      <div class="absolute rounded-full blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-50 h-50 -bottom-15 -right-7.5 bg-[radial-gradient(circle,rgba(244,165,96,0.15),transparent_70%)] [animation-delay:4s]"></div>
    </div>

    <!-- Register Card -->
    <div class="relative z-10 w-full max-w-md">
      <div class="bg-[linear-gradient(140deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] border border-white/80 rounded-4xl p-10 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-md">
        <!-- Header -->
        <div class="text-center mb-8 animate-[fade-in_0.6s_ease_both]">
          <div class="inline-flex items-center gap-2 mb-4">
            <div class="h-12 w-12 rounded-xl bg-linear-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white shadow-lg">
              <Music :size="24" />
            </div>
          </div>
          <h1 class="text-3xl font-black text-slate-900 mb-2">{{ $t('auth.register.title') }}</h1>
          <p class="text-slate-600">{{ $t('auth.register.subtitle') }}</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage || errorDetails.length" class="animate-[fade-in_0.6s_ease_both] bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p v-if="errorMessage" class="text-sm text-red-600 font-bold">{{ errorMessage }}</p>
          <ul v-if="errorDetails.length" class="text-sm text-red-600 list-disc list-inside">
            <li v-for="detail in errorDetails" :key="detail">{{ detail }}</li>
          </ul>
        </div>

        <!-- Register Form -->
        <form @submit.prevent="handleRegister" class="space-y-4 animate-[fade-in_0.7s_ease_both]">
          <!-- Nickname Input -->
          <div class="flex flex-col gap-2">
            <label for="nickname" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <User :size="16" />
              <span>{{ $t('auth.register.nickname') }}</span>
            </label>
            <input
              id="nickname"
              v-model="formData.nickname"
              type="text"
              :placeholder="$t('auth.register.nickname_placeholder')"
              maxlength="32"
              class="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] focus:bg-white placeholder:text-slate-400"
              required
            />
          </div>

          <!-- Email Input -->
          <div class="flex flex-col gap-2">
            <label for="email" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Mail :size="16" />
              <span>{{ $t('auth.register.email') }}</span>
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              :placeholder="$t('auth.register.email_placeholder')"
              class="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] focus:bg-white placeholder:text-slate-400"
              required
            />
          </div>

          <!-- Verification Code Input -->
          <div class="flex flex-col gap-2">
            <label for="verificationCode" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <ShieldCheck :size="16" />
              <span>{{ $t('auth.register.verification_code') }}</span>
            </label>
            <div class="flex gap-2">
              <input
                id="verificationCode"
                v-model="formData.verificationCode"
                type="text"
                :placeholder="$t('auth.register.verification_code_placeholder')"
                maxlength="6"
                class="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] focus:bg-white placeholder:text-slate-400"
                required
              />
              <button
                type="button"
                @click="sendVerificationCode"
                :disabled="!formData.email || countdown > 0 || isSendingCode"
                class="shrink-0 px-4 py-3 text-sm font-semibold rounded-xl border transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                :class="countdown > 0 ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'"
              >
                {{ countdown > 0 ? `${countdown}s` : $t('auth.register.send_code') }}
              </button>
            </div>
          </div>

          <!-- Password Input -->
          <div class="flex flex-col gap-2">
            <label for="password" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Lock :size="16" />
              <span>{{ $t('auth.register.password') }}</span>
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="$t('auth.register.password_placeholder')"
                class="w-full py-3 px-4 pr-12 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] focus:bg-white placeholder:text-slate-400"
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
              {{ $t('auth.register.password_strength') }}:
              <span :class="passwordStrengthColor">{{ passwordStrengthText }}</span>
            </p>
          </div>

          <!-- Confirm Password Input -->
          <div class="flex flex-col gap-2">
            <label for="confirmPassword" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Lock :size="16" />
              <span>{{ $t('auth.register.confirm_password') }}</span>
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                :placeholder="$t('auth.register.confirm_password_placeholder')"
                class="w-full py-3 px-4 pr-12 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] focus:bg-white placeholder:text-slate-400"
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
              {{ $t('auth.register.password_mismatch') }}
            </p>
          </div>

          <!-- Birthday Input -->
          <div class="flex flex-col gap-2">
            <label for="birthday" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Cake :size="16" />
              <span>{{ $t('auth.register.birthday') }}</span>
            </label>
            <input
              id="birthday"
              v-model="formData.birthday"
              type="date"
              class="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] focus:bg-white placeholder:text-slate-400"
              required
            />
            <p class="text-xs text-slate-500 mt-1">{{ $t('auth.register.birthday_hint') }}</p>
          </div>

          <!-- Terms & Conditions -->
          <div class="flex items-start gap-2">
            <input
              id="terms"
              v-model="formData.acceptTerms"
              type="checkbox"
              class="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 transition-all cursor-pointer"
              required
            />
            <label for="terms" class="text-sm text-slate-600 cursor-pointer">
              {{ $t('auth.register.agree_prefix') }}
              <NuxtLink to="/terms" class="text-emerald-600 hover:text-emerald-700 font-semibold">
                {{ $t('auth.register.terms_of_service') }}
              </NuxtLink>
              {{ $t('auth.register.and') }}
              <NuxtLink to="/privacy" class="text-emerald-600 hover:text-emerald-700 font-semibold">
                {{ $t('auth.register.privacy_policy') }}
              </NuxtLink>
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="flex items-center justify-center gap-2 w-full py-3 px-6 bg-linear-to-r from-emerald-500 to-sky-500 text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 shadow-[0_10px_30px_-20px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-22px_rgba(16,185,129,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!isFormValid || isLoading"
          >
            <div v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <UserPlus v-else :size="20" />
            <span>{{ isLoading ? $t('auth.register.creating_account') : $t('auth.register.create_account') }}</span>
            <ArrowRight v-if="!isLoading" :size="18" class="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center text-sm animate-[fade-in_0.9s_ease_0.1s_both]">
          <span class="text-slate-600">{{ $t('auth.register.have_account') }}</span>
          <NuxtLink
            to="/auth/login"
            class="ml-1 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            {{ $t('auth.register.login_now') }}
          </NuxtLink>
        </div>
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
import { Music, Mail, Lock, Eye, EyeOff, User, UserPlus, ArrowRight, ArrowLeft, ShieldCheck, Cake } from 'lucide-vue-next'

const router = useRouter()
const { $api } = useNuxtApp()
const { register } = useAuth()
const { t } = useI18n()

const formData = ref({
  nickname: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  birthday: '',
  acceptTerms: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)
const errorMessage = ref('')
const errorDetails = ref<string[]>([])
let countdownTimer: ReturnType<typeof setInterval> | null = null

const getFieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    email: t('auth.register.field_labels.email'),
    password: t('auth.register.field_labels.password'),
    nickname: t('auth.register.field_labels.nickname'),
    verification_code: t('auth.register.field_labels.verification_code'),
    birthday: t('auth.register.field_labels.birthday')
  }

  return labels[field] || field
}

const setError = (message: string, details?: Record<string, string[]>) => {
  if (details && Object.keys(details).length) {
    errorDetails.value = Object.entries(details).flatMap(
      ([field, messages]) => messages.map(msg => `${getFieldLabel(field)}: ${msg}`)
    )
  } else {
    errorDetails.value = []
  }
  errorMessage.value = message
}

const sendVerificationCode = async () => {
  if (!formData.value.email || countdown.value > 0 || isSendingCode.value) return

  isSendingCode.value = true
  errorMessage.value = ''
  errorDetails.value = []

  try {
    await $api('/v1/auth/send-verification-code', {
      method: 'POST',
      body: { email: formData.value.email }
    })
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer!)
        countdownTimer = null
      }
    }, 1000)
  } catch (error: any) {
    const apiError = error.details
    setError(apiError?.message || error.message || t('auth.register.send_code_failed'), apiError?.details)
  } finally {
    isSendingCode.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

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
  if (strength === 0) return t('auth.register.strength_weak')
  if (strength === 1) return t('auth.register.strength_fair')
  if (strength === 2) return t('auth.register.strength_medium')
  if (strength === 3) return t('auth.register.strength_strong')
  return t('auth.register.strength_very_strong')
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'text-red-500'
  if (strength === 2) return 'text-amber-500'
  if (strength === 3) return 'text-emerald-500'
  return 'text-emerald-600 font-semibold'
})

const isFormValid = computed(() => {
  return (
    formData.value.nickname &&
    formData.value.email &&
    formData.value.verificationCode &&
    formData.value.password &&
    formData.value.password === formData.value.confirmPassword &&
    formData.value.birthday &&
    formData.value.acceptTerms &&
    formData.value.password.length >= 8
  )
})

const handleRegister = async () => {
  if (isLoading.value) return

  errorMessage.value = ''
  errorDetails.value = []
  isLoading.value = true

  try {
    const result = await register({
      nickname: formData.value.nickname,
      email: formData.value.email,
      password: formData.value.password,
      verification_code: formData.value.verificationCode,
      birthday: formData.value.birthday
    })

    if (result.success) {
      await router.push('/')
    } else {
      setError(result.error || t('auth.register.register_failed'), result.details)
    }
  } catch (error: any) {
    const apiError = error.details
    setError(apiError?.message || error.message || t('auth.register.register_failed'), apiError?.details)
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: computed(() => `${t('user.register')} - CDCAT`),
  meta: [
    {
      name: 'description',
      content: computed(() => t('auth.register.meta_description'))
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
