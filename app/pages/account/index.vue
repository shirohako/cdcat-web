<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <!-- Decorative background -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-linear-to-br from-indigo-200/45 to-sky-200/20 blur-3xl" />
      <div class="absolute -top-24 -right-28 h-80 w-80 rounded-full bg-linear-to-br from-amber-200/45 to-rose-200/15 blur-3xl" />
      <div class="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-linear-to-br from-emerald-200/35 to-cyan-200/15 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
    </div>

    <div class="relative container mx-auto px-4 md:px-6 py-10 max-w-6xl">
      <!-- Header -->
      <div class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm flex items-center justify-center">
            <div class="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
              {{ userInitial }}
            </div>
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              {{ $t('user.account') }}
            </h1>
            <p class="mt-1.5 text-sm text-gray-500">
              管理你的账户信息和安全设置
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur ring-1 ring-black/5">
            <UserIcon :size="14" class="text-gray-400" />
            <span class="font-medium text-gray-700">
              {{ userDisplayName }}
            </span>
          </span>
          <span v-if="user?.email" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur ring-1 ring-black/5">
            <Mail :size="14" class="text-gray-400" />
            <span class="truncate max-w-56">{{ user.email }}</span>
          </span>
        </div>
      </div>

      <div class="grid lg:grid-cols-[260px,1fr] gap-6">
        <!-- Desktop sidebar -->
        <aside class="hidden lg:block">
          <div class="sticky top-20 rounded-2xl ring-1 ring-black/5 overflow-hidden">
            <div class="bg-white/70 backdrop-blur-xl p-2">
              <nav class="space-y-1" aria-label="Account settings">
                <button
                  v-for="tab in tabs"
                  :key="tab.key"
                  type="button"
                  class="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  :class="activeTab === tab.key
                    ? 'bg-white shadow-sm ring-1 ring-black/5 text-gray-900'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'"
                  @click="activeTab = tab.key"
                >
                  <component :is="tab.icon" :size="16" class="text-gray-400 group-hover:text-gray-500 transition-colors" />
                  <span class="truncate">{{ tab.label }}</span>
                  <Icon name="lucide:chevron-right" class="ml-auto w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
                </button>
              </nav>
            </div>
          </div>
        </aside>

        <!-- Main -->
        <section>
          <!-- Mobile tabs -->
          <nav class="lg:hidden mb-5" aria-label="Settings tabs">
            <div class="flex items-center gap-2 overflow-x-auto rounded-2xl bg-white/70 backdrop-blur ring-1 ring-black/5 p-1">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                class="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                :class="activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'"
                @click="activeTab = tab.key"
              >
                <component :is="tab.icon" :size="15" />
                {{ tab.label }}
              </button>
            </div>
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
        </section>
      </div>

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
            class="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur text-sm font-medium"
            :class="{
              'bg-emerald-50/90 border-emerald-200 text-emerald-700': toast.type === 'success',
              'bg-red-50/90 border-red-200 text-red-700': toast.type === 'error',
              'bg-blue-50/90 border-blue-200 text-blue-700': toast.type === 'info'
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

const userDisplayName = computed(() => {
  return user?.value?.nickname || user?.value?.username || ''
})

const userInitial = computed(() => {
  const name = userDisplayName.value || user?.value?.email || 'U'
  return String(name).trim().slice(0, 1).toUpperCase()
})

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
