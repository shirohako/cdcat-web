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

      <!-- Right Section: Language Switcher & User -->
      <div class="flex items-center gap-2">
        <!-- Search Icon (Mobile) -->
        <button
          class="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          aria-label="Search"
        >
          <Icon name="lucide:search" class="w-5 h-5 text-gray-700" />
        </button>

        <!-- Language Switcher -->
        <div class="relative">
          <button
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            @click="toggleLanguageMenu"
            aria-label="Switch language"
          >
            <Icon
              name="lucide:languages"
              class="w-5 h-5 text-gray-700 transition-transform duration-200 group-hover:scale-110"
            />
          </button>

          <!-- Language Dropdown -->
          <transition name="dropdown">
            <div
              v-if="showLanguageMenu"
              class="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200
                     overflow-hidden"
            >
              <button
                v-for="locale in availableLocales"
                :key="locale.code"
                @click="switchLanguage(locale.code)"
                :class="[
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150',
                  currentLocale === locale.code
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                ]"
              >
                <span>{{ locale.name }}</span>
                <Icon
                  v-if="currentLocale === locale.code"
                  name="lucide:check"
                  class="w-4 h-4"
                />
              </button>
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
      v-if="showLanguageMenu || showUserMenu"
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

const { locale, locales, setLocale } = useI18n()

const showUserMenu = ref(false)
const showLanguageMenu = ref(false)

const currentLocale = computed(() => locale.value)
const availableLocales = computed(() => locales.value)

const switchLanguage = async (localeCode: string) => {
  await setLocale(localeCode as 'zh-Hans' | 'zh-Hant' | 'en' | 'ja')
  showLanguageMenu.value = false
}

const toggleSidebar = () => {
  emit('toggleSidebar')
}

const toggleMobileMenu = () => {
  emit('toggleMobileMenu')
}

const toggleLanguageMenu = () => {
  showUserMenu.value = false
  showLanguageMenu.value = !showLanguageMenu.value
}

const toggleUserMenu = () => {
  showLanguageMenu.value = false
  showUserMenu.value = !showUserMenu.value
}

const closeAllDropdowns = () => {
  showUserMenu.value = false
  showLanguageMenu.value = false
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
