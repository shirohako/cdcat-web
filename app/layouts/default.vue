<template>
  <div class="min-h-screen bg-page">
    <!-- Sidebar -->
    <AppSidebar
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="isMobileMenuOpen"
      @close-mobile="isMobileMenuOpen = false"
    />

    <!-- Navbar -->
    <AppNavbar
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-menu-open="isMobileMenuOpen"
      @toggle-sidebar="toggleSidebar"
      @toggle-mobile-menu="toggleMobileMenu"
    />

    <!-- Main Content -->
    <main
      :class="[
        'pt-16 transition-all duration-300 ease-in-out',
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'
      ]"
    >
      <SiteAnnouncement />
      <div class="w-full">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const isSidebarCollapsed = ref(false)
const isMobileMenuOpen = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})

const { locale, locales } = useI18n()
const config = useRuntimeConfig()

// SEO: 设置 HTML lang 属性和 hreflang 链接（lang 跟随语言切换）
useHead({
  htmlAttrs: {
    lang: () => locale.value
  },
  link: computed(() => {
    const links: { rel: 'alternate', hreflang: string, href: string }[] = []
    const baseUrl = config.public.baseUrl
    const currentPath = route.path

    // 为每个语言添加 hreflang 链接（包含 lang 参数）
    locales.value.forEach((loc) => {
      const langCode = loc.code
      links.push({
        rel: 'alternate',
        hreflang: loc.language || loc.code,
        href: `${baseUrl}${currentPath}?lang=${langCode}`
      })
    })

    // 添加 x-default（默认语言）
    links.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${baseUrl}${currentPath}`
    })

    return links
  })
})
</script>
