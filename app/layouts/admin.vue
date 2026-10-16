<script setup lang="ts">
import { adminGroups, adminMenu, findAdminMenuItem, type AdminGroupKey } from '~/config/admin'

const route = useRoute()
const { $api } = useNuxtApp()
const { hasPermission, user } = useAuth()
const { t } = useAdminI18n()
const open = ref(false)
const query = ref('')
const searchInput = useTemplateRef('searchInput')

const links = computed(() => adminMenu.filter(item => hasPermission(item.permission)))
const current = computed(() => findAdminMenuItem(route.path, links.value))
const currentGroup = computed(() => adminGroups.find(group => group.key === current.value?.group))

// Collapsed groups are a per-browser preference; the group holding the current page always stays open.
const storageKey = 'admin:collapsed-groups'
const collapsed = ref<AdminGroupKey[]>([])
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (Array.isArray(saved)) collapsed.value = saved.filter(key => adminGroups.some(group => group.key === key))
  } catch { /* Storage unavailable: start expanded. */ }
})
const toggleGroup = (key: AdminGroupKey) => {
  collapsed.value = collapsed.value.includes(key) ? collapsed.value.filter(item => item !== key) : [...collapsed.value, key]
  try {
    localStorage.setItem(storageKey, JSON.stringify(collapsed.value))
  } catch { /* Ignore storage failures. */ }
}

const groups = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return adminGroups.map((group) => {
    const items = links.value.filter(item => item.group === group.key)
    const matches = needle ? items.filter(item => t(item.label).toLowerCase().includes(needle)) : items
    const expanded = Boolean(needle) || group.key === current.value?.group || !collapsed.value.includes(group.key)
    return { ...group, items: matches, total: items.length, expanded }
  }).filter(group => group.items.length)
})

const { data: pending, refresh: refreshPending } = useAsyncData('admin-layout-pending',
  () => hasPermission('revisions.view') ? $api<{ pagination: { total: number } }>('/v1/admin/revisions', { query: { status: 'pending', per_page: 1 } }) : Promise.resolve(null),
  { server: false })
const pendingCount = computed(() => pending.value?.pagination.total ?? 0)

watch(() => route.path, () => {
  open.value = false
  query.value = ''
  refreshPending()
})

const onKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = true
    searchInput.value?.focus()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const initial = computed(() => (user.value?.nickname || user.value?.username || '?').slice(0, 1).toUpperCase())
useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap' },
  ],
})
</script>

