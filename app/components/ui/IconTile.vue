<script setup lang="ts">
import type { Component } from 'vue'

export type UiTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

/** An icon on a tinted square, for headings of dialogs, empty states and stat blocks. */
withDefaults(defineProps<{
  icon: string | Component
  tone?: UiTone
  size?: 'sm' | 'md' | 'lg'
}>(), { tone: 'primary', size: 'md' })

const TONES: Record<UiTone, string> = {
  neutral: 'bg-btn text-btn-content',
  primary: 'bg-primary/15 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  info: 'bg-info/15 text-info',
}
const SIZES = { sm: 'size-7 rounded-md', md: 'size-9 rounded-lg', lg: 'size-12 rounded-xl' }
const ICON_SIZES = { sm: 'size-3.5', md: 'size-[18px]', lg: 'size-6' }
</script>

<template>
  <span class="inline-grid shrink-0 place-items-center" :class="[TONES[tone], SIZES[size]]" aria-hidden="true">
    <UiIcon :icon="icon" :class="ICON_SIZES[size]" />
  </span>
</template>
