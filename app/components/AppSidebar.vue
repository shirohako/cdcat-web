<template>
  <aside
    :class="[
      'fixed left-0 top-14 bottom-0 bg-card border-r border-line z-40',
      'transition-all duration-300 ease-in-out',
      'flex flex-col',
      FOLD.aside[mode],
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Navigation (the logo lives in the navbar, which runs across the top) -->
    <!-- Scrolls only vertically: nothing may widen it while the sidebar collapses. -->
    <nav class="flex-1 min-h-0 overflow-x-hidden overflow-y-auto pb-6 pt-3">
      <ul :class="['relative space-y-2', FOLD.list[mode]]" @mouseleave="leave">
        <!-- One highlight for the whole list: it glides to the item under the pointer. -->
        <div
          class="pointer-events-none absolute top-0 rounded-lg bg-ghost-hover"
          :class="FOLD.highlight[mode]"
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
                FOLD.link[mode],
                'transition-colors duration-200 ease-out',
                isActive(item.path) ? 'bg-primary text-on-primary' : hovered === item.name ? 'text-primary' : 'text-body'
              ]"
            >
              <Icon :name="item.icon" class="size-5 shrink-0" />
              <span :class="['whitespace-nowrap font-semibold text-[15px]', FOLD.hidden[mode]]">
                {{ $t(item.i18nKey) }}
              </span>
            </NuxtLink>
          </UiTooltip>
        </li>
      </ul>
    </nav>

    <!-- Footer: only while expanded; the collapsed bar shows nothing here. -->
    <div class="mt-auto shrink-0 p-4">
      <div :class="['whitespace-nowrap text-xs text-faint text-center', FOLD.hidden[mode]]">
        © 2026 CDCat
      </div>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <transition name="fade">
    <div
      v-if="isMobileOpen"
      class="fixed inset-x-0 top-14 bottom-0 bg-black/50 z-30 lg:hidden"
      @click="closeMobile"
    />
  </transition>
</template>

<script setup lang="ts">
import { menuItems } from '~/config/menu'

/** 'auto' folds the sidebar between lg and xl only; the others fold or open it at every width from lg. */
export type SidebarMode = 'auto' | 'collapsed' | 'expanded'

const route = useRoute()

defineProps<{
  mode: SidebarMode
  /** Whether it is folded right now, which 'auto' only knows in the browser: for the name tips and labels. */
  isCollapsed: boolean
  isMobileOpen: boolean
}>()

/**
 * The folded and the open sidebar's classes, by mode. Folding applies from lg: below it the sidebar is the phone
 * drawer, always open. Written out in full so Tailwind finds every class; 'auto' uses lg:max-xl variants, so the
 * server-rendered sidebar is already folded or open as the width calls for, and the labels are hidden rather than
 * removed.
 */
const FOLD = {
  aside: { auto: 'w-52 lg:max-xl:w-16', collapsed: 'w-52 lg:w-16', expanded: 'w-52' },
  list: { auto: 'px-3 lg:max-xl:px-2', collapsed: 'px-3 lg:px-2', expanded: 'px-3' },
  highlight: { auto: 'inset-x-3 lg:max-xl:inset-x-2', collapsed: 'inset-x-3 lg:inset-x-2', expanded: 'inset-x-3' },
  link: { auto: 'gap-3 px-3.5 lg:max-xl:justify-center lg:max-xl:px-3', collapsed: 'gap-3 px-3.5 lg:justify-center lg:px-3', expanded: 'gap-3 px-3.5' },
  hidden: { auto: 'lg:max-xl:hidden', collapsed: 'lg:hidden', expanded: '' },
} satisfies Record<string, Record<SidebarMode, string>>

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