<template>
  <div class="admin-shell min-h-screen bg-[#f1f2f4] text-slate-900" lang="zh-Hans" @keydown.esc="open = false">
    <button v-if="open" type="button" class="fixed inset-0 z-30 bg-black/40 lg:hidden" :aria-label="t('admin_pages.close_menu_backdrop')" @click="open = false" />

    <aside class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-4 bg-[#0f1115] px-3.5 py-4 text-slate-300 transition-transform lg:translate-x-0" :class="open ? 'translate-x-0' : '-translate-x-full'">
      <div class="flex items-center gap-2.5 px-1.5">
        <NuxtLink to="/admin" class="flex min-w-0 flex-1 items-center gap-2.5">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-amber-400 text-[#0f1115]"><Icon name="lucide:music" class="size-[18px]" /></span>
          <span class="flex min-w-0 flex-col leading-tight"><b class="text-[15px] text-white">CDCAT</b><span class="text-xs text-slate-400">{{ t('admin_pages.console') }}</span></span>
        </NuxtLink>
        <button type="button" class="rounded p-1 text-slate-400 hover:text-white lg:hidden" :aria-label="t('admin_pages.close_menu')" @click="open = false">
          <Icon name="lucide:x" class="size-5" />
        </button>
      </div>

      <label class="flex items-center gap-2 rounded-[10px] border border-[#262a31] bg-[#1a1d23] px-2.5 py-2 text-[13px] text-slate-400 focus-within:border-amber-400/60">
        <Icon name="lucide:search" class="size-[15px] shrink-0" />
        <input ref="searchInput" v-model="query" type="search" :placeholder="t('admin_pages.search_menu')" :aria-label="t('admin_pages.search_menu')" class="min-w-0 flex-1 bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none" @keydown.esc.stop="query = ''">
        <kbd class="hidden rounded border border-slate-700 px-1.5 font-mono text-[11px] lg:inline">⌘K</kbd>
      </label>

      <nav class="admin-nav -mx-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1" :aria-label="t('admin_pages.console')">
        <div v-for="group in groups" :key="group.key" class="flex flex-col gap-0.5">
          <button
            type="button" :aria-expanded="group.expanded" :aria-controls="`admin-group-${group.key}`"
            :disabled="Boolean(query.trim()) || group.key === current?.group"
            class="flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold tracking-wider text-slate-500 hover:text-slate-300 disabled:cursor-default disabled:hover:text-slate-500"
            @click="toggleGroup(group.key)"
          >
            <span>{{ t(group.label) }}<template v-if="!group.expanded"> · {{ group.total }}</template></span>
            <Icon name="lucide:chevron-down" class="size-3.5 transition-transform" :class="group.expanded ? '' : '-rotate-90'" />
          </button>
          <div v-show="group.expanded" :id="`admin-group-${group.key}`" class="flex flex-col gap-0.5">
            <NuxtLink
              v-for="item in group.items" :key="item.path" :to="item.path"
              :aria-current="current?.path === item.path ? 'page' : undefined"
              class="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-sm transition-colors"
              :class="current?.path === item.path ? 'bg-[#1f232b] font-medium text-white' : 'text-[#c3c7cf] hover:bg-white/5 hover:text-white'"
            >
              <Icon :name="item.icon" class="size-4 shrink-0" />
              <span class="flex-1 truncate">{{ t(item.label) }}</span>
              <span v-if="item.path === '/admin/revisions' && pendingCount" class="rounded-full bg-amber-400 px-1.5 font-mono text-[11px] leading-[18px] text-slate-900">{{ pendingCount }}</span>
            </NuxtLink>
          </div>
        </div>
        <p v-if="!groups.length" class="px-2.5 py-2 text-sm text-slate-500">{{ t('admin_pages.no_menu_match') }}</p>
      </nav>

      <div class="flex items-center gap-2.5 border-t border-[#1f2329] px-1.5 pt-3">
        <img v-if="user?.avatar" :src="user.avatar" alt="" class="size-8 rounded-full object-cover">
        <span v-else class="flex size-8 items-center justify-center rounded-full bg-slate-700 text-[13px] font-semibold text-white">{{ initial }}</span>
        <span class="flex min-w-0 flex-1 flex-col text-[13px] leading-tight">
          <span class="truncate text-slate-100">{{ user?.nickname || user?.username }}</span>
          <span class="truncate text-xs text-slate-400">{{ user?.roles || '—' }}</span>
        </span>
        <NuxtLink to="/" class="shrink-0 text-xs text-slate-400 hover:text-white">{{ t('admin_pages.back_to_site') }}</NuxtLink>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
        <button type="button" class="-ml-1 rounded p-1 text-slate-600 lg:hidden" :aria-label="t('admin_pages.open_menu')" :aria-expanded="open" @click="open = !open">
          <Icon name="lucide:menu" class="size-5" />
        </button>
        <nav class="flex min-w-0 items-center gap-2 text-[13px] text-slate-500" :aria-label="t('admin_pages.breadcrumb')">
          <NuxtLink to="/admin" class="shrink-0 hover:text-slate-900">{{ t('admin_pages.console') }}</NuxtLink>
          <template v-if="currentGroup && current?.path !== '/admin'"><span aria-hidden="true">/</span><span class="shrink-0">{{ t(currentGroup.label) }}</span></template>
          <template v-if="current"><span aria-hidden="true">/</span><span class="truncate font-medium text-slate-900" aria-current="page">{{ t(current.label) }}</span></template>
        </nav>
      </header>
      <main><slot /></main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  font-family: 'IBM Plex Sans', var(--font-sans-zh-hans), sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* A thin dark scrollbar that only shows while the menu is hovered or focused. */
.admin-nav {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  scrollbar-gutter: stable;
}
.admin-nav:hover,
.admin-nav:focus-within {
  scrollbar-color: #2f343d transparent;
}
.admin-nav::-webkit-scrollbar {
  width: 6px;
}
.admin-nav::-webkit-scrollbar-track {
  background: transparent;
}
.admin-nav::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: transparent;
}
.admin-nav:hover::-webkit-scrollbar-thumb,
.admin-nav:focus-within::-webkit-scrollbar-thumb {
  background: #2f343d;
}
.admin-nav::-webkit-scrollbar-thumb:hover {
  background: #4b5160;
}
</style>
