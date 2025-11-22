<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="isMobileMenuOpen"
      @close-mobile="isMobileMenuOpen = false"
    />

    <!-- Navbar -->
    <Navbar
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-menu-open="isMobileMenuOpen"
      @toggle-sidebar="toggleSidebar"
      @toggle-mobile-menu="toggleMobileMenu"
    />

    <!-- Main Content -->
    <main
      :class="[
        'pt-16 transition-all duration-300 ease-in-out',
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      ]"
    >
      <div class="p-6">
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
</script>