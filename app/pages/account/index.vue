<template>
  <div class="relative min-h-[calc(100vh-4rem)]">
    <!-- Decorative background -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-32 -left-28 h-96 w-96 rounded-full bg-linear-to-br from-primary/15 to-primary/5 blur-3xl" />
      <div class="absolute -top-24 -right-28 h-80 w-80 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-3xl" />
      <div class="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-linear-to-br from-primary/10 to-primary/5 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--line)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
    </div>

    <div class="relative container mx-auto px-4 md:px-6 py-10 max-w-6xl 2xl:max-w-7xl">
      <!-- Header -->
      <div class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-card/70 backdrop-blur flex items-center justify-center">
            <div class="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-primary-strong text-on-primary flex items-center justify-center text-sm font-semibold">
              {{ userInitial }}
            </div>
          </div>
          <div>
            <h1 class="text-2xl md:text-3xl font-bold text-title tracking-tight">
              {{ $t('user.account') }}
            </h1>
            <p class="mt-1.5 text-sm text-meta">
              {{ t('account_pages.description') }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-meta">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/70 backdrop-blur">
            <UserIcon :size="14" class="text-meta" />
            <span class="font-medium text-body">
              {{ userDisplayName }}
            </span>
          </span>
          <span v-if="user?.email" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/70 backdrop-blur">
            <Mail :size="14" class="text-meta" />
            <span class="truncate max-w-56">{{ user.email }}</span>
          </span>
        </div>
      </div>

      <div>
        <!-- Tabs -->
        <nav class="relative mb-6" :aria-label="t('account_pages.title')">
          <div
            ref="tabsScrollRef"
            class="flex items-center gap-1 overflow-x-auto rounded-2xl bg-sunken ring-1 ring-line p-1.5 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            @scroll="onTabsScroll"
          >
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="shrink-0 flex items-center gap-1.5 rounded-xl font-medium transition-colors duration-150 ease-out px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm md:gap-2"
              :class="activeTab === tab.key
                ? 'bg-card text-title ring-1 ring-line'
                : 'text-meta hover:text-title hover:bg-card/60 active:bg-card/60'"
              @click="activeTab = tab.key"
            >
              <component
                :is="tab.icon"
                :size="15"
                class="shrink-0 transition-colors"
                :class="activeTab === tab.key ? 'text-primary' : 'text-meta'"
              />
              <span class="whitespace-nowrap">{{ tab.label }}</span>
            </button>
          </div>
          <!-- Scroll hints -->
          <button
            v-show="canScrollLeft"
            type="button"
            class="absolute inset-y-0 left-0 w-9 rounded-l-2xl bg-linear-to-r from-sunken/95 from-40% to-transparent flex items-center justify-start pl-1.5 text-body hover:text-primary transition-colors"
            :aria-label="t('common.previous')"
            @click="scrollTabs('left')"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
          </button>
          <button
            v-show="canScrollRight"
            type="button"
            class="absolute inset-y-0 right-0 w-9 rounded-r-2xl bg-linear-to-l from-sunken/95 from-40% to-transparent flex items-center justify-end pr-1.5 text-body hover:text-primary transition-colors"
            :aria-label="t('common.next')"
            @click="scrollTabs('right')"
          >
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </nav>

        <section>

          <!-- Tab panels -->
          <KeepAlive>
            <AccountProfileTab
              v-if="activeTab === 'profile'"
              :user="user"
              @save="showToast(t('account_pages.profile_saved'))"
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
            @save="showToast(t('account_pages.preferences_saved'))"
          />

<AccountSecurityTab
            v-if="activeTab === 'security'"
            @save="(msg) => showToast(msg)"
            @error="(msg) => showToast(msg, 'error')"
          />

          <AccountNotificationsTab
            v-if="activeTab === 'notifications'"
          />

          <AccountPrivacyTab
            v-if="activeTab === 'privacy'"
          />

          <AccountDangerTab
            v-if="activeTab === 'danger'"
          />
        </section>
      </div>

    </div>
  </div>
</template>

<script setup>
import {
  User as UserIcon, Mail, Lock, Bell, AlertTriangle, Settings, EyeOff,
} from '@lucide/vue'

definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const { showToast } = useToast()
const { t } = useI18n()

const userDisplayName = computed(() => {
  return user?.value?.nickname || user?.value?.username || ''
})

const userInitial = computed(() => {
  const name = userDisplayName.value || user?.value?.email || 'U'
  return String(name).trim().slice(0, 1).toUpperCase()
})

const tabs = computed(() => [
  { key: 'profile', label: t('account_pages.tabs.profile'), icon: UserIcon },
  { key: 'email', label: t('account_pages.tabs.email'), icon: Mail },
  { key: 'preferences', label: t('account_pages.tabs.preferences'), icon: Settings },
  { key: 'security', label: t('account_pages.tabs.security'), icon: Lock },
  { key: 'notifications', label: t('account_pages.tabs.notifications'), icon: Bell },
  { key: 'privacy', label: t('account_pages.tabs.privacy'), icon: EyeOff },
  { key: 'danger', label: t('account_pages.tabs.danger'), icon: AlertTriangle }
])

// `?tab=notifications` opens a tab directly (the mail settings page links there).
const route = useRoute()
const activeTab = ref(tabs.value.some(tab => tab.key === route.query.tab) ? String(route.query.tab) : 'profile')

// Scroll fade hints
const tabsScrollRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function onTabsScroll() {
  const el = tabsScrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function scrollTabs(direction) {
  const el = tabsScrollRef.value
  if (!el) return
  el.scrollBy({ left: direction === 'left' ? -150 : 150, behavior: 'smooth' })
}

onMounted(() => {
  nextTick(onTabsScroll)
  if (tabsScrollRef.value) {
    new ResizeObserver(onTabsScroll).observe(tabsScrollRef.value)
  }
})

useHead({
  title: computed(() => t('account_pages.title'))
})
</script>
