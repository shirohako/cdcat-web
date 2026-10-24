<script setup lang="ts">
import type { Component } from 'vue'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
type Variant = 'soft' | 'solid' | 'outline'

/**
 * A short status or category label. `overlay` is for badges drawn on pictures: a dark glass that reads the same in
 * both themes.
 */
withDefaults(defineProps<{
  tone?: Tone
  variant?: Variant | 'overlay'
  size?: 'xs' | 'sm' | 'md'
  icon?: string | Component
  dot?: boolean
}>(), { tone: 'neutral', variant: 'soft', size: 'sm', icon: undefined })

// Whole class strings, so Tailwind finds them.
const TONES: Record<Tone, Record<Variant, string>> = {
  neutral: { soft: 'bg-btn text-btn-content', solid: 'bg-title text-page', outline: 'text-body ring-1 ring-inset ring-line' },
  primary: { soft: 'bg-primary/15 text-primary', solid: 'bg-primary text-on-primary', outline: 'text-primary ring-1 ring-inset ring-primary/40' },
  success: { soft: 'bg-success/15 text-success', solid: 'bg-success text-on-primary', outline: 'text-success ring-1 ring-inset ring-success/40' },
  warning: { soft: 'bg-warning/15 text-warning', solid: 'bg-warning text-[oklch(0.22_0.04_65)]', outline: 'text-warning ring-1 ring-inset ring-warning/40' },
  danger: { soft: 'bg-danger/15 text-danger', solid: 'bg-danger text-on-primary', outline: 'text-danger ring-1 ring-inset ring-danger/40' },
  info: { soft: 'bg-info/15 text-info', solid: 'bg-info text-on-primary', outline: 'text-info ring-1 ring-inset ring-info/40' },
}
const OVERLAY = 'bg-scrim text-on-media backdrop-blur-sm'
const SIZES = { xs: 'h-4.5 gap-1 px-1.5 text-[10px]', sm: 'h-5 gap-1 px-2 text-[11px]', md: 'h-6 gap-1.5 px-2.5 text-xs' }
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center whitespace-nowrap rounded-md font-semibold leading-none"
    :class="[SIZES[size], variant === 'overlay' ? OVERLAY : TONES[tone][variant]]"
  >
    <span v-if="dot" class="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
    <UiIcon v-else-if="icon" :icon="icon" class="size-3 shrink-0" />
    <slot />
  </span>
</template>
