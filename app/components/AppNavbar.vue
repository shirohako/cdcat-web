<template>
  <!-- Spans the full width above the sidebar; z-50 keeps its dropdowns over the sidebar. -->
  <header class="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-card">
    <div class="h-full px-4 flex items-center justify-between">
      <!-- Left Section: Menu Toggle & Logo -->
      <div class="flex items-center gap-3">
        <!-- Mobile Menu Toggle -->
        <UiIconButton icon="lucide:menu" label="Toggle mobile menu" class="lg:hidden" @click="toggleMobileMenu" />

        <!-- Desktop Sidebar Toggle -->
        <UiIconButton icon="lucide:menu" label="Toggle sidebar" class="max-lg:hidden" @click="toggleSidebar" />

        <!-- Logo: the site name in the theme colour, with vivia's hover pill -->
        <NuxtLink
          to="/"
          class="flex h-10 items-center gap-2 rounded-lg px-2 text-2xl font-bold leading-none tracking-tight text-primary transition-colors duration-150 ease-out hover:bg-ghost-hover"
        >
          <!-- The name follows, so the picture needs no alt text of its own. -->
          <img src="/icon.png" alt="" width="32" height="32" class="size-8 rounded-lg">
          CDCAT
        </NuxtLink>
      </div>

      <!-- Right Section: Search, Appearance, Language Switcher & User -->
      <div class="flex items-center gap-1">
        <!-- Search: an icon that opens a search box ("/" opens it too) -->
        <div class="sm:relative">
          <UiIconButton
            icon="lucide:search"
            :label="$t('search.title')"
            :title="$t('search.shortcut')"
            :class="{ 'bg-ghost-hover text-primary': showSearch }"
            :aria-expanded="showSearch"
            @click="toggleSearch"
          />

          <transition name="dropdown">
            <div
              v-if="showSearch"
              class="fixed inset-x-4 top-[4.5rem] rounded-xl bg-popover p-3 shadow-overlay ring-1 ring-line
                     sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[28rem]"
            >
              <SearchQuickResults autofocus @dismiss="showSearch = false" />
            </div>
          </transition>
        </div>

        <!-- Appearance: dark or light, and the theme colour -->
        <div class="sm:relative">
          <button
            type="button"
            class="btn btn-ghost btn-square"
            :class="{ 'bg-ghost-hover text-primary': showAppearance }"
            :aria-label="$t('appearance.open')"
            :title="$t('appearance.open')"
            :aria-expanded="showAppearance"
            @click="toggleAppearance"
          >
            <!-- vivia's sun and moon, cross-fading with the theme -->
            <span class="relative grid size-5 place-items-center">
              <Icon name="lucide:moon" class="absolute size-5 transition-opacity duration-150 ease-out" :class="theme === 'dark' ? 'opacity-100' : 'opacity-0'" />
              <Icon name="lucide:sun" class="absolute size-5 transition-opacity duration-150 ease-out" :class="theme === 'light' ? 'opacity-100' : 'opacity-0'" />
            </span>
          </button>

          <transition name="dropdown">
            <div
              v-if="showAppearance"
              class="fixed right-4 top-[4.5rem] rounded-xl bg-popover shadow-overlay ring-1 ring-line
                     sm:absolute sm:right-0 sm:top-full sm:mt-2"
            >
              <AppAppearance />
            </div>
          </transition>
        </div>

        <!-- Language Switcher -->
        <div class="relative">
          <UiIconButton
            icon="lucide:languages"
            label="Switch language"
            :class="{ 'bg-ghost-hover text-primary': showLanguageMenu }"
            @click="toggleLanguageMenu"
          />

          <!-- Language Dropdown -->
          <transition name="dropdown">
            <div
              v-if="showLanguageMenu"
              class="absolute right-0 mt-2 w-44 space-y-0.5 overflow-hidden rounded-xl bg-popover p-1 shadow-overlay ring-1 ring-line"
            >
              <!-- The current language is tinted with the theme colour; hovering only lifts the others, so the two never look alike. -->
              <button
                v-for="option in availableLocales"
                :key="option.code"
                :class="[
                  'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-out',
                  currentLocale === option.code
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'text-body hover:bg-ghost-hover hover:text-title'
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
        <div v-if="isAuthenticated" class="relative ml-1">
          <button
            class="group flex h-10 items-center gap-1.5 rounded-lg pl-1 pr-1.5
                   transition-colors duration-150 ease-out hover:bg-ghost-hover"
            :class="{ 'bg-ghost-hover': showUserMenu }"
            aria-label="User menu"
            @click="toggleUserMenu"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden
                     ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-150"
              :class="user?.avatar_url ? '' : 'bg-primary'"
            >
              <NuxtImg
                v-if="user?.avatar_url"
                :src="user.avatar_url"
                alt="avatar"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-on-primary text-sm font-semibold">{{ userInitial }}</span>
            </div>
            <Icon
              name="lucide:chevron-down"
              class="w-4 h-4 text-meta transition-transform duration-200"
              :class="{ 'rotate-180': showUserMenu }"
            />
          </button>

          <!-- User Dropdown -->
          <transition name="dropdown">
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-popover shadow-overlay ring-1 ring-line"
            >
              <div class="p-4 border-b border-line">
                <p class="font-semibold text-title">{{ user?.nickname }}</p>
                <p class="text-sm text-meta">@{{ user?.username }}</p>
              </div>
              <div class="p-1">
                <NuxtLink
                  v-for="item in userMenuItems"
                  :key="item.name"
                  :to="item.name === 'profile' ? `/profile/${user?.username}` : item.path"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-body
                         transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
                >
                  <Icon :name="item.icon" class="w-4 h-4" />
                  <span>{{ $t(item.i18nKey) }}</span>
                </NuxtLink>
              </div>
              <div v-if="hasPermission('admin.access')" class="border-t border-line p-1">
                <NuxtLink
                  to="/admin"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary"
                  @click="showUserMenu = false"
                >
                  <Icon name="lucide:layout-dashboard" class="w-4 h-4" />
                  <span>{{ $t('admin.console') }}</span>
                </NuxtLink>
              </div>
              <div class="border-t border-line p-1">
                <button
                  class="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger
                         transition-colors duration-150 ease-out hover:bg-danger/10"
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
        <div v-else class="ml-1 flex items-center gap-2">
          <UiButton to="/auth/login" variant="ghost">
            {{ $t('user.login') }}
          </UiButton>
          <UiButton to="/auth/register" variant="primary">
            {{ $t('user.register') }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Click outside to close dropdowns -->
    <div
      v-if="showLanguageMenu || showUserMenu || showSearch || showAppearance"
      class="fixed inset-0 -z-10"
      @click="closeAllDropdowns"
    />
  </header>
</template>

<script setup lang="ts">
import { userMenuItems } from '~/config/menu'
import { localDrafts } from '~/utils/localDrafts'
import { queryLanguage, withoutLanguageQuery, type SiteLocale } from '~/utils/languageQuery'

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
const { theme } = useAppearance()

const showUserMenu = ref(false)
const showLanguageMenu = ref(false)
const showSearch = ref(false)
const showAppearance = ref(false)

const currentLocale = computed(() => locale.value)
const availableLocales = computed(() => locales.value)

// 获取用户名首字母
const userInitial = computed(() => {
  if (!user.value?.username) return 'U'
  return user.value.username.charAt(0).toUpperCase()
})

const router = useRouter()
const switchLanguage = async (localeCode: string) => {
  await setLocale(localeCode as SiteLocale)
  showLanguageMenu.value = false
  // A `?l=` / `?lang=` left in the address would switch back on the next reload.
  const { query } = router.currentRoute.value
  if (queryLanguage(query)) await router.replace({ query: withoutLanguageQuery(query) })
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

const toggleAppearance = () => {
  const next = !showAppearance.value
  closeAllDropdowns()
  showAppearance.value = next
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
  showAppearance.value = false
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
