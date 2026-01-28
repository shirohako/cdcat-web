<template>
  <div class="min-h-screen bg-gray-50/80">
    <div class="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{{ $t('user.account') }}</h1>
        <p class="mt-1.5 text-sm text-gray-500">管理你的账户信息和安全设置</p>
      </div>

      <!-- Tabs navigation -->
      <nav class="flex gap-1 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-none" aria-label="Settings tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 -mb-px"
          :class="activeTab === tab.key
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" :size="15" />
          {{ tab.label }}
        </button>
      </nav>

      <!-- Tab panels -->
      <KeepAlive>
        <AccountProfileTab
          v-if="activeTab === 'profile'"
          :user="user"
          @save="showToast('个人资料已保存')"
        />
      </KeepAlive>

      <AccountEmailTab
        v-if="activeTab === 'email'"
        :user="user"
        @save="(msg) => showToast(msg)"
        @error="(msg) => showToast(msg, 'error')"
      />

      <AccountPreferencesTab
        v-if="activeTab === 'preferences'"
        :user="user"
        @save="showToast('偏好设置已保存')"
      />

      <AccountAddressTab
        v-if="activeTab === 'address'"
        :user="user"
        @save="(msg) => typeof msg === 'object' ? showToast(msg.message, msg.type) : showToast(msg)"
      />

      <AccountSecurityTab
        v-if="activeTab === 'security'"
        @save="(msg) => showToast(msg)"
        @error="(msg) => showToast(msg, 'error')"
        @revoke-session="showToast('会话已撤销')"
      />

      <AccountNotificationsTab
        v-if="activeTab === 'notifications'"
        @save="(msg) => showToast(msg)"
      />

      <AccountDangerTab
        v-if="activeTab === 'danger'"
        :username="user?.username || ''"
        @info="(msg) => showToast(msg, 'info')"
      />

      <!-- Toast -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div v-if="toast.show" class="fixed bottom-6 right-6 z-50">
          <div
            class="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium"
            :class="{
              'bg-emerald-50 border-emerald-200 text-emerald-700': toast.type === 'success',
              'bg-red-50 border-red-200 text-red-700': toast.type === 'error',
              'bg-blue-50 border-blue-200 text-blue-700': toast.type === 'info'
            }"
          >
            <Check v-if="toast.type === 'success'" :size="16" />
            <AlertTriangle v-else-if="toast.type === 'error'" :size="16" />
            <InfoIcon v-else :size="16" />
            {{ toast.message }}
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import {
  User as UserIcon, Mail, Lock, Bell, AlertTriangle, Settings, MapPin,
  Check, Info as InfoIcon
} from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const { toast, showToast } = useToast()

const tabs = [
  { key: 'profile', label: '个人资料', icon: UserIcon },
  { key: 'email', label: '邮箱', icon: Mail },
  { key: 'preferences', label: '偏好设置', icon: Settings },
  { key: 'address', label: '收货地址', icon: MapPin },
  { key: 'security', label: '安全设置', icon: Lock },
  { key: 'notifications', label: '通知偏好', icon: Bell },
  { key: 'danger', label: '危险区域', icon: AlertTriangle }
]

const activeTab = ref('profile')

useHead({
  title: 'Account Settings | CDCAT'
})
</script>
