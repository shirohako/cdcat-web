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
        <div class="pointer-events-none absolute inset-0 bg-gray-950/40 backdrop-blur-[2px]" />
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.97]"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.97]"
        >
          <form
            v-if="open"
            ref="panel"
            class="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-gray-900/5 sm:max-h-[88vh] sm:rounded-2xl"
            :class="wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            novalidate
            @submit.prevent="emit('submit')"
          >
            <div class="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-200 sm:hidden" aria-hidden="true" />
            <header class="flex shrink-0 items-start gap-3 px-5 pb-3 pt-3 sm:pt-5">
              <span v-if="icon" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :class="TONES[tone]">
                <component :is="icon" :size="17" />
              </span>
              <div class="min-w-0 flex-1 pt-0.5">
                <h2 :id="titleId" class="truncate text-base font-semibold leading-6 text-gray-900">{{ title }}</h2>
                <p v-if="description" class="mt-0.5 text-xs leading-5 text-gray-500">{{ description }}</p>
              </div>
              <button type="button" class="-mr-1.5 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600" :aria-label="$t('common.close')" @click="close">
                <X :size="18" />
              </button>
            </header>
            <div class="min-h-0 overflow-y-auto px-5 pb-5 pt-1"><slot /></div>
            <footer v-if="$slots.footer" class="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <slot name="footer" />
            </footer>
          </form>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import type { Component } from 'vue'
import { X } from '@lucide/vue'

/** Open dialogs, innermost last: Escape closes only the top one, and the page scrolls again once all are closed. */
const stack: symbol[] = []
</script>

<script setup lang="ts">
type Tone = 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'gray'

/**
 * A dialog: centred on wide screens, a sheet from the bottom on phones. The body is a form, so a
 * `type="submit"` button in the footer (or Enter in a text field) emits `submit`. Focus moves to
 * the field marked `data-autofocus`, else the first field, and goes back where it was on close.
 */
withDefaults(defineProps<{ title: string, description?: string, icon?: Component, tone?: Tone, wide?: boolean }>(), { description: undefined, icon: undefined, tone: 'blue' })
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ submit: [] }>()

const TONES: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
}

const titleId = useId()
const panel = ref<HTMLFormElement | null>(null)
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
