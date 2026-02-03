<template>
  <div class="min-h-screen relative overflow-hidden bg-linear-to-br from-amber-50 via-slate-50 to-sky-50 flex items-center justify-center p-4">
    <!-- Decorative Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute bottom-0 inset-x-0 h-[40%] bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[50px_50px] mask-[linear-gradient(to_top,black_0%,transparent_100%)] animate-[grid-flow_20s_linear_infinite]"></div>
      <div class="absolute rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.15),transparent_70%)] blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-75 h-75 -bottom-25 -left-12.5"></div>
      <div class="absolute rounded-full blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-62.5 h-62.5 -bottom-20 right-[20%] bg-[radial-gradient(circle,rgba(244,165,96,0.15),transparent_70%)] [animation-delay:2s]"></div>
      <div class="absolute rounded-full blur-2xl animate-[float-circle_15s_ease-in-out_infinite] w-50 h-50 -bottom-15 -right-7.5 bg-[radial-gradient(circle,rgba(16,185,129,0.15),transparent_70%)] [animation-delay:4s]"></div>
    </div>

    <!-- Login Card -->
    <div class="relative z-10 w-full max-w-md">
      <div class="bg-[linear-gradient(140deg,rgba(255,255,255,0.95),rgba(248,250,252,0.95))] border border-white/80 rounded-4xl p-10 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-md">
        <!-- Header -->
        <div class="text-center mb-8 animate-[fade-in_0.6s_ease_both]">
          <div class="inline-flex items-center gap-2 mb-4">
            <div class="h-12 w-12 rounded-xl bg-linear-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
              <Music :size="24" />
            </div>
          </div>
          <h1 class="text-3xl font-black text-slate-900 mb-2">欢迎回来</h1>
          <p class="text-slate-600">登录到 CDCAT 继续探索音乐世界</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="animate-[fade-in_0.6s_ease_both] bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4 animate-[fade-in_0.7s_ease_both]">
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
              class="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-sky-500 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)] focus:bg-white placeholder:text-slate-400"
              required
            />
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
                placeholder="输入你的密码"
                class="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white/90 text-slate-900 transition-all duration-300 outline-none focus:border-sky-500 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)] focus:bg-white placeholder:text-slate-400 pr-12"
                required
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
          </div>

          <!-- Remember & Forgot -->
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                v-model="formData.remember"
                type="checkbox"
                class="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 transition-all cursor-pointer"
              />
              <span class="text-slate-600 group-hover:text-slate-900 transition-colors">记住我</span>
            </label>
            <NuxtLink
              to="/forgot-password"
              class="text-sky-600 hover:text-sky-700 font-semibold transition-colors"
            >
              忘记密码？
            </NuxtLink>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="group flex items-center justify-center gap-2 w-full py-3 px-6 bg-linear-to-r from-sky-500 to-emerald-500 text-white font-semibold rounded-xl cursor-pointer transition-all duration-300 shadow-[0_10px_30px_-20px_rgba(14,165,233,0.5)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-22px_rgba(14,165,233,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading"
          >
            <div v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <LogIn v-else :size="20" />
            <span>{{ isLoading ? '登录中...' : '登录' }}</span>
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

        <!-- Social Login -->
        <div class="space-y-3 animate-[fade-in_0.8s_ease_0.05s_both]">
          <button type="button" class="flex items-center justify-center gap-3 w-full py-3 px-6 bg-white/90 text-slate-700 font-semibold border border-slate-200 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-20px_rgba(15,23,42,0.3)]">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span>使用 GitHub 登录</span>
          </button>
        </div>

        <!-- Sign Up Link -->
        <div class="mt-6 text-center text-sm animate-[fade-in_0.9s_ease_0.1s_both]">
          <span class="text-slate-600">还没有账号？</span>
          <NuxtLink
            to="/auth/register"
            class="ml-1 text-sky-600 hover:text-sky-700 font-semibold transition-colors"
          >
            立即注册
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
import { Music, Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const formData = ref({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

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
      const redirectTo = route.query.redirect as string || '/'
      await router.push(redirectTo)
    } else {
      // 登录失败，显示错误信息
      errorMessage.value = result.error || '登录失败，请重试'
    }
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败，请重试'
  } finally {
    isLoading.value = false
  }
}

useHead({
  title: '登录 - CDCAT',
  meta: [
    {
      name: 'description',
      content: '登录到 CDCAT 继续探索日系音乐世界'
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
