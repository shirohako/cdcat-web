<template>
  <!-- Spans the full width above the sidebar; z-50 keeps its dropdowns over the sidebar. -->
  <header class="fixed inset-x-0 top-0 z-50 h-16 bg-white border-b border-gray-200">
    <div class="h-full px-4 flex items-center justify-between">
      <!-- Left Section: Menu Toggle & Logo -->
      <div class="flex items-center gap-4">
        <!-- Mobile Menu Toggle -->
        <button
          class="grid size-9 place-items-center rounded-lg transition-colors duration-200 hover:bg-gray-100 lg:hidden"
          aria-label="Toggle mobile menu"
          @click="toggleMobileMenu"
        >
          <Icon name="lucide:menu" class="w-5 h-5 text-gray-700" />
        </button>

        <!-- Desktop Sidebar Toggle -->
        <button
          class="group hidden size-9 place-items-center rounded-lg transition-colors duration-200 hover:bg-gray-100 lg:grid"
          aria-label="Toggle sidebar"
          @click="toggleSidebar"
        >
          <Icon
            name="lucide:menu"
            class="w-5 h-5 text-gray-700 transition-transform duration-200 group-hover:scale-110"
          />
        </button>

        <!-- Logo -->
        <NuxtLink to="/" class="flex h-9 items-center text-2xl font-bold leading-none tracking-tight text-gray-900">CDCAT</NuxtLink>
      </div>

      <!-- Right Section: Search, Language Switcher & User -->
      <div class="flex items-center gap-2">
        <!-- Search: an icon that opens a search box ("/" opens it too) -->
        <div class="sm:relative">
          <button
            class="group grid size-9 place-items-center rounded-lg transition-colors duration-200 hover:bg-gray-100"
            :class="{ 'bg-gray-100': showSearch }"
            :aria-label="$t('search.title')"
            :title="$t('search.shortcut')"
            :aria-expanded="showSearch"
            @click="toggleSearch"
          >
            <Icon
              name="lucide:search"
              class="w-5 h-5 text-gray-700 transition-transform duration-200 group-hover:scale-110"
            />
          </button>

          <transition name="dropdown">
            <div
              v-if="showSearch"
              class="fixed inset-x-4 top-[4.5rem] rounded-lg border border-gray-200 bg-white p-3 shadow-lg
                     sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[28rem]"
            >
              <SearchQuickResults autofocus @dismiss="showSearch = false" />
            </div>
          </transition>
        </div>

        <!-- Language Switcher -->
        <div class="relative">
          <button
            class="group grid size-9 place-items-center rounded-lg transition-colors duration-200 hover:bg-gray-100"
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
            class="group flex h-9 items-center gap-1.5 rounded-lg pl-0.5 pr-1.5
                   transition-colors duration-200 hover:bg-gray-100"
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
            class="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100"
          >
            {{ $t('user.login') }}
          </NuxtLink>
          <NuxtLink
            to="/auth/register"
            class="inline-flex h-9 items-center rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-800"
          >
            {{ $t('user.register') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Click outside to close dropdowns -->
    <div
      v-if="showLanguageMenu || showUserMenu || showSearch"
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
const showSearch = ref(false)

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

const toggleSearch = () => {
  const next = !showSearch.value
  closeAllDropdowns()
  showSearch.value = next
}

const toggleLanguageMenu = () => {
  const next = !showLanguageMenu.value
  closeAllDropdowns()
  showLanguageMenu.value = next
}

const toggleUserMenu = () => {
  const next = !showUserMenu.value
  closeAllDropdowns()
  showUserMenu.value = next
}

const closeAllDropdowns = () => {
  showUserMenu.value = false
  showLanguageMenu.value = false
  showSearch.value = false
}

// Opening a search result (or any other page) closes the menus.
const route = useRoute()
watch(() => route.fullPath, closeAllDropdowns)

// "/" anywhere outside a text field opens the search box.
const onKey = (event: KeyboardEvent) => {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target as HTMLElement | null
  if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
  event.preventDefault()
  closeAllDropdowns()
  showSearch.value = true
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

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
