<template>
  <aside
    :class="[
      'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40',
      'transition-all duration-300 ease-in-out',
      'flex flex-col',
      isCollapsed ? 'w-16' : 'w-56',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Logo Section -->
    <div class="h-16 flex items-center justify-center border-b border-gray-200 shrink-0">
      <transition name="fade" mode="out-in">
        <h1
          v-if="!isCollapsed"
          key="full-logo"
          class="text-2xl font-bold text-gray-900 tracking-tight"
        >
          CDCAT
        </h1>
        <div
          v-else
          key="collapsed-logo"
          class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center"
        >
          <span class="text-white text-base font-bold">C</span>
        </div>
      </transition>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 min-h-0 overflow-y-auto py-6">
      <ul class="space-y-2 px-3">
        <li v-for="item in menuItems" :key="item.name">
          <NuxtLink
            :to="item.path"
            :class="[
              'flex items-center gap-4 px-4 py-3 rounded-xl',
              'transition-all duration-200',
              'hover:bg-gray-100 group relative',
              isActive(item.path) ? 'bg-gray-900 text-white hover:bg-gray-800' : 'text-gray-700'
            ]"
          >
            <Icon
              :name="item.icon"
              :class="[
                'w-6 h-6 transition-transform duration-200 shrink-0',
                'group-hover:scale-110'
              ]"
            />
            <transition name="fade">
              <span v-if="!isCollapsed" class="font-medium text-[15px]">
                {{ $t(item.i18nKey) }}
              </span>
            </transition>

            <!-- Tooltip for collapsed state -->
            <div
              v-if="isCollapsed"
              class="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200
                     pointer-events-none whitespace-nowrap shadow-lg"
            >
              {{ $t(item.i18nKey) }}
            </div>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Footer -->
    <div class="mt-auto shrink-0 border-t border-gray-200 p-4">
      <transition name="fade" mode="out-in">
        <div v-if="!isCollapsed" class="text-xs text-gray-400 text-center">
          © 2025 CDCAT
        </div>
        <div v-else class="flex justify-center">
          <div class="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
      </transition>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <transition name="fade">
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="closeMobile"
    ></div>
  </transition>
</template>

<script setup lang="ts">
import { menuItems } from '~/config/menu'

const route = useRoute()

defineProps<{
  isCollapsed: boolean
  isMobileOpen: boolean
}>()

const emit = defineEmits<{
  closeMobile: []
}>()

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const closeMobile = () => {
  emit('closeMobile')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
