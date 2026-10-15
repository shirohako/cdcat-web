<script setup lang="ts">
import { adminMenu } from '~/config/admin'

const route = useRoute()
const { hasPermission, user } = useAuth()
const { t } = useAdminI18n()
const open = ref(false)
const links = computed(() => adminMenu.filter(item => hasPermission(item.permission)))
const current = computed(() => links.value.find(item => route.path === item.path || (item.path !== '/admin' && route.path.startsWith(`${item.path}/`))))
watch(() => route.path, () => { open.value = false })
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900" lang="zh-Hans" @keydown.esc="open = false">
    <button v-if="open" type="button" class="fixed inset-0 z-30 bg-black/30 lg:hidden" :aria-label="t('admin_pages.close_menu_backdrop')" @click="open = false" />
    <aside class="fixed inset-y-0 left-0 z-40 w-56 border-r border-slate-200 bg-white transition-transform lg:translate-x-0" :class="open ? 'translate-x-0' : '-translate-x-full'">
      <div class="flex h-16 items-center border-b border-slate-100">
        <NuxtLink to="/admin" class="flex items-center gap-2 px-5 font-bold">
          <Icon name="lucide:layout-dashboard" class="size-5" />{{ t('admin_pages.console') }}
        </NuxtLink>
        <button type="button" class="ml-auto mr-3 rounded p-1 text-slate-500 lg:hidden" :aria-label="t('admin_pages.close_menu')" @click="open = false">
          <Icon name="lucide:x" class="size-5" />
        </button>
      </div>
      <nav class="space-y-1 p-3" :aria-label="t('admin_pages.console')">
        <NuxtLink v-for="item in links" :key="item.path" :to="item.path" class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100" :class="current?.path === item.path ? 'bg-slate-100 font-semibold' : ''">
          <Icon :name="item.icon" class="size-4" />{{ t(item.label) }}
        </NuxtLink>
      </nav>
      <NuxtLink to="/" class="absolute bottom-6 left-6 text-sm text-slate-500 hover:text-slate-900">{{ t('admin_pages.back_to_site') }}</NuxtLink>
    </aside>
    <div class="lg:pl-56">
      <header class="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
        <button type="button" class="lg:hidden" :aria-label="t('admin_pages.open_menu')" :aria-expanded="open" @click="open = !open">
          <Icon name="lucide:menu" class="size-5" />
        </button>
        <nav class="flex items-center gap-2 text-sm" :aria-label="t('admin_pages.breadcrumb')">
          <NuxtLink to="/admin" class="text-slate-500">{{ t('admin_pages.console') }}</NuxtLink>
          <template v-if="current"><span aria-hidden="true">/</span><span aria-current="page">{{ t(current.label) }}</span></template>
        </nav>
        <span class="ml-auto truncate text-sm text-slate-500">{{ user?.nickname || user?.username }}</span>
      </header>
      <main><slot /></main>
    </div>
  </div>
</template>
