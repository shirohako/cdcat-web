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
                @keyup.enter="submit"
              />
              <p class="text-xs text-gray-400">请输入有效的邮箱地址</p>
            </div>
            <div class="grid gap-1.5">
              <label for="email-password" class="text-sm font-medium text-gray-700">当前密码确认</label>
              <input
                id="email-password"
                v-model="form.password"
                type="password"
                class="input input-bordered w-full bg-white"
                placeholder="输入当前密码以确认操作"
                @keyup.enter="submit"
              />
              <p class="text-xs text-gray-400">出于安全考虑，请输入当前密码</p>
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
        <button type="button" class="btn btn-primary btn-sm gap-1.5" @click="submit">
          <Mail :size="14" />
          发送验证邮件
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

const editing = ref(false)

const form = reactive({
  newEmail: '',
  password: ''
})

const resetForm = () => {
  form.newEmail = ''
  form.password = ''
}

const cancelEdit = () => {
  resetForm()
  editing.value = false
}

const submit = () => {
  if (!form.newEmail || !form.password) {
    emit('error', '请填写完整信息')
    return
  }
  emit('save', '验证邮件已发送，请查收')
  resetForm()
  editing.value = false
}
</script>
