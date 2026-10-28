<script setup lang="ts">
import type { Component, FunctionalComponent } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink, UiTooltip } from '#components'

/**
 * The site's one button, or a link that looks like one when `to` or `href` is given. The variants are the .btn
 * primitives in assets/css/ui.css; every one but `ghost` has a fill or a border at rest, so it reads as something to
 * press:
 * - `default`: the light fill, for most actions (取消, 编辑, 更多 …)
 * - `primary`: the theme colour, for the main action of a form or dialog
 * - `outline`: a border instead of a fill, where the fill would melt into the surface
 * - `danger`: solid red, for confirming something destructive
 * - `danger-soft`: red on a red tint, for destructive actions beside others (删除, 撤回, 移除)
 * - `add`: the dashed, tinted "add …" button of the editors
 * - `ghost`: no fill until hovered. Only for the agreed exceptions: navbar icons, editor toolbars, the close × of
 *   dialogs, drawers and notices, and icons inside an input.
 *
 * Give `label` (and no text) for an icon-only button: it is square (`round` for a circle), `label` names it for screen
 * readers and shows in a UiTooltip, unless `tooltip` gives other text for that (e.g. a shortcut). `iconClass` replaces
 * the icon's size, to even out glyphs that look bigger or smaller than their neighbours. `pressed` marks a toggle that
 * is on. While `loading`, a spinner stands in for the icon and the button can't be pressed again. Attributes go to the
 * button.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  variant?: 'default' | 'primary' | 'outline' | 'danger' | 'danger-soft' | 'add' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  to?: RouteLocationRaw
  href?: string
  type?: 'button' | 'submit' | 'reset'
  icon?: string | Component
  iconRight?: string | Component
  iconClass?: string
  /** Icon-only: the button's name, for screen readers and its tooltip. */
  label?: string
  tooltip?: string
  round?: boolean
  loading?: boolean
  disabled?: boolean
  block?: boolean
  pressed?: boolean
}>(), {
  variant: 'default',
  size: 'md',
  to: undefined,
  href: undefined,
  type: 'button',
  icon: undefined,
  iconRight: undefined,
  iconClass: undefined,
  label: undefined,
  tooltip: undefined,
  // Left out unless given, so plain buttons don't announce themselves as toggles.
  pressed: undefined,
})

const VARIANTS = {
  'default': '',
  'primary': 'btn-primary',
  'outline': 'btn-outline',
  'danger': 'btn-error',
  'danger-soft': 'btn-danger-soft',
  'add': 'btn-add',
  'ghost': 'btn-ghost',
}
const SIZES = { xs: 'btn-xs', sm: 'btn-sm', md: '', lg: 'btn-lg' }
// Icons beside text stay at the text's size; alone, they fill more of the square.
const ICON_SIZES = { xs: 'size-3.5', sm: 'size-4', md: 'size-4', lg: 'size-5' }
const SOLO_ICON_SIZES = { xs: 'size-3.5', sm: 'size-4', md: 'size-5', lg: 'size-5' }

// A disabled link renders as a disabled button, so it can't be followed.
const isLink = computed(() => Boolean(props.to || props.href) && !props.disabled)
const iconOnly = computed(() => Boolean(props.label))
const iconSize = computed(() => props.iconClass ?? (iconOnly.value ? SOLO_ICON_SIZES : ICON_SIZES)[props.size])

/** Stands in for UiTooltip around buttons with nothing to show, so they get no wrapper. */
const Bare: FunctionalComponent<{ text?: string }> = (_, { slots }) => slots.default?.()
Bare.props = ['text']
</script>

<template>
  <component :is="tooltip || label ? UiTooltip : Bare" :text="tooltip ?? label">
    <component
      :is="isLink ? NuxtLink : 'button'"
      :to="isLink ? (to ?? href) : undefined"
      :type="isLink ? undefined : type"
      :disabled="isLink ? undefined : disabled || loading"
      :aria-pressed="pressed"
      :aria-busy="loading || undefined"
      :aria-label="label"
      class="btn"
      :class="[VARIANTS[variant], SIZES[size], { 'btn-square': iconOnly, 'btn-circle': iconOnly && round, 'w-full': block }]"
      v-bind="$attrs"
    >
      <UiSpinner v-if="loading" size="xs" />
      <UiIcon v-else-if="icon" :icon="icon" class="shrink-0" :class="iconSize" />
      <slot />
      <UiIcon v-if="iconRight" :icon="iconRight" class="shrink-0" :class="iconSize" />
    </component>
  </component>
</template>
