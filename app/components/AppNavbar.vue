<template>
  <header
    :class="[
      'fixed top-0 h-16 bg-white border-b border-gray-200 z-30',
      'transition-all duration-300 ease-in-out',
      'left-0 right-0',
      isCollapsed ? 'lg:left-16' : 'lg:left-52'
    ]"
  >
    <div class="h-full px-4 flex items-center justify-between">
      <!-- Left Section: Menu Toggle & Search -->
      <div class="flex items-center gap-4">
        <!-- Mobile Menu Toggle -->
        <button
          class="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          aria-label="Toggle mobile menu"
          @click="toggleMobileMenu"
        >
          <Icon name="lucide:menu" class="w-5 h-5 text-gray-700" />
        </button>

        <!-- Desktop Sidebar Toggle -->
        <button
          class="hidden lg:block p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
          aria-label="Toggle sidebar"
          @click="toggleSidebar"
        >
          <Icon
            :name="isCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'"
            class="w-5 h-5 text-gray-700 transition-transform duration-200 group-hover:scale-110"
          />
        </button>

        <!-- Search Bar -->
        <SearchQuickResults class="hidden md:block" />
        <NuxtLink to="/search" class="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100 md:hidden" :aria-label="$t('search.title')">
          <Icon name="lucide:search" class="h-5 w-5 text-gray-700" />
        </NuxtLink>
      </div>

      <!-- Right Section: Language Switcher & User -->
      <div class="flex items-center gap-2">
        <!-- Language Switcher -->
        <div class="relative">
          <button
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
            aria-label="Switch language"
            @click="toggleLanguageMenu"
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
                v-for="option in availableLocales"
                :key="option.code"
                :class="[
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150',
                  currentLocale === option.code
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                ]"
                @click="switchLanguage(option.code)"
              >
                <span>{{ option.name }}</span>
                <Icon
                  v-if="currentLocale === option.code"
                  name="lucide:check"
                  class="w-4 h-4"
                />
              </button>
            </div>
          </transition>
        </div>

        <NotificationBell v-if="isAuthenticated" />

        <!-- User Menu or Login/Register Buttons -->
        <div v-if="isAuthenticated" class="relative">
          <button
            class="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg
                   transition-colors duration-200 group"
            aria-label="User menu"
            @click="toggleUserMenu"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden
                     ring-2 ring-transparent group-hover:ring-gray-300 transition-all duration-200"
              :class="user?.avatar_url ? '' : 'bg-gray-900'"
            >
              <NuxtImg
                v-if="user?.avatar_url"
                :src="user.avatar_url"
                alt="avatar"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-white text-sm font-semibold">{{ userInitial }}</span>
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
                <p class="font-semibold text-gray-900">{{ user?.nickname }}</p>
                <p class="text-sm text-gray-500">@{{ user?.username }}</p>
              </div>
              <div class="py-2">
                <NuxtLink
                  v-for="item in userMenuItems"
                  :key="item.name"
                  :to="item.name === 'profile' ? `/profile/${user?.username}` : item.path"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700
                         hover:bg-gray-50 transition-colors duration-150"
                >
                  <Icon :name="item.icon" class="w-4 h-4" />
                  <span>{{ $t(item.i18nKey) }}</span>
                </NuxtLink>
              </div>
              <div v-if="hasPermission('admin.access')" class="border-t border-gray-200 py-2">
                <NuxtLink
                  to="/admin"
                  class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  @click="showUserMenu = false"
                >
                  <Icon name="lucide:layout-dashboard" class="w-4 h-4" />
                  <span>{{ $t('admin.console') }}</span>
                </NuxtLink>
              </div>
              <div class="border-t border-gray-200">
                <button
                  class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600
                         hover:bg-red-50 transition-colors duration-150"
                  @click="handleLogout"
                >
                  <Icon name="lucide:log-out" class="w-4 h-4" />
                  <span>{{ $t('user.logout') }}</span>
                </button>
              </div>
            </div>
          </transition>
        </div>

        <!-- Login/Register Buttons (Not Authenticated) -->
        <div v-else class="flex items-center gap-2">
          <NuxtLink
            to="/auth/login"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {{ $t('user.login') }}
          </NuxtLink>
          <NuxtLink
            to="/auth/register"
            class="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            {{ $t('user.register') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Click outside to close dropdowns -->
    <div
      v-if="showLanguageMenu || showUserMenu"
      class="fixed inset-0 -z-10"
      @click="closeAllDropdowns"
    />
  </header>
</template>

<script setup lang="ts">
import { userMenuItems } from '~/config/menu'
import { localDrafts } from '~/utils/localDrafts'

defineProps<{
  isCollapsed: boolean
  isMobileMenuOpen: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
  toggleMobileMenu: []
}>()

const { t, locale, locales, setLocale } = useI18n()
const { user, isAuthenticated, logout, hasPermission } = useAuth()

const showUserMenu = ref(false)
const showLanguageMenu = ref(false)

const currentLocale = computed(() => locale.value)
const availableLocales = computed(() => locales.value)

// 获取用户名首字母
const userInitial = computed(() => {
  if (!user.value?.username) return 'U'
  return user.value.username.charAt(0).toUpperCase()
})

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

const handleLogout = async () => {
  // Logging out deletes the revision drafts kept in this browser.
  const drafts = user.value ? (await localDrafts.list(user.value.id).catch(() => [])).length : 0
  if (drafts && !confirm(t('user.logout_drafts_confirm', { count: drafts }))) return
  await logout()
  showUserMenu.value = false
}
</script>

<style scoped>
button {
  cursor: pointer;
}

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
