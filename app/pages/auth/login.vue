<template>
  <div class="min-h-screen relative overflow-hidden bg-linear-to-br from-amber-50 via-slate-50 to-sky-50 flex items-center justify-center p-4">
    <!-- Decorative Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="decorative-grid"></div>
      <div class="decorative-circle decorative-circle-1"></div>
      <div class="decorative-circle decorative-circle-2"></div>
      <div class="decorative-circle decorative-circle-3"></div>
    </div>

    <!-- Login Card -->
    <div class="relative z-10 w-full max-w-md">
      <div class="login-card">
        <!-- Header -->
        <div class="text-center mb-8 animate-fade-in">
          <div class="inline-flex items-center gap-2 mb-4">
            <div class="h-12 w-12 rounded-xl bg-linear-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
              <Music :size="24" />
            </div>
          </div>
          <h1 class="text-3xl font-black text-slate-900 mb-2">欢迎回来</h1>
          <p class="text-slate-600">登录到 CDCAT 继续探索音乐世界</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="animate-fade-in bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4 animate-rise">
          <!-- Email Input -->
          <div class="form-group">
            <label for="email" class="form-label">
              <Mail :size="16" />
              <span>邮箱地址</span>
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="example@email.com"
              class="form-input"
              required
            />
          </div>

          <!-- Password Input -->
          <div class="form-group">
            <label for="password" class="form-label">
              <Lock :size="16" />
              <span>密码</span>
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="输入你的密码"
                class="form-input pr-12"
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
            class="w-full btn-primary"
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
        <div class="space-y-3 animate-rise-delayed">
          <button type="button" class="w-full btn-social">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            <span>使用 Google 登录</span>
          </button>

          <button type="button" class="w-full btn-social">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span>使用 GitHub 登录</span>
          </button>
        </div>

        <!-- Sign Up Link -->
        <div class="mt-6 text-center text-sm animate-rise-slower">
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
.login-card {
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 30px 60px -40px rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(12px);
}

.decorative-grid {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: linear-gradient(to top, black 0%, transparent 100%);
  animation: grid-flow 20s linear infinite;
}

.decorative-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 70%);
  filter: blur(40px);
  animation: float-circle 15s ease-in-out infinite;
}

.decorative-circle-1 {
  width: 300px;
  height: 300px;
  bottom: -100px;
  left: -50px;
  animation-delay: 0s;
}

.decorative-circle-2 {
  width: 250px;
  height: 250px;
  bottom: -80px;
  right: 20%;
  background: radial-gradient(circle, rgba(244, 165, 96, 0.15), transparent 70%);
  animation-delay: 2s;
}

.decorative-circle-3 {
  width: 200px;
  height: 200px;
  bottom: -60px;
  right: -30px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 70%);
  animation-delay: 4s;
}

@keyframes grid-flow {
  0% {
    background-position: 0 0, 0 0;
  }
  100% {
    background-position: 50px 50px, 50px 50px;
  }
}

@keyframes float-circle {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  transition: all 0.3s ease;
  outline: none;
}

.form-input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  background: #ffffff;
}

.form-input::placeholder {
  color: #94a3b8;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(to right, #0ea5e9, #10b981);
  color: white;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px -20px rgba(14, 165, 233, 0.5);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px -22px rgba(14, 165, 233, 0.6);
}

.btn-social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-social:hover {
  background: white;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -20px rgba(15, 23, 42, 0.3);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease both;
}

.animate-rise {
  animation: fade-in 0.7s ease both;
}

.animate-rise-delayed {
  animation: fade-in 0.8s ease both;
  animation-delay: 0.05s;
}

.animate-rise-slower {
  animation: fade-in 0.9s ease both;
  animation-delay: 0.1s;
}
</style>
