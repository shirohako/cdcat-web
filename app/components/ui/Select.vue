<script lang="ts">
import type { Component, ComponentPublicInstance } from 'vue'
import { autoUpdate, computePosition, flip, offset, shift, size as fitSize } from '@floating-ui/dom'

export type UiSelectValue = string | number | boolean | null

export interface UiSelectOption<V extends UiSelectValue = UiSelectValue> {
  value: V
  label: string
  disabled?: boolean
  icon?: string | Component
  /** Options with the same group are listed under its name, like <optgroup>. */
  group?: string
  /** Dim text at the end of the row, e.g. a code. */
  hint?: string
  /** More text the search matches besides the label and hint, e.g. other names. */
  keywords?: string
}
</script>

<script setup lang="ts" generic="T extends UiSelectValue">
/**
 * A select drawn by the site, not the browser: a field-style button and a list in the menu style, with the chosen
 * option in the theme colour. Keyboard: ↑↓ / Home / End move, Enter or Space picks, Esc or Tab closes, typing jumps
 * to a matching label. The list is teleported to <body> (or into the open modal <dialog> it sits in) and placed
 * with floating-ui, so cards with overflow hidden don't clip it and it flips above the field near the bottom of
 * the screen.
 *
 * With `searchable`, a field above the list filters it by label, hint and keywords, and keys other than ↑↓, Enter,
 * Esc and Tab go to that field.
 *
 * Attributes (class, id, aria-label …) go to the button. The `trigger` slot replaces the button (e.g. the filter
 * chips); it gets `open`, `selected`, `label`, `toggle` and `attrs`, which must be bound to its focusable element.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  options: UiSelectOption<T>[]
  placeholder?: string
  size?: 'xs' | 'sm' | 'md'
  invalid?: boolean
  disabled?: boolean
  /** Submitted with a surrounding form, as a native select's name would be. */
  name?: string
  searchable?: boolean
  searchPlaceholder?: string
}>(), { placeholder: '', size: 'md', name: undefined, searchPlaceholder: '' })

const model = defineModel<T>()
const emit = defineEmits<{ change: [value: T] }>()

const attrs = useAttrs()
const listId = useId()
const open = ref(false)
const active = ref(-1)
const trigger = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)
const search = ref<HTMLInputElement | null>(null)
const query = ref('')
let stopAutoUpdate: (() => void) | null = null
// Inside a modal <dialog> (top layer, the rest of the page inert) the list has to live in that dialog.
const layer = ref<HTMLElement | 'body'>('body')

const SIZES = { xs: 'select-xs', sm: 'select-sm', md: '' }

const selected = computed(() => props.options.find(option => option.value === model.value) ?? null)
const label = computed(() => selected.value?.label ?? props.placeholder)

/** What the list shows: every option, or those matching the search. */
const shown = computed(() => {
  const text = query.value.trim().toLowerCase()
  return text
    ? props.options.filter(option => [option.label, option.hint, option.keywords].some(words => words?.toLowerCase().includes(text)))
    : props.options
})
const selectedIndex = computed(() => shown.value.findIndex(option => option.value === model.value))

/** Group headings go before the first option of each group. */
const rows = computed(() => shown.value.map((option, index) => ({
  option,
  index,
  heading: option.group && option.group !== shown.value[index - 1]?.group ? option.group : null,
})))

const enabled = (index: number) => Boolean(shown.value[index]) && !shown.value[index]!.disabled

const step = (from: number, by: 1 | -1) => {
  for (let index = from + by; index >= 0 && index < shown.value.length; index += by) {
    if (enabled(index)) return index
  }
  return from
}

const scrollToActive = () => nextTick(() => {
  list.value?.querySelector<HTMLElement>(`[data-index="${active.value}"]`)?.scrollIntoView({ block: 'nearest' })
})

