<template>
  <div class="min-h-screen bg-page">
    <!-- Sidebar -->
    <AppSidebar
      :mode="sidebarMode"
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
        'pt-14 transition-all duration-300 ease-in-out',
        { auto: 'lg:ml-52 sidebar-folds:ml-16', collapsed: 'lg:ml-16', expanded: 'lg:ml-52' }[sidebarMode]
      ]"
    >
      <SiteAnnouncement />
      <div class="w-full">
        <slot />
      </div>
    </main>

    <!-- Reading progress, and back to the top on a click; bottom right -->
    <AppFloatButtons />
  </div>
</template>

<script setup lang="ts">
import type { SidebarMode } from '~/components/AppSidebar.vue'

/**
 * From lg up the sidebar sits beside the page. By itself ('auto') it folds to its icons below xl, where the full one
 * would crowd the page, and opens from xl; at a larger text size it opens that much later (the sidebar-folds variant
 * in main.css). 'auto' is drawn with those classes, so the server-rendered page is already right at every width. The
 * toggle folds or opens it by hand until the window next crosses one of those widths or the text size changes.
 */
const sidebarMode = ref<SidebarMode>('auto')
/** Where 'auto' means folded; known only in the browser, for what CSS can't do (the name tips). */
const isFoldWidth = ref(false)
const isSidebarCollapsed = computed(() => sidebarMode.value === 'collapsed' || (sidebarMode.value === 'auto' && isFoldWidth.value))
const isMobileMenuOpen = ref(false)

const toggleSidebar = () => {
  sidebarMode.value = isSidebarCollapsed.value ? 'expanded' : 'collapsed'
}

// The same widths as the sidebar-folds variant: lg up to xl (80rem) times the text size.
const { appliedTextSize } = useAppearance()
const foldQuery = computed(() => `(width >= 64rem) and (width < ${(80 * (appliedTextSize.value ?? 100)) / 100}rem)`)
let foldWidth: MediaQueryList | undefined
const onWidthChange = () => {
  isFoldWidth.value = !!foldWidth?.matches
  sidebarMode.value = 'auto'
}
const watchFoldWidth = () => {
  foldWidth?.removeEventListener('change', onWidthChange)
  foldWidth = window.matchMedia(foldQuery.value)
  foldWidth.addEventListener('change', onWidthChange)
  onWidthChange()
}
onMounted(watchFoldWidth)
watch(foldQuery, watchFoldWidth)
onBeforeUnmount(() => foldWidth?.removeEventListener('change', onWidthChange))

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})
</script>
