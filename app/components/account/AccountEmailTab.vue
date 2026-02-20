<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">邮箱</h2>
        <p class="text-sm text-gray-500 mt-1">用于登录和接收通知的邮箱</p>
      </div>

      <div class="p-6 space-y-6">
        <!-- Current email with action button -->
        <div
          class="flex items-center justify-between gap-4 p-4 rounded-xl border"
          :class="user?.email ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'"
        >
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="user?.email ? 'bg-emerald-100' : 'bg-white ring-1 ring-black/5'"
            >
              <Mail :size="18" :class="user?.email ? 'text-emerald-600' : 'text-gray-400'" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ user?.email || '尚未绑定邮箱' }}
              </p>
              <p
                v-if="user?.email"
                class="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5"
              >
                <ShieldCheck :size="12" />
                已验证
              </p>
              <p v-else class="text-xs text-gray-400 mt-0.5">
                绑定邮箱后可用于登录与接收通知
              </p>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium whitespace-nowrap"
            @click="editing = true"
          >
            {{ user?.email ? '更换' : '绑定' }}
          </button>
        </div>

        <!-- Edit form -->
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="editing" class="grid gap-5 max-w-sm">
            <!-- Error message -->
            <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>

            <!-- New email -->
            <div class="grid gap-1.5">
              <label for="new-email" class="text-sm font-medium text-gray-700">
                {{ user?.email ? '新邮箱地址' : '邮箱地址' }}
              </label>
              <input
                id="new-email"
                v-model="form.newEmail"
                type="email"
                class="input input-bordered w-full bg-white"
                placeholder="your@email.com"
              />
              <p class="text-xs text-gray-400">请输入有效的邮箱地址</p>
            </div>

            <!-- Verification code -->
            <div class="grid gap-1.5">
              <label for="email-code" class="text-sm font-medium text-gray-700">邮箱验证码</label>
              <div class="flex gap-2">
                <input
                  id="email-code"
                  v-model="form.verificationCode"
                  type="text"
                  maxlength="6"
                  class="input input-bordered flex-1 bg-white"
                  placeholder="输入验证码"
                  @keyup.enter="submit"
                />
                <button
                  type="button"
                  :disabled="!form.newEmail || countdown > 0 || isSendingCode"
                  class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="countdown > 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'"
                  @click="sendCode"
                >
                  <span v-if="isSendingCode" class="loading loading-spinner loading-xs"></span>
                  <span v-else>{{ countdown > 0 ? `${countdown}s` : '发送验证码' }}</span>
                </button>
              </div>
              <p class="text-xs text-gray-400">验证码将发送至新邮箱</p>
            </div>
          </div>
        </Transition>
      </div>

      <div
        v-if="editing"
        class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex justify-end gap-2"
      >
        <button type="button" class="btn btn-ghost btn-sm" @click="cancelEdit">
          取消
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm gap-1.5"
          :disabled="!canSubmit || isSubmitting"
          @click="submit"
        >
          <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
          <template v-else>
            <Mail :size="14" />
            确认更换
          </template>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Mail, ShieldCheck } from 'lucide-vue-next'

defineProps({
  user: { type: Object, default: null }
})

const emit = defineEmits(['save', 'error'])

const { $api } = useNuxtApp()
const { fetchUser } = useAuth()

const editing = ref(false)
const errorMessage = ref('')
const isSendingCode = ref(false)
const isSubmitting = ref(false)
const countdown = ref(0)
let countdownTimer = null

const form = reactive({
  newEmail: '',
  verificationCode: ''
})

const canSubmit = computed(() => {
  return form.newEmail && form.verificationCode
})

const resetForm = () => {
  form.newEmail = ''
  form.verificationCode = ''
  errorMessage.value = ''
  countdown.value = 0
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const cancelEdit = () => {
  resetForm()
  editing.value = false
}

const sendCode = async () => {
  if (!form.newEmail || countdown.value > 0 || isSendingCode.value) return

  isSendingCode.value = true
  errorMessage.value = ''

  try {
    await $api('/v1/me/email/send-code', {
      method: 'POST',
      body: { email: form.newEmail }
    })

    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    errorMessage.value = error?.message || '发送验证码失败，请稍后重试'
  } finally {
    isSendingCode.value = false
  }
}

const submit = async () => {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $api('/v1/me/email', {
      method: 'PUT',
      body: {
        email: form.newEmail,
        verification_code: form.verificationCode
      }
    })

    await fetchUser()
    emit('save', '邮箱更换成功')
    resetForm()
    editing.value = false
  } catch (error) {
    errorMessage.value = error?.message || '更换邮箱失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>
