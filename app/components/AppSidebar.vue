<template>
  <aside
    :class="[
      'fixed left-0 top-16 bottom-0 bg-card border-r border-line z-40',
      'transition-all duration-300 ease-in-out',
      'flex flex-col',
      isCollapsed ? 'w-16' : 'w-56',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Navigation (the logo lives in the navbar, which runs across the top) -->
    <!-- Scrolls only vertically: nothing may widen it while the sidebar collapses. -->
    <nav class="flex-1 min-h-0 overflow-x-hidden overflow-y-auto py-6">
      <ul :class="['relative space-y-2', isCollapsed ? 'px-2' : 'px-3']" @mouseleave="leave">
        <!-- One highlight for the whole list: it glides to the item under the pointer. -->
        <div
          class="pointer-events-none absolute top-0 rounded-lg bg-ghost-hover"
          :class="isCollapsed ? 'inset-x-2' : 'inset-x-3'"
          :style="highlightStyle"
          aria-hidden="true"
        />
        <li v-for="item in menuItems" :key="item.name" @mouseenter="enter($event, item.name)">
          <!-- vivia's navigation links: the theme colour on hover, the current one filled. Collapsed, the name moves
               to the link's label and a tooltip beside the sidebar (teleported, so the scrolling nav can't clip it). -->
          <UiTooltip :text="$t(item.i18nKey)" placement="right" :offset="20" :delay="0" :disabled="!isCollapsed">
            <NuxtLink
              :to="item.path"
              :aria-label="isCollapsed ? $t(item.i18nKey) : undefined"
              :class="[
                'relative flex h-11 items-center rounded-lg',
                isCollapsed ? 'justify-center px-3' : 'gap-3.5 px-3.5',
                'transition-colors duration-200 ease-out',
                isActive(item.path) ? 'bg-primary text-on-primary' : hovered === item.name ? 'text-primary' : 'text-body'
              ]"
            >
              <Icon :name="item.icon" class="size-5 shrink-0" />
              <transition name="fade">
                <span v-if="!isCollapsed" class="whitespace-nowrap font-semibold text-[15px]">
                  {{ $t(item.i18nKey) }}
                </span>
              </transition>
            </NuxtLink>
          </UiTooltip>
        </li>
      </ul>
    </nav>

    <!-- Footer: only while expanded; the collapsed bar shows nothing here. -->
    <div class="mt-auto shrink-0 p-4">
      <transition name="fade">
        <div v-if="!isCollapsed" class="whitespace-nowrap text-xs text-faint text-center">
          © 2026 CDCat
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

// The hover highlight glides from item to item (useGlideHighlight); the hovered item's text takes the theme colour.
const hovered = ref<string | null>(null)
const { enter: glideTo, leave: glideAway, style: highlightStyle } = useGlideHighlight()

const enter = (event: MouseEvent, name: string) => {
  glideTo(event.currentTarget)
  hovered.value = name
}

const leave = () => {
  glideAway()
  hovered.value = null
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
