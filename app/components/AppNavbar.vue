<template>
  <!-- Spans the full width above the sidebar; z-50 keeps its dropdowns over the sidebar. -->
  <header class="fixed inset-x-0 top-0 z-50 h-14 border-b border-line bg-card">
    <div class="h-full px-4 flex items-center justify-between">
      <!-- Left Section: Menu Toggle & Logo -->
      <div class="flex items-center gap-3">
        <!-- Mobile Menu Toggle -->
        <UiButton variant="ghost" icon="lucide:menu" :label="$t('site.toggle_menu')" class="lg:hidden" @click="toggleMobileMenu" />

        <!-- Desktop Sidebar Toggle -->
        <UiButton variant="ghost" icon="lucide:menu" :label="$t('site.toggle_sidebar')" class="max-lg:hidden" @click="toggleSidebar" />

        <!-- Logo: the site name in the theme colour, with vivia's hover pill -->
        <NuxtLink
          to="/"
          class="flex h-10 items-center gap-2 rounded-lg px-2 text-2xl font-bold leading-none tracking-tight text-primary transition-colors duration-150 ease-out hover:bg-ghost-hover"
        >
          <!-- The name follows, so the picture needs no alt text of its own. -->
          <img src="/icon.png" alt="" width="32" height="32" class="size-8 rounded-lg">
          CDCat
        </NuxtLink>
      </div>

      <!-- Right Section: Appearance, Language Switcher & User. Every control is a 40px square; the glyphs are
           sized by eye rather than all at 20px (moon 19, sun 21, the dense languages glyph and the bell 18),
           so they look the same size, and the avatar is 26px with 7px of room around it on hover. -->
      <div class="flex items-center gap-1">
        <!-- Appearance: dark or light, and the theme colour -->
        <div class="relative">
          <UiTooltip :text="$t('appearance.open')">
            <button
              type="button"
              class="btn btn-ghost btn-square"
              :class="{ 'bg-ghost-hover text-primary': showAppearance }"
              :aria-label="$t('appearance.open')"
              :aria-expanded="showAppearance"
              @click="toggleAppearance"
            >
              <!-- vivia's sun and moon, cross-fading with the theme -->
              <span class="relative grid size-[21px] place-items-center">
                <Icon name="lucide:moon" class="absolute size-[19px] transition-opacity duration-150 ease-out" :class="theme === 'dark' ? 'opacity-100' : 'opacity-0'" />
                <Icon name="lucide:sun" class="absolute size-[21px] transition-opacity duration-150 ease-out" :class="theme === 'light' ? 'opacity-100' : 'opacity-0'" />
              </span>
            </button>
          </UiTooltip>

          <!-- On phones it spans the screen under the navbar: the button isn't at the right edge. -->
          <UiDropdown :open="showAppearance" align="end" screen class="sm:w-84">
            <AppAppearance />
          </UiDropdown>
        </div>

        <!-- Language Switcher -->
        <div class="relative">
          <UiButton
            variant="ghost"
            icon="lucide:languages"
            icon-class="size-[18px]"
            :label="$t('site.switch_language')"
            :class="{ 'bg-ghost-hover text-primary': showLanguageMenu }"
            @click="toggleLanguageMenu"
          />

          <!-- Language Dropdown -->
          <UiDropdown :open="showLanguageMenu" align="end" class="w-44 space-y-0.5 p-1">
            <!-- The current language is tinted with the theme colour; hovering only lifts the others, so the two never look alike. -->
            <button
              v-for="option in availableLocales"
              :key="option.code"
              :class="[
                'w-full flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors duration-150 ease-out',
                currentLocale === option.code
                  ? 'bg-primary/15 font-semibold text-primary'
                  : 'text-body hover:bg-ghost-hover hover:text-title'
              ]"
              @click="switchLanguage(option.code)"
            >
              <span :lang="option.language">{{ option.name }}</span>
              <Icon
                v-if="currentLocale === option.code"
                name="lucide:check"
                class="w-4 h-4"
              />
            </button>
          </UiDropdown>
        </div>

        <NotificationBell v-if="isAuthenticated" v-model:open="showNotifications" />

        <!-- User Menu or Login/Register Buttons -->
        <div v-if="isAuthenticated" class="relative ml-1">
          <button
            type="button"
            class="flex h-10 items-center gap-1 rounded-lg pl-[7px] pr-1.5 transition-colors duration-150 ease-out hover:bg-ghost-hover"
            :class="{ 'bg-ghost-hover': showUserMenu }"
            :aria-label="$t('site.user_menu')"
            :aria-expanded="showUserMenu"
            @click="toggleUserMenu"
          >
            <div
              class="flex size-[26px] items-center justify-center overflow-hidden rounded-full"
              :class="user?.avatar_url ? '' : 'bg-primary'"
            >
              <NuxtImg
                v-if="user?.avatar_url"
                :src="user.avatar_url"
                alt="avatar"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-on-primary text-xs font-semibold">{{ userInitial }}</span>
            </div>
            <!-- Turns over while the menu is open. -->
            <Icon
              name="lucide:chevron-down"
              class="size-4 text-meta transition-transform duration-200 motion-reduce:transition-none"
              :class="{ 'rotate-180': showUserMenu }"
            />
          </button>

          <!-- User Dropdown: a header that links to the profile, then the rows in groups (what one keeps, what one
               writes, the account), each closed by a line, and a footer with the admin console (staff only) on the left
               and signing out on the right. The current page is tinted. -->
          <UiDropdown
            :open="showUserMenu"
            align="end"
            role="menu"
            :aria-label="$t('site.user_menu')"
            class="w-60 p-1.5"
            @mouseleave="glideAway"
          >
            <!-- One highlight for all the rows, gliding to the one under the pointer, as in the sidebar. -->
            <div class="pointer-events-none absolute inset-x-1.5 top-0 rounded-sm bg-ghost-hover" :style="menuHighlight" aria-hidden="true" />
            <NuxtLink
              :to="`/profile/${user?.username}`"
              role="menuitem"
              class="group/profile relative flex items-center gap-3 rounded-sm bg-card-hover p-2 transition-colors duration-150 ease-out hover:bg-card-active"
              @mouseenter="glideAway"
            >
              <span class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full" :class="user?.avatar_url ? '' : 'bg-primary'">
                <NuxtImg v-if="user?.avatar_url" :src="user.avatar_url" alt="" class="size-full object-cover" />
                <span v-else class="text-sm font-semibold text-on-primary">{{ userInitial }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-title">{{ user?.nickname || user?.username }}</span>
                <span class="block truncate text-xs text-meta">@{{ user?.username }}</span>
                <span class="sr-only">{{ $t('user.profile') }}</span>
              </span>
              <Icon
                name="lucide:chevron-right"
                class="size-4 shrink-0 text-faint transition duration-150 ease-out group-hover/profile:translate-x-0.5 group-hover/profile:text-primary"
              />
            </NuxtLink>

            <div v-for="group in userMenuGroups" :key="group.key" role="group" :aria-label="$t(`site.user_menu_groups.${group.key}`)">
              <p class="px-3 pb-1 pt-2 text-[11px] font-semibold tracking-wide text-faint" aria-hidden="true">
                {{ $t(`site.user_menu_groups.${group.key}`) }}
              </p>
              <UiMenuItem
                v-for="item in group.items"
                :key="item.name"
                :to="item.path"
                :icon="item.icon"
                :active="isCurrent(item.path)"
                glide
                @mouseenter="glideTo($event.currentTarget)"
              >
                {{ $t(item.i18nKey) }}
              </UiMenuItem>
              <!-- Lighter than UiMenuDivider and inset to the text: it only closes the group. -->
              <div role="separator" class="mx-3 my-1 h-px bg-line/35" />
            </div>

            <!-- Smaller than the rows: these are actions, not places one browses to. Signing out only turns red on hover. -->
            <div class="relative flex items-center gap-1 pt-0.5" @mouseenter="glideAway">
              <NuxtLink
                v-if="hasPermission('admin.access')"
                to="/admin"
                role="menuitem"
                class="inline-flex min-w-0 items-center gap-1.5 rounded-sm px-2 py-1.5 text-[13px] text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-title"
                @click="showUserMenu = false"
              >
                <Icon name="lucide:layout-dashboard" class="size-3.5 shrink-0" />
                <span class="truncate">{{ $t('admin.console') }}</span>
              </NuxtLink>
              <button
                type="button"
                role="menuitem"
                class="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1.5 text-[13px] text-meta transition-colors duration-150 ease-out hover:bg-danger/10 hover:text-danger"
                @click="handleLogout"
              >
                <Icon name="lucide:log-out" class="size-3.5 shrink-0" />
                {{ $t('user.logout') }}
              </button>
            </div>
          </UiDropdown>
        </div>

        <!-- Login/Register Buttons (Not Authenticated); on phones, where the two don't fit, one icon with both in a menu -->
        <div v-else class="ml-1 hidden items-center gap-2 sm:flex">
          <UiButton to="/auth/login" size="sm">
            {{ $t('user.login') }}
          </UiButton>
          <UiButton to="/auth/register" variant="primary" size="sm">
            {{ $t('user.register') }}
          </UiButton>
        </div>
        <div v-if="!isAuthenticated" class="relative sm:hidden">
          <UiButton
            variant="ghost"
            icon="lucide:log-in"
            icon-class="size-[19px]"
            :label="$t('user.login')"
            :class="{ 'bg-ghost-hover text-primary': showGuestMenu }"
            :aria-expanded="showGuestMenu"
            @click="toggleGuestMenu"
          />
          <UiDropdown :open="showGuestMenu" align="end" class="w-40 space-y-0.5 p-1">
            <NuxtLink
              v-for="link in guestLinks"
              :key="link.to"
              :to="link.to"
              class="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm text-body transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-title"
            >
              <Icon :name="link.icon" class="size-4 shrink-0 text-meta" />
              {{ $t(link.label) }}
            </NuxtLink>
          </UiDropdown>
        </div>
      </div>
    </div>

    <!-- Click outside to close dropdowns -->
    <div
      v-if="showLanguageMenu || showUserMenu || showAppearance || showNotifications || showGuestMenu"
      class="fixed inset-0 -z-10"
      @click="closeAllDropdowns"
    />
  </header>
</template>

<script setup lang="ts">
import { userMenuGroups } from '~/config/menu'
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
const { enter: glideTo, leave: glideAway, style: menuHighlight } = useGlideHighlight()
// Reopened, the menu starts without a highlight until the pointer is on a row.
watch(showUserMenu, (open) => { if (!open) glideAway() })
const showLanguageMenu = ref(false)
const showAppearance = ref(false)
const showNotifications = ref(false)
const showGuestMenu = ref(false)
const guestLinks = [
  { to: '/auth/login', icon: 'lucide:log-in', label: 'user.login' },
  { to: '/auth/register', icon: 'lucide:user-plus', label: 'user.register' },
]

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

const toggleGuestMenu = () => {
  const next = !showGuestMenu.value
  closeAllDropdowns()
  showGuestMenu.value = next
}

const toggleUserMenu = () => {
  const next = !showUserMenu.value
  closeAllDropdowns()
  showUserMenu.value = next
}

const closeAllDropdowns = () => {
  showUserMenu.value = false
  showLanguageMenu.value = false
  showAppearance.value = false
  showNotifications.value = false
  showGuestMenu.value = false
}

// The bell opens its list itself; the other menus close then, as they do for each other.
watch(showNotifications, (open) => {
  if (!open) return
  showUserMenu.value = false
  showLanguageMenu.value = false
  showAppearance.value = false
})

// Opening another page closes the menus.
const route = useRoute()
watch(() => route.fullPath, closeAllDropdowns)

/** Whether a row of the user menu is the page being shown (or a page under it). */
const isCurrent = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

// Escape closes whichever menu is open.
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && (showUserMenu.value || showLanguageMenu.value || showAppearance.value || showNotifications.value || showGuestMenu.value)) {
    closeAllDropdowns()
  }
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
</style>