const place = () => {
  if (!trigger.value || !panel.value) return
  const reference = trigger.value
  const floating = panel.value
  void computePosition(reference, floating, {
    strategy: 'fixed',
    placement: 'bottom',
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      fitSize({
        padding: 8,
        apply({ rects, availableHeight }) {
          Object.assign(floating.style, {
            minWidth: `${Math.max(rects.reference.width, props.searchable ? 256 : 0)}px`,
            maxHeight: `${Math.max(120, Math.min(availableHeight, 320))}px`,
          })
        },
      }),
    ],
  }).then(({ x, y }) => {
    Object.assign(floating.style, { left: `${x}px`, top: `${y}px` })
  })
}

const show = async () => {
  if (props.disabled || open.value) return
  if (trigger.value) layer.value = floatingLayer(trigger.value)
  query.value = ''
  open.value = true
  active.value = selectedIndex.value >= 0 ? selectedIndex.value : step(-1, 1)
  await nextTick()
  if (trigger.value && panel.value) stopAutoUpdate = autoUpdate(trigger.value, panel.value, place)
  const focused = search.value ?? list.value
  focused?.focus({ preventScroll: true })
  scrollToActive()
}

const hide = (refocus = true) => {
  if (!open.value) return
  open.value = false
  stopAutoUpdate?.()
  stopAutoUpdate = null
  if (refocus) trigger.value?.focus({ preventScroll: true })
}

const toggle = () => (open.value ? hide() : show())

const choose = (index: number) => {
  if (!enabled(index)) return
  const value = shown.value[index]!.value
  const changed = value !== model.value
  model.value = value
  hide()
  if (changed) emit('change', value)
}

// Typing jumps to the next option whose label starts with what was typed in the last half second.
let typed = ''
let typedTimer: ReturnType<typeof setTimeout> | undefined
const typeahead = (key: string) => {
  clearTimeout(typedTimer)
  typed += key.toLowerCase()
  typedTimer = setTimeout(() => { typed = '' }, 500)
  const count = shown.value.length
  const start = typed.length === 1 ? active.value + 1 : active.value
  for (let offsetIndex = 0; offsetIndex < count; offsetIndex++) {
    const index = (Math.max(start, 0) + offsetIndex) % count
    if (enabled(index) && shown.value[index]!.label.toLowerCase().startsWith(typed)) {
      active.value = index
      scrollToActive()
      return
    }
  }
}

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    void show()
  }
}

const onPanelKeydown = (event: KeyboardEvent) => {
  // Keys stay here: a dialog around the select must not close on the same Escape.
  event.stopPropagation()
  // In the search field, Home, End, Space and letters edit the text.
  const typing = event.target === search.value
  switch (event.key) {
    case 'ArrowDown': event.preventDefault(); active.value = step(active.value, 1); scrollToActive(); break
    case 'ArrowUp': event.preventDefault(); active.value = step(active.value, -1); scrollToActive(); break
    case 'Home': if (!typing) { event.preventDefault(); active.value = step(-1, 1); scrollToActive() } break
    case 'End': if (!typing) { event.preventDefault(); active.value = step(shown.value.length, -1); scrollToActive() } break
    case 'Enter': event.preventDefault(); choose(active.value); break
    case ' ': if (!typing) { event.preventDefault(); choose(active.value) } break
    case 'Escape': event.preventDefault(); hide(); break
    case 'Tab': hide(false); break
    default:
      if (!typing && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) typeahead(event.key)
  }
}

watch(query, () => {
  active.value = selectedIndex.value >= 0 ? selectedIndex.value : step(-1, 1)
  scrollToActive()
})

const onPointerDown = (event: PointerEvent) => {
  const target = event.target as Node
  if (!trigger.value?.contains(target) && !panel.value?.contains(target)) hide(false)
}

watch(open, (value) => {
  if (!import.meta.client) return
  if (value) document.addEventListener('pointerdown', onPointerDown, true)
  else document.removeEventListener('pointerdown', onPointerDown, true)
})

const route = useRoute()
watch(() => route.fullPath, () => hide(false))

onBeforeUnmount(() => {
  stopAutoUpdate?.()
  clearTimeout(typedTimer)
  if (import.meta.client) document.removeEventListener('pointerdown', onPointerDown, true)
})

const triggerAttrs = computed(() => ({
  ...attrs,
  'aria-haspopup': 'listbox' as const,
  'aria-expanded': open.value,
  'aria-controls': open.value ? listId : undefined,
  'aria-invalid': props.invalid || undefined,
  'disabled': props.disabled || undefined,
  'onKeydown': onTriggerKeydown,
}))

