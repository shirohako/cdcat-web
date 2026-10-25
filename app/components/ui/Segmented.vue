<script setup lang="ts" generic="T extends string | number">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

export interface UiSegmentedItem<V> {
  value: V
  label: string
  icon?: string | Component
  count?: number
  /** Makes the option a link (the terms/privacy switch); the page then sets the value from the route. */
  to?: RouteLocationRaw
  disabled?: boolean
}

/**
 * A switch between two to four options of one thing: dark or light, terms or privacy, albums or tracks. A thumb in
 * the theme colour glides under the chosen option (sized to it, so labels may differ in length) and gives a small
 * squash as it lands; the chosen option's icon pops. Arrow keys move the choice, as in a radio group
 * (`semantics="tab"` for tabs).
 *
 * The thumb is placed from measured offsets, so until the component has mounted the chosen option paints its own
 * background instead: the server-rendered page already shows the choice, and nothing moves when the thumb takes over.
 * Link options move the thumb on the click, while the next page is still on its way.
 */
const props = withDefaults(defineProps<{
  items: UiSegmentedItem<T>[]
  size?: 'sm' | 'md' | 'lg'
  /** Fill the width, every option equally wide. */
  block?: boolean
  label?: string
  semantics?: 'radio' | 'tab'
}>(), { size: 'md', block: false, label: undefined, semantics: 'radio' })

const model = defineModel<T>()

const track = useTemplateRef<HTMLElement>('track')
const thumbEl = useTemplateRef<HTMLElement>('thumbEl')
const pending = ref<T | null>(null)
const shown = computed(() => pending.value ?? model.value)
watch(model, () => { pending.value = null })

const asLinks = computed(() => props.items.some(item => item.to))
const options = () => [...(track.value?.querySelectorAll<HTMLElement>(':scope > [data-option]') ?? [])]

// Measured place of the thumb; `measured` turns the thumb on.
const thumb = reactive({ left: 0, width: 0 })
const measured = ref(false)
const interacted = ref(false)

function measure() {
  const index = props.items.findIndex(item => item.value === shown.value)
  const option = options()[index]
  if (!option) return
  thumb.left = option.offsetLeft
  thumb.width = option.offsetWidth
  measured.value = true
}

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(measure)
  if (track.value) resizeObserver.observe(track.value)
  document.fonts?.ready.then(measure)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

// After the DOM update: the chosen label turns bold, which changes its width.
watch(shown, () => {
  measure()
  // Restart the landing squash even when the choice changes again mid-way.
  const element = thumbEl.value
  if (!element) return
  element.classList.remove('is-landing')
  void element.offsetWidth
  element.classList.add('is-landing')
}, { flush: 'post' })
watch(() => props.items.map(item => item.label).join('\n'), () => nextTick(measure))

function choose(item: UiSegmentedItem<T>) {
  if (item.disabled) return
  interacted.value = true
  if (item.to) pending.value = item.value
  else model.value = item.value
}

/** Arrow keys move the choice and the focus together; Home and End go to the ends. */
function onKeydown(event: KeyboardEvent) {
  if (asLinks.value) return
  const enabled = props.items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled)
  const at = enabled.findIndex(({ item }) => item.value === model.value)
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  let next: number | undefined
  if (step !== undefined) next = (at + step + enabled.length) % enabled.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = enabled.length - 1
  const target = next === undefined ? undefined : enabled[next]
  if (!target) return
  event.preventDefault()
  choose(target.item)
  options()[target.index]?.focus()
}

// `pad` is the track's padding, which the thumb keeps above and below it.
const SIZES = {
  sm: { pad: '3px', option: 'h-7 gap-1.5 px-3 text-xs', icon: 'size-3.5' },
  md: { pad: '3px', option: 'h-8 gap-2 px-3.5 text-sm', icon: 'size-4' },
  lg: { pad: '4px', option: 'h-10 gap-2 px-4 text-sm', icon: 'size-4' },
}

const optionRole = computed(() => (asLinks.value ? undefined : props.semantics))
const isOn = (item: UiSegmentedItem<T>) => item.value === shown.value
</script>

<template>
  <component
    :is="asLinks ? 'nav' : 'div'"
    ref="track"
    class="segmented relative isolate rounded-lg"
    :class="block ? 'grid w-full' : 'inline-flex max-w-full'"
    :style="{ '--pad': SIZES[size].pad, 'padding': SIZES[size].pad, 'gridTemplateColumns': block ? `repeat(${items.length}, minmax(0, 1fr))` : undefined }"
    :role="asLinks ? undefined : semantics === 'tab' ? 'tablist' : 'radiogroup'"
    :aria-label="label"
    @keydown="onKeydown"
  >
    <span
      v-if="measured"
      ref="thumbEl"
      class="thumb absolute rounded-md"
      :style="{ translate: `${thumb.left}px 0`, width: `${thumb.width}px` }"
      aria-hidden="true"
    />
    <component
      :is="item.to && !item.disabled ? NuxtLink : 'button'"
      v-for="item in items"
      :key="item.value"
      data-option
      :to="item.to && !item.disabled ? item.to : undefined"
      :type="item.to && !item.disabled ? undefined : 'button'"
      :role="optionRole"
      :aria-checked="optionRole === 'radio' ? isOn(item) : undefined"
      :aria-selected="optionRole === 'tab' ? isOn(item) : undefined"
      :aria-current="item.to && item.value === model ? 'page' : undefined"
      :tabindex="asLinks ? undefined : isOn(item) ? 0 : -1"
      :disabled="item.to && !item.disabled ? undefined : item.disabled"
      class="option relative flex min-w-0 items-center justify-center rounded-md font-medium whitespace-nowrap"
      :class="[SIZES[size].option, {
        'is-on': isOn(item),
        'is-painted': isOn(item) && !measured,
        'is-popping': isOn(item) && interacted,
      }]"
      @click="choose(item)"
    >
      <UiIcon v-if="item.icon" :icon="item.icon" class="icon shrink-0" :class="SIZES[size].icon" />
      <span class="truncate">{{ item.label }}</span>
      <span v-if="item.count !== undefined" class="count tabular-nums">{{ item.count }}</span>
    </component>
  </component>
</template>

<style scoped>
/* The track is just a hairline, drawn inside so it doesn't add to the size; the choice is the theme colour itself. */
.segmented {
  box-shadow: inset 0 0 0 1px var(--line);
}

.thumb,
.option.is-painted {
  background-color: var(--primary);
}

.thumb {
  inset-block: var(--pad);
  left: 0;
  transition: translate 380ms cubic-bezier(0.22, 1, 0.36, 1), width 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

.thumb.is-landing {
  animation: land 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* The colour changes a touch slower than the thumb starts moving, so the text never sits unreadable on the track. */
.option {
  color: var(--meta);
  transition: color 220ms ease-out, background-color 150ms ease-out;
}

.option:hover:not(:disabled, .is-on) {
  background-color: var(--ghost-hover);
  color: var(--title);
}

.option.is-on {
  color: var(--on-primary);
  font-weight: 600;
}

.option:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* In the title colour, so it shows on the theme-coloured thumb as well as on the track. */
.option:focus-visible {
  outline: 2px solid var(--title);
  outline-offset: -3px;
}

.option.is-popping .icon {
  animation: pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.count {
  opacity: 0.65;
}

@keyframes land {
  45% { scale: 1.05 0.9; }
}

@keyframes pop {
  from {
    scale: 0.6;
    rotate: -25deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .thumb {
    transition: none;
  }

  .thumb.is-landing,
  .option.is-popping .icon {
    animation: none;
  }
}
</style>
