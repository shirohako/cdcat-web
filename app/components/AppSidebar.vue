<template>
  <aside
    :class="[
      'fixed left-0 top-16 bottom-0 bg-card border-r border-line z-40',
      'transition-all duration-300 ease-in-out',
      'flex flex-col',
      isCollapsed ? 'w-16' : 'w-52',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Navigation (the logo lives in the navbar, which runs across the top) -->
    <nav class="flex-1 min-h-0 overflow-y-auto py-6">
      <ul :class="['space-y-2', isCollapsed ? 'px-2' : 'px-3']">
        <li v-for="item in menuItems" :key="item.name">
          <!-- vivia's navigation links: a quiet background and the theme colour on hover, the current one filled -->
          <NuxtLink
            :to="item.path"
            :class="[
              'group relative flex h-11 items-center rounded-lg',
              isCollapsed ? 'justify-center px-3' : 'gap-3.5 px-3.5',
              'transition-colors duration-150 ease-out',
              isActive(item.path) ? 'bg-primary text-on-primary' : 'text-body hover:bg-ghost-hover hover:text-primary'
            ]"
          >
            <Icon :name="item.icon" class="size-5 shrink-0" />
            <transition name="fade">
              <span v-if="!isCollapsed" class="font-semibold text-[15px]">
                {{ $t(item.i18nKey) }}
              </span>
            </transition>

            <!-- Tooltip for collapsed state -->
            <div
              v-if="isCollapsed"
              class="absolute left-full ml-3 px-3 py-1.5 bg-popover text-title text-sm font-medium rounded-lg ring-1 ring-line
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150
                     pointer-events-none whitespace-nowrap shadow-overlay"
            >
              {{ $t(item.i18nKey) }}
            </div>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Footer -->
    <div class="mt-auto shrink-0 p-4">
      <transition name="fade" mode="out-in">
        <div v-if="!isCollapsed" class="text-xs text-faint text-center">
          © 2026 CDCAT
        </div>
        <div v-else class="flex justify-center">
          <div class="w-1.5 h-1.5 bg-faint rounded-full"/>
        </div>
      </transition>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <transition name="fade">
    <div
      v-if="isMobileOpen"
      class="fixed inset-x-0 top-16 bottom-0 bg-black/50 z-30 lg:hidden"
      @click="closeMobile"
    />
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
