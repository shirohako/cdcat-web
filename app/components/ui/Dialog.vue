<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0"
      @after-leave="restoreFocus"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" @mousedown.self="close">
        <div class="pointer-events-none absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.97]"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.97]"
        >
          <component
            :is="as"
            v-if="open"
            ref="panel"
            class="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card text-body shadow-overlay ring-1 ring-line sm:max-h-[88vh] sm:rounded-2xl"
            :class="SIZES[size]"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :novalidate="as === 'form' || undefined"
            @submit.prevent="emit('submit')"
          >
            <div class="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" aria-hidden="true" />
            <header class="flex shrink-0 items-start gap-3 px-5 pb-3 pt-3 sm:pt-5">
              <UiIconTile v-if="icon" :icon="icon" :tone="tone" />
              <div class="min-w-0 flex-1 pt-0.5">
                <h2 :id="titleId" class="truncate text-base font-bold leading-6 text-title">{{ title }}</h2>
                <p v-if="description" class="mt-0.5 text-xs leading-5 text-meta">{{ description }}</p>
              </div>
              <slot name="actions" />
              <UiIconButton icon="lucide:x" :label="$t('common.close')" size="sm" class="-mr-1.5 -mt-0.5" @click="close" />
            </header>
            <div class="min-h-0 overflow-y-auto px-5 pb-5 pt-1"><slot /></div>
            <footer v-if="$slots.footer" class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-sunken px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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

/** Open dialogs, innermost last: Escape closes only the top one, and the page scrolls again once all are closed. */
const stack: symbol[] = []
</script>

<script setup lang="ts">
/**
 * A dialog: centred on wide screens, a sheet from the bottom on phones. With `as="form"` the body is a form, so a
 * `type="submit"` button in the footer (or Enter in a text field) emits `submit`. Focus moves to the field marked
 * `data-autofocus`, else the first field, and goes back where it was on close. The `actions` slot sits left of the
 * close button.
 */
withDefaults(defineProps<{
  title: string
  description?: string
  icon?: string | Component
  tone?: UiTone
  size?: 'sm' | 'md' | 'lg'
  as?: 'form' | 'div'
}>(), { description: undefined, icon: undefined, tone: 'primary', size: 'md', as: 'div' })

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ submit: [] }>()

const SIZES = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-3xl' }

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
  const target = (marked?.matches(field) ? marked : marked?.querySelector<HTMLElement>(field))
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
