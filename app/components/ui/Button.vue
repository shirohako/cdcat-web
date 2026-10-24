<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'

/**
 * A button, or a link that looks like one when `to` or `href` is given. The variants are the .btn primitives in
 * assets/css/ui.css; `pressed` marks a toggle that is on. While `loading`, a spinner stands in for the icon and the
 * button can't be pressed again.
 */
const props = withDefaults(defineProps<{
  variant?: 'default' | 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  to?: RouteLocationRaw
  href?: string
  type?: 'button' | 'submit' | 'reset'
  icon?: string | Component
  iconRight?: string | Component
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
  // Left out unless given, so plain buttons don't announce themselves as toggles.
  pressed: undefined,
})

const VARIANTS = { default: '', primary: 'btn-primary', ghost: 'btn-ghost', outline: 'btn-outline', danger: 'btn-error' }
const SIZES = { xs: 'btn-xs', sm: 'btn-sm', md: '' }
const ICON_SIZES = { xs: 'size-3.5', sm: 'size-4', md: 'size-4' }

// A disabled link renders as a disabled button, so it can't be followed.
const isLink = computed(() => Boolean(props.to || props.href) && !props.disabled)
</script>

<template>
  <component
    :is="isLink ? NuxtLink : 'button'"
    :to="isLink ? (to ?? href) : undefined"
    :type="isLink ? undefined : type"
    :disabled="isLink ? undefined : disabled || loading"
    :aria-pressed="pressed"
    :aria-busy="loading || undefined"
    class="btn"
    :class="[VARIANTS[variant], SIZES[size], { 'w-full': block }]"
  >
    <UiSpinner v-if="loading" size="xs" />
    <UiIcon v-else-if="icon" :icon="icon" class="shrink-0" :class="ICON_SIZES[size]" />
    <slot />
    <UiIcon v-if="iconRight" :icon="iconRight" class="shrink-0" :class="ICON_SIZES[size]" />
  </component>
</template>
