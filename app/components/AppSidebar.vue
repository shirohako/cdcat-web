<template>
  <aside
    :class="[
      'fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 z-40',
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
          <NuxtLink
            :to="item.path"
            :class="[
              'flex items-center',
              isCollapsed ? 'justify-center px-3 py-3' : 'gap-4 px-4 py-3',
              'rounded-xl',
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
    <div class="mt-auto shrink-0 p-4">
      <transition name="fade" mode="out-in">
        <div v-if="!isCollapsed" class="text-xs text-gray-400 text-center">
          © 2026 CDCAT
        </div>
        <div v-else class="flex justify-center">
          <div class="w-1.5 h-1.5 bg-gray-300 rounded-full"/>
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