const setTrigger = (element: Element | ComponentPublicInstance | null) => {
  trigger.value = element instanceof HTMLElement ? element : (element as ComponentPublicInstance | null)?.$el ?? null
}
</script>

<template>
  <slot name="trigger" :open="open" :selected="selected" :label="label" :toggle="toggle" :attrs="triggerAttrs" :set-ref="setTrigger">
    <button
      :ref="setTrigger"
      type="button"
      v-bind="triggerAttrs"
      class="select inline-flex items-center gap-2 bg-none pr-2.5 text-left"
      :class="[SIZES[size], { 'select-error': invalid }]"
      @click="toggle"
    >
      <UiIcon v-if="selected?.icon" :icon="selected.icon" class="size-4 shrink-0 text-meta" />
      <span class="min-w-0 flex-1 truncate" :class="{ 'text-faint': !selected }">{{ label }}</span>
      <!-- Turns over while the list is open. -->
      <Icon
        name="lucide:chevron-down"
        class="size-4 shrink-0 text-meta transition-transform duration-200 ease-out motion-reduce:transition-none"
        :class="{ 'rotate-180': open }"
      />
    </button>
  </slot>
  <input v-if="name" type="hidden" :name="name" :value="model ?? ''">

  <Teleport :to="layer">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="open"
        ref="panel"
        data-ui-layer
        class="fixed left-0 top-0 z-[80] flex flex-col overflow-hidden rounded-md bg-popover p-1 shadow-overlay ring-1 ring-line"
        @keydown="onPanelKeydown"
      >
        <input
          v-if="searchable"
          ref="search"
          v-model="query"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          :aria-controls="listId"
          :aria-activedescendant="active >= 0 ? `${listId}-${active}` : undefined"
          :aria-label="searchPlaceholder || undefined"
          :placeholder="searchPlaceholder"
          class="input input-sm mb-1 w-full shrink-0"
          autocomplete="off"
          spellcheck="false"
        >
        <!-- The padding sits outside the scrolling list, so its scrollbar stays clear of the rounded corners. -->
        <ul
          :id="listId"
          ref="list"
          role="listbox"
          tabindex="-1"
          :aria-activedescendant="active >= 0 ? `${listId}-${active}` : undefined"
          class="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain outline-none [&::-webkit-scrollbar]:w-2"
        >
          <li v-if="!rows.length" role="presentation" class="px-3 py-2 text-sm text-faint">{{ $t('common.no_matches') }}</li>
          <template v-for="row in rows" :key="row.index">
            <li v-if="row.heading" role="presentation" class="px-3 pb-1 pt-2.5 text-[11px] font-semibold tracking-wide text-faint">
              {{ row.heading }}
            </li>
            <li
              :id="`${listId}-${row.index}`"
              role="option"
              :data-index="row.index"
              :aria-selected="row.index === selectedIndex"
              :aria-disabled="row.option.disabled || undefined"
              class="flex cursor-pointer items-center gap-2.5 rounded-sm px-3 py-1.5 text-sm transition-colors duration-100 ease-out"
              :class="[
                row.option.disabled ? 'cursor-not-allowed opacity-45' : '',
                row.index === selectedIndex
                  ? (row.index === active ? 'bg-primary/20 font-semibold text-primary' : 'bg-primary/15 font-semibold text-primary')
                  : (row.index === active ? 'bg-ghost-hover text-title' : 'text-body'),
              ]"
              @pointermove="!row.option.disabled && (active = row.index)"
              @click="choose(row.index)"
            >
              <UiIcon v-if="row.option.icon" :icon="row.option.icon" class="size-4 shrink-0" />
              <span class="min-w-0 flex-1 truncate">{{ row.option.label }}</span>
              <span v-if="row.option.hint" class="shrink-0 font-mono text-[11px] text-faint">{{ row.option.hint }}</span>
              <Icon v-if="row.index === selectedIndex" name="lucide:check" class="size-4 shrink-0" />
            </li>
          </template>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>
