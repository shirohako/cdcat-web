<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
      @after-leave="restoreFocus"
    >
      <div v-if="open" class="fixed inset-0 flex items-center justify-center p-4" :class="topmost ? 'z-[85]' : 'z-50'" @mousedown.self="close">
        <div class="pointer-events-none absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-2 scale-[0.97] opacity-0"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="translate-y-2 scale-[0.97] opacity-0"
        >
          <component
            :is="as"
            v-if="open"
            ref="panel"
            class="relative flex max-h-[80dvh] w-full flex-col overflow-hidden rounded-2xl bg-card text-body shadow-overlay ring-1 ring-line sm:max-h-[88dvh]"
            :class="SIZES[size]"
            role="dialog"
            aria-modal="true"
            :data-theme="dark ? 'dark' : undefined"
            :data-palette="dark ? appliedPalette : undefined"
            :aria-labelledby="titleId"
            :novalidate="as === 'form' || undefined"
            @submit.prevent="emit('submit')"
          >
            <header class="flex shrink-0 items-center gap-3 px-5 pb-3 pt-5">
              <UiIconTile v-if="icon" :icon="icon" :tone="tone" />
              <div class="min-w-0 flex-1">
                <h2 :id="titleId" class="truncate text-base font-bold leading-6 text-title">{{ title }}</h2>
                <p v-if="description" class="mt-0.5 text-xs leading-5 text-meta">{{ description }}</p>
              </div>
              <slot name="actions" />
              <UiButton variant="ghost" icon="lucide:x" :label="$t('common.close')" size="sm" class="-mr-1.5" @click="close" />
            </header>
            <div v-if="$slots.toolbar" class="shrink-0 px-5 pb-2"><slot name="toolbar" /></div>
            <div class="min-h-0 overflow-y-auto px-5 pt-1" :class="plainFooter ? 'pb-3' : 'pb-5'"><slot /></div>
            <footer
              v-if="$slots.footer"
              class="flex shrink-0 flex-wrap items-center justify-end gap-2 px-5"
              :class="plainFooter ? 'relative pb-3 pt-1.5' : 'border-t border-line bg-sunken py-3'"
            >
              <div v-if="plainFooter" class="pointer-events-none absolute inset-x-0 bottom-full h-3 bg-linear-to-t from-card to-transparent" />
              <slot name="footer" />
            </footer>
          </component>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import type { Component } from 'vue'
import type { UiTone } from './IconTile.vue'
import { dialogStack as stack } from '~/utils/dialogStack'
</script>

<script setup lang="ts">
/**
 * A dialog, centred at every width with the page showing around it. With `as="form"` the body is a form, so a
 * `type="submit"` button in the footer (or Enter in a text field) emits `submit`. Focus moves to the field, button or
 * link marked `data-autofocus`, else the first field, and goes back where it was on close. The `actions` slot sits left of
 * the close button; `toolbar` is a band under the header that stays while the body scrolls. `dark` keeps it dark on the light theme too, in the tooltips' colours; on the dark theme nothing changes.
 * `topmost` puts it above the other layers (drawers, the image viewer, popovers and lists), for a dialog any of them
 * can open; tooltips and toasts still show over it.
 */
withDefaults(defineProps<{
  title: string
  description?: string
  icon?: string | Component
  tone?: UiTone
  /** `full`: as wide as the window allows, up to 110rem (表格 · 完整's full-screen view) */
  size?: 'sm' | 'md' | 'ml' | 'lg' | 'xl' | 'full'
  as?: 'form' | 'div'
  dark?: boolean
  /** The footer without its band: the body fades out just above it. */
  plainFooter?: boolean
  topmost?: boolean
}>(), { description: undefined, icon: undefined, tone: 'primary', size: 'md', as: 'div', dark: false, plainFooter: false, topmost: false })

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ submit: [] }>()

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', ml: 'sm:max-w-2xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl', full: 'sm:max-w-[110rem]' }

const { appliedPalette } = useAppearance()
const titleId = useId()
const panel = ref<HTMLElement | null>(null)
const token = Symbol('dialog')
let returnTo: HTMLElement | null = null

const close = () => { open.value = false }

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !event.isComposing && stack.at(-1) === token) {
    event.preventDefault()
    close()
  }
}

const focusFirst = () => {
  const root = panel.value
  if (!root) return
  const field = 'input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
  // The mark may sit on a component's wrapper, such as a picker's, rather than on the field itself.
  const marked = root.querySelector<HTMLElement>('[data-autofocus]')
  const target = (marked?.matches(`${field}, button, a[href]`) ? marked : marked?.querySelector<HTMLElement>(field))
    ?? root.querySelector<HTMLElement>(`.overflow-y-auto :is(${field})`)
  target?.focus({ preventScroll: true })
}

const restoreFocus = () => {
  if (returnTo?.isConnected) returnTo.focus({ preventScroll: true })
  returnTo = null
}

const release = () => {
  const index = stack.indexOf(token)
  if (index < 0) return
  stack.splice(index, 1)
  window.removeEventListener('keydown', onKeydown)
  if (!stack.length) document.body.style.overflow = ''
}

watch(open, async (value) => {
  if (!import.meta.client) return
  if (value) {
    if (stack.includes(token)) return
    returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    stack.push(token)
    window.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
    await nextTick()
    focusFirst()
  } else {
    release()
  }
}, { immediate: true })

onBeforeUnmount(release)
</script>
