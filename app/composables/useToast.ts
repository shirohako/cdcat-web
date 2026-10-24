import type { Component, InjectionKey, Ref } from 'vue'

export type ToastColor = 'primary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export interface ToastAction {
  label: string
  icon?: string | Component
  onClick?: (event?: MouseEvent) => void
  /** Whether the toast closes when the action is clicked. Defaults to true. */
  closeOnClick?: boolean
}

export interface Toast {
  id: string | number
  title?: string
  description?: string
  /** A Nuxt Icon name or an @lucide/vue component; each colour has a default. */
  icon?: string | Component | false
  color?: ToastColor
  /** `vertical` puts the actions under the text, `horizontal` beside the close button. */
  orientation?: 'vertical' | 'horizontal'
  actions?: ToastAction[]
  /** Milliseconds before it closes; 0 keeps it open. Defaults to the toaster's 5000. */
  duration?: number
  /** Show the close button. Defaults to true. */
  close?: boolean
  /** Show the bar counting down the duration. Defaults to true. */
  progress?: boolean
  onClick?: (toast: Toast) => void
  /** Runs once the toast has closed, by timeout or by hand. */
  onClose?: () => void
  /** @internal */
  open: boolean
  /** @internal Times an add() with the same id arrived while open; drives the pulse. */
  _duplicate?: number
  /** @internal */
  _animatedAt?: number
}

export type ToastInput = Partial<Omit<Toast, 'open' | '_duplicate' | '_animatedAt'>>

/** What each UiToast needs from UiToaster: whether timers are paused, and the default lifetime. */
export const TOASTER: InjectionKey<{ paused: Ref<boolean>, duration: Ref<number> }> = Symbol('ui-toaster')

/** The most toasts on screen; older ones leave first. */
export const TOAST_MAX = 5
// The slide-in and pulse animations of the toaster (main.css) last this long.
const ANIMATION_DURATION = 200

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

/**
 * The site's toasts, after Nuxt UI's: `add()` shows one (bottom right, stacked), `update()` changes one in place,
 * `remove()` closes it, `clear()` closes all. UiToaster in app.vue draws them. Adding a toast whose `id` is already
 * shown pulses that toast instead of stacking a copy. `showToast(message, type)` is the short form kept from the
 * earlier per-page toast.
 */
export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => [])

  const add = (input: ToastInput): Toast => {
    const toast: Toast = { id: generateId(), ...input, open: true }
    const index = toasts.value.findIndex(item => item.id === toast.id)
    if (index !== -1) {
      const existing = toasts.value[index]!
      const now = Date.now()
      // A pulse during the slide-in would cancel it, so it waits until that has finished.
      const animating = now - (existing._animatedAt ?? 0) < ANIMATION_DURATION
      toasts.value[index] = {
        ...existing,
        ...toast,
        _duplicate: animating ? existing._duplicate : (existing._duplicate ?? 0) + 1,
        _animatedAt: animating ? existing._animatedAt : now,
      }
      return toast
    }
    toasts.value = [...toasts.value, { ...toast, _animatedAt: Date.now() }].slice(-TOAST_MAX)
    return toast
  }

  const update = (id: string | number, input: Omit<ToastInput, 'id'>) => {
    const index = toasts.value.findIndex(item => item.id === id)
    if (index !== -1) toasts.value[index] = { ...toasts.value[index]!, ...input, open: true }
  }

  const remove = (id: string | number) => {
    const index = toasts.value.findIndex(item => item.id === id)
    if (index === -1) return
    const toast = toasts.value[index]!
    toasts.value[index] = { ...toast, open: false }
    toast.onClose?.()
    // Gone once its closing animation has played.
    setTimeout(() => {
      toasts.value = toasts.value.filter(item => item.id !== id || item.open)
    }, ANIMATION_DURATION)
  }

  const clear = () => {
    toasts.value = []
  }

  const TYPE_COLORS = { success: 'success', error: 'error', info: 'info' } as const
  /** A one-line toast: `showToast('已保存')`, `showToast('出错了', 'error')`. */
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') =>
    add({ title: message, color: TYPE_COLORS[type] })

  return { toasts, add, update, remove, clear, showToast }
}
