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
          <h1 class="text-3xl font-black text-slate-900 mb-2">创建账号</h1>
          <p class="text-slate-600">加入 CDCAT，开启你的音乐探索之旅</p>
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
              <span>昵称</span>
            </label>
            <input
              id="nickname"
              v-model="formData.nickname"
              type="text"
              placeholder="取一个昵称吧"
              maxlength="32"
              class="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] focus:bg-white placeholder:text-slate-400"
              required
            />
          </div>

          <!-- Email Input -->
          <div class="flex flex-col gap-2">
            <label for="email" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Mail :size="16" />
              <span>邮箱地址</span>
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="example@email.com"
              class="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] focus:bg-white placeholder:text-slate-400"
              required
            />
          </div>

          <!-- Verification Code Input -->
          <div class="flex flex-col gap-2">
            <label for="verificationCode" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <ShieldCheck :size="16" />
              <span>邮箱验证码</span>
            </label>
            <div class="flex gap-2">
              <input
                id="verificationCode"
                v-model="formData.verificationCode"
                type="text"
                placeholder="输入验证码"
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
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </button>
            </div>
          </div>

          <!-- Password Input -->
          <div class="flex flex-col gap-2">
            <label for="password" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Lock :size="16" />
              <span>密码</span>
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="至少 8 个字符"
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
              密码强度:
              <span :class="passwordStrengthColor">{{ passwordStrengthText }}</span>
            </p>
          </div>

          <!-- Confirm Password Input -->
          <div class="flex flex-col gap-2">
            <label for="confirmPassword" class="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Lock :size="16" />
              <span>确认密码</span>
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="再次输入密码"
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
              密码不匹配
            </p>
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
              我同意 CDCAT 的
              <NuxtLink to="/terms" class="text-emerald-600 hover:text-emerald-700 font-semibold">
                服务条款
              </NuxtLink>
              和
              <NuxtLink to="/privacy" class="text-emerald-600 hover:text-emerald-700 font-semibold">
                隐私政策
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
            <span>{{ isLoading ? '注册中...' : '创建账号' }}</span>
            <ArrowRight v-if="!isLoading" :size="18" class="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white px-3 text-slate-500 font-semibold tracking-wider">或者使用</span>
          </div>
        </div>

        <!-- Social Register -->
        <div class="space-y-3 animate-[fade-in_0.8s_ease_0.05s_both]">
          <button type="button" class="flex items-center justify-center gap-3 w-full py-3 px-6 bg-white/90 text-slate-700 font-semibold border border-slate-200 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-20px_rgba(15,23,42,0.3)]">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span>使用 GitHub 注册</span>
          </button>
        </div>

        <!-- Login Link -->
        <div class="mt-6 text-center text-sm animate-[fade-in_0.9s_ease_0.1s_both]">
          <span class="text-slate-600">已经有账号了？</span>
          <NuxtLink
            to="/auth/login"
            class="ml-1 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            立即登录
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
          <span>返回首页</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Music, Mail, Lock, Eye, EyeOff, User, UserPlus, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-vue-next'

const router = useRouter()
const { $api } = useNuxtApp()
const { register } = useAuth()

const formData = ref({
  nickname: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
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

const fieldLabels: Record<string, string> = {
  email: '邮箱',
  password: '密码',
  nickname: '昵称',
  verification_code: '验证码'
}

const setError = (message: string, details?: Record<string, string[]>) => {
  if (details && Object.keys(details).length) {
    errorDetails.value = Object.entries(details).flatMap(
      ([field, messages]) => messages.map(msg => `${fieldLabels[field] || field}: ${msg}`)
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
    setError(apiError?.message || error.message || '发送验证码失败，请重试', apiError?.details)
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
  if (strength === 0) return '弱'
  if (strength === 1) return '较弱'
  if (strength === 2) return '中等'
  if (strength === 3) return '强'
  return '很强'
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
      verification_code: formData.value.verificationCode
    })

    if (result.success) {
      await router.push('/')
    } else {
      setError(result.error || '注册失败，请重试', result.details)
    }
  } catch (error: any) {
    const apiError = error.details
    setError(apiError?.message || error.message || '注册失败，请重试', apiError?.details)
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: '注册 - CDCAT',
  meta: [
    {
      name: 'description',
      content: '注册 CDCAT 账号，开启你的日系音乐探索之旅'
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
