<template>
  <div class="min-h-screen relative overflow-hidden bg-linear-to-br from-emerald-50 via-slate-50 to-sky-50 flex items-center justify-center p-4">
    <!-- Decorative Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="decorative-grid"></div>
      <div class="decorative-circle decorative-circle-1"></div>
      <div class="decorative-circle decorative-circle-2"></div>
      <div class="decorative-circle decorative-circle-3"></div>
    </div>

    <!-- Register Card -->
    <div class="relative z-10 w-full max-w-md">
      <div class="register-card">
        <!-- Header -->
        <div class="text-center mb-8 animate-fade-in">
          <div class="inline-flex items-center gap-2 mb-4">
            <div class="h-12 w-12 rounded-xl bg-linear-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white shadow-lg">
              <Music :size="24" />
            </div>
          </div>
          <h1 class="text-3xl font-black text-slate-900 mb-2">创建账号</h1>
          <p class="text-slate-600">加入 CDCAT，开启你的音乐探索之旅</p>
        </div>

        <!-- Register Form -->
        <form @submit.prevent="handleRegister" class="space-y-4 animate-rise">
          <!-- Username Input -->
          <div class="form-group">
            <label for="username" class="form-label">
              <User :size="16" />
              <span>用户名</span>
            </label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              placeholder="选择一个独特的用户名"
              class="form-input"
              required
            />
          </div>

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
                placeholder="至少 8 个字符"
                class="form-input pr-12"
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
          <div class="form-group">
            <label for="confirmPassword" class="form-label">
              <Lock :size="16" />
              <span>确认密码</span>
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="formData.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="再次输入密码"
                class="form-input pr-12"
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
            class="w-full btn-primary"
            :disabled="!isFormValid"
          >
            <UserPlus :size="20" />
            <span>创建账号</span>
            <ArrowRight :size="18" class="transition-transform duration-300 group-hover:translate-x-1" />
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
        <div class="space-y-3 animate-rise-delayed">
          <button type="button" class="w-full btn-social">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            <span>使用 Google 注册</span>
          </button>

          <button type="button" class="w-full btn-social">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span>使用 GitHub 注册</span>
          </button>
        </div>

        <!-- Login Link -->
        <div class="mt-6 text-center text-sm animate-rise-slower">
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
import { Music, Mail, Lock, Eye, EyeOff, User, UserPlus, ArrowRight, ArrowLeft } from 'lucide-vue-next'

const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

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
    formData.value.username &&
    formData.value.email &&
    formData.value.password &&
    formData.value.password === formData.value.confirmPassword &&
    formData.value.acceptTerms &&
    formData.value.password.length >= 8
  )
})

const handleRegister = () => {
  // TODO: Implement register logic
  console.log('Register form submitted:', formData.value)
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
.register-card {
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
  background: radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 70%);
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
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15), transparent 70%);
  animation-delay: 2s;
}

.decorative-circle-3 {
  width: 200px;
  height: 200px;
  bottom: -60px;
  right: -30px;
  background: radial-gradient(circle, rgba(244, 165, 96, 0.15), transparent 70%);
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
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
  background: linear-gradient(to right, #10b981, #0ea5e9);
  color: white;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px -20px rgba(16, 185, 129, 0.5);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px -22px rgba(16, 185, 129, 0.6);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
