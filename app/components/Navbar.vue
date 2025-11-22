<template>
  <header
    :class="[
      'fixed top-0 h-16 bg-white border-b border-gray-200 z-30',
      'transition-all duration-300 ease-in-out',
      'left-0 right-0',
      isCollapsed ? 'lg:left-16' : 'lg:left-64'
    ]"
  >
    <div class="h-full px-4 flex items-center justify-between">
      <!-- Left Section: Menu Toggle & Search -->
      <div class="flex items-center gap-4">
        <!-- Mobile Menu Toggle -->
        <button
          class="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          @click="toggleMobileMenu"
          aria-label="Toggle mobile menu"
        >
          <Icon name="lucide:menu" class="w-5 h-5 text-gray-700" />
        </button>

        <!-- Desktop Sidebar Toggle -->
        <button
          class="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
          @click="toggleSidebar"
          aria-label="Toggle sidebar"
        >
          <Icon
            :name="isCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'"
            class="w-5 h-5 text-gray-700 transition-transform duration-200 group-hover:scale-110"
          />
        </button>

        <!-- Search Bar -->
        <div class="hidden md:block relative">
          <input
            type="text"
            placeholder="搜索..."
            class="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                   transition-all duration-200"
          >
          <Icon
            name="lucide:search"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
        </div>
      </div>

      <!-- Right Section: Notifications & User -->
      <div class="flex items-center gap-2">
        <!-- Search Icon (Mobile) -->
        <button
          class="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          aria-label="Search"
        >
          <Icon name="lucide:search" class="w-5 h-5 text-gray-700" />
        </button>

        <!-- Notifications -->
        <div class="relative">
          <button
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group relative"
            @click="toggleNotifications"
            aria-label="Notifications"
          >
            <Icon
              name="lucide:bell"
              class="w-5 h-5 text-gray-700 transition-transform duration-200 group-hover:scale-110"
            />
            <span
              class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full
                     animate-pulse"
            ></span>
          </button>

          <!-- Notifications Dropdown -->
          <transition name="dropdown">
            <div
              v-if="showNotifications"
              class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200
                     overflow-hidden"
            >
              <div class="p-4 border-b border-gray-200">
                <h3 class="font-semibold text-gray-900">通知</h3>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <div
                  v-for="notification in notifications"
                  :key="notification.id"
                  class="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                >
                  <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ notification.time }}</p>
                </div>
              </div>
              <div class="p-3 text-center border-t border-gray-200">
                <button class="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150">
                  查看全部
                </button>
              </div>
            </div>
          </transition>
        </div>

        <!-- User Menu -->
        <div class="relative">
          <button
            class="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg
                   transition-colors duration-200 group"
            @click="toggleUserMenu"
            aria-label="User menu"
          >
            <div
              class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center
                     ring-2 ring-transparent group-hover:ring-gray-300 transition-all duration-200"
            >
              <span class="text-white text-sm font-semibold">A</span>
            </div>
            <Icon
              name="lucide:chevron-down"
              class="w-4 h-4 text-gray-600 transition-transform duration-200"
              :class="{ 'rotate-180': showUserMenu }"
            />
          </button>

          <!-- User Dropdown -->
          <transition name="dropdown">
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200
                     overflow-hidden"
            >
              <div class="p-4 border-b border-gray-200">
                <p class="font-semibold text-gray-900">用户名</p>
                <p class="text-sm text-gray-500">user@example.com</p>
              </div>
              <div class="py-2">
                <NuxtLink
                  v-for="item in userMenuItems"
                  :key="item.name"
                  :to="item.path"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700
                         hover:bg-gray-50 transition-colors duration-150"
                >
                  <Icon :name="item.icon" class="w-4 h-4" />
                  <span>{{ item.name }}</span>
                </NuxtLink>
              </div>
              <div class="border-t border-gray-200">
                <button
                  class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600
                         hover:bg-red-50 transition-colors duration-150"
                >
                  <Icon name="lucide:log-out" class="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Click outside to close dropdowns -->
    <div
      v-if="showNotifications || showUserMenu"
      class="fixed inset-0 -z-10"
      @click="closeAllDropdowns"
    ></div>
  </header>
</template>

<script setup lang="ts">
import { userMenuItems } from '~/config/menu'

defineProps<{
  isCollapsed: boolean
  isMobileMenuOpen: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
  toggleMobileMenu: []
}>()

const showNotifications = ref(false)
const showUserMenu = ref(false)

const notifications = [
  { id: 1, title: '新任务已分配给你', time: '5分钟前' },
  { id: 2, title: '项目更新提醒', time: '1小时前' },
  { id: 3, title: '团队成员加入', time: '2小时前' }
]

const toggleSidebar = () => {
  emit('toggleSidebar')
}

const toggleMobileMenu = () => {
  emit('toggleMobileMenu')
}

const toggleNotifications = () => {
  showUserMenu.value = false
  showNotifications.value = !showNotifications.value
}

const toggleUserMenu = () => {
  showNotifications.value = false
  showUserMenu.value = !showUserMenu.value
}

const closeAllDropdowns = () => {
  showNotifications.value = false
  showUserMenu.value = false
}
</script>

<style scoped>
.dropdown-enter-active {
  animation: dropdown-in 0.2s ease-out;
}

.dropdown-leave-active {
  animation: dropdown-out 0.15s ease-in;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdown-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
</style>
