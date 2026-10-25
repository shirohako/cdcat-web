<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

/**
 * A square button that shows only an icon. `label` names it for screen readers and shows in a UiTooltip, unless
 * `tooltip` gives other text for that (e.g. a shortcut). `iconClass` replaces the icon's size, to even out glyphs that
 * look bigger or smaller than their neighbours at the same size. Attributes go to the button.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  icon: string | Component
  label: string
  tooltip?: string
  iconClass?: string
  variant?: 'default' | 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  to?: RouteLocationRaw
  pressed?: boolean
  disabled?: boolean
  loading?: boolean
  round?: boolean
}>(), { tooltip: undefined, iconClass: undefined, variant: 'ghost', size: 'md', to: undefined, pressed: undefined })

const VARIANTS = { default: '', primary: 'btn-primary', ghost: 'btn-ghost', outline: 'btn-outline', danger: 'btn-error' }
const SIZES = { xs: 'btn-xs', sm: 'btn-sm', md: '' }
const ICON_SIZES = { xs: 'size-3.5', sm: 'size-4', md: 'size-5' }
</script>

<template>
  <UiTooltip :text="tooltip ?? label">
    <component
      :is="to && !disabled ? NuxtLink : 'button'"
      :to="to && !disabled ? to : undefined"
      :type="to && !disabled ? undefined : 'button'"
      :disabled="to && !disabled ? undefined : disabled || loading"
      :aria-pressed="pressed"
      :aria-label="label"
      class="btn btn-square"
      :class="[VARIANTS[variant], SIZES[size], { 'btn-circle': round }]"
      v-bind="$attrs"
    >
      <UiSpinner v-if="loading" size="xs" />
      <UiIcon v-else :icon="icon" :class="iconClass ?? ICON_SIZES[size]" />
    </component>
  </UiTooltip>
</template>
