<script setup lang="ts">
import type { Component } from 'vue'

type Tone = 'info' | 'success' | 'warning' | 'danger'

/**
 * A notice on a tint of its status colour. `icon` replaces the tone's icon (false hides it); `dismissible` adds a
 * close button that emits `dismiss`; `compact` is a one-line notice. Danger notices are announced at once
 * (role="alert").
 */
const props = withDefaults(defineProps<{
  tone?: Tone
  title?: string
  icon?: string | Component | false
  dismissible?: boolean
  compact?: boolean
}>(), { tone: 'info', title: undefined, icon: undefined })

const emit = defineEmits<{ dismiss: [] }>()

const TONES: Record<Tone, { box: string, accent: string, icon: string }> = {
  info: { box: 'border-info/25 bg-info/10', accent: 'text-info', icon: 'lucide:info' },
  success: { box: 'border-success/25 bg-success/10', accent: 'text-success', icon: 'lucide:circle-check' },
  warning: { box: 'border-warning/25 bg-warning/10', accent: 'text-warning', icon: 'lucide:triangle-alert' },
  danger: { box: 'border-danger/25 bg-danger/10', accent: 'text-danger', icon: 'lucide:circle-alert' },
}

const shownIcon = computed(() => props.icon === false ? null : props.icon ?? TONES[props.tone].icon)
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-xl border text-sm leading-6 text-body"
    :class="[TONES[tone].box, compact ? 'px-3 py-2' : 'px-4 py-3']"
    :role="tone === 'danger' ? 'alert' : 'status'"
  >
    <UiIcon v-if="shownIcon" :icon="shownIcon" class="mt-1 size-4 shrink-0" :class="TONES[tone].accent" />
    <div class="min-w-0 flex-1">
      <p v-if="title" class="font-semibold" :class="TONES[tone].accent">{{ title }}</p>
      <div class="wrap-break-word"><slot /></div>
      <div v-if="$slots.actions" class="mt-2 flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <UiButton v-if="dismissible" variant="ghost" icon="lucide:x" :label="$t('common.close')" size="xs" class="-mr-1.5 shrink-0" @click="emit('dismiss')" />
  </div>
</template>
