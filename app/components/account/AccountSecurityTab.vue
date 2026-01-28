<template>
  <div class="space-y-6">
    <!-- Change Password -->
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">修改密码</h2>
        <p class="text-sm text-gray-500 mt-1">定期更新密码以保护你的账户安全</p>
      </div>

      <!-- Collapsed: trigger button -->
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="!editing" class="p-6">
          <button
            type="button"
            class="group flex items-center gap-3 w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors text-left cursor-pointer"
            @click="editing = true"
          >
            <div class="w-10 h-10 rounded-full bg-white ring-1 ring-black/5 shadow-sm flex items-center justify-center shrink-0 group-hover:shadow transition-shadow">
              <KeyRound :size="18" class="text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">点击修改密码</p>
              <p class="text-xs text-gray-400 mt-0.5">上次修改：从未</p>
            </div>
            <ChevronRight :size="16" class="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
          </button>
        </div>

        <!-- Expanded: password form -->
        <div v-else>
          <div class="p-6">
            <div class="grid gap-5 max-w-sm">
            <div class="grid gap-1.5">
              <label for="current-password" class="text-sm font-medium text-gray-700">当前密码</label>
              <input
                id="current-password"
                v-model="passwordForm.currentPassword"
                type="password"
                class="input input-bordered w-full bg-white"
                placeholder="输入当前密码"
                @keyup.enter="submitPassword"
              />
              <p class="text-xs text-gray-400">为了你的账户安全，请输入当前密码</p>
            </div>

            <div class="grid gap-1.5">
              <label for="new-password" class="text-sm font-medium text-gray-700">新密码</label>
              <input
                id="new-password"
                v-model="passwordForm.newPassword"
                type="password"
                class="input input-bordered w-full bg-white"
                placeholder="至少 8 个字符"
                @keyup.enter="submitPassword"
              />
              <div v-if="passwordForm.newPassword" class="space-y-1.5 mt-0.5">
                <div class="flex gap-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="h-1 flex-1 rounded-full transition-all duration-300"
                    :class="i <= strength.level ? strength.barColor : 'bg-gray-200'"
                  />
                </div>
                <p class="text-xs font-medium" :class="strength.textColor">{{ strength.label }}</p>
              </div>
            </div>

            <div class="grid gap-1.5">
              <label for="confirm-password" class="text-sm font-medium text-gray-700">确认新密码</label>
              <input
                id="confirm-password"
                v-model="passwordForm.confirmPassword"
                type="password"
                class="input input-bordered w-full bg-white"
                placeholder="再次输入新密码"
                @keyup.enter="submitPassword"
              />
              <p
                v-if="passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword"
                class="text-xs text-red-500"
              >
                ✗ 两次输入的密码不一致
              </p>
              <p v-else class="text-xs text-gray-400">
                请再次输入新密码以确认
              </p>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" class="btn btn-ghost btn-sm" @click="cancelEdit">
            取消
          </button>
          <button type="button" class="btn btn-primary btn-sm gap-1.5" @click="submitPassword">
            <Lock :size="14" />
            更新密码
          </button>
        </div>
        </div>
      </Transition>
    </section>

    <!-- Sessions -->
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-black/5 overflow-hidden">
      <div class="p-6 pb-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-gray-900">登录会话</h2>
          <p class="text-sm text-gray-500 mt-1">管理你的活跃登录设备</p>
        </div>
        <span class="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          {{ sessions.length }} 个设备
        </span>
      </div>

      <div class="divide-y divide-gray-100">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="px-6 py-4 flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
              <component :is="session.icon" :size="16" class="text-gray-400" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ session.device }}</p>
              <p class="text-xs text-gray-400 truncate">{{ session.location }} · {{ session.lastActive }}</p>
            </div>
          </div>
          <span v-if="session.current" class="shrink-0 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full">
            当前
          </span>
          <button
            v-else
            type="button"
            class="shrink-0 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
            @click="$emit('revokeSession', session.id)"
          >
            撤销
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Lock, KeyRound, ChevronRight, Monitor, Smartphone } from 'lucide-vue-next'

const emit = defineEmits(['save', 'error', 'revokeSession'])

const editing = ref(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const resetForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

const cancelEdit = () => {
  resetForm()
  editing.value = false
}

const strength = computed(() => {
  const p = passwordForm.newPassword
  if (!p) return { level: 0, label: '', barColor: '', textColor: '' }

  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  const map = {
    0: { label: '非常弱', barColor: 'bg-red-400', textColor: 'text-red-500' },
    1: { label: '弱', barColor: 'bg-orange-400', textColor: 'text-orange-500' },
    2: { label: '一般', barColor: 'bg-yellow-400', textColor: 'text-yellow-600' },
    3: { label: '强', barColor: 'bg-blue-400', textColor: 'text-blue-500' },
    4: { label: '非常强', barColor: 'bg-emerald-400', textColor: 'text-emerald-500' }
  }

  return { level: score, ...map[score] }
})

const submitPassword = () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    emit('error', '请填写完整信息')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    emit('error', '两次输入的密码不一致')
    return
  }
  if (passwordForm.newPassword.length < 8) {
    emit('error', '密码长度至少 8 个字符')
    return
  }
  emit('save', '密码已更新')
  resetForm()
  editing.value = false
}

// Mock sessions
const sessions = ref([
  { id: 1, device: 'Chrome · macOS', location: '上海', lastActive: '当前活跃', icon: Monitor, current: true },
  { id: 2, device: 'Safari · iPhone', location: '上海', lastActive: '2 小时前', icon: Smartphone, current: false }
])
</script>
