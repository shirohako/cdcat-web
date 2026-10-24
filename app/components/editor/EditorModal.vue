<template>
  <UiDialog
    v-model="open"
    :title="title"
    :description="description"
    :icon="icon"
    :tone="TONES[tone]"
    :size="wide ? 'lg' : 'md'"
    :as="as"
    @submit="emit('submit')"
  >
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { UiTone } from '~/components/ui/IconTile.vue'

type Tone = 'blue' | 'sky' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'gray'

/**
 * An editor dialog: UiDialog with the props the editors were written against. The body is a form, so a
 * `type="submit"` button in the footer (or Enter in a text field) emits `submit`; `as="div"` is for dialogs that hold
 * forms of their own. The `actions` slot sits left of the close button.
 */
withDefaults(defineProps<{ title: string, description?: string, icon?: Component, tone?: Tone, wide?: boolean, as?: 'form' | 'div' }>(), { description: undefined, icon: undefined, tone: 'blue', as: 'form' })
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ submit: [] }>()

// The theme has one accent colour; a tone keeps its own colour only where it means something.
const TONES: Record<Tone, UiTone> = {
  blue: 'primary',
  sky: 'primary',
  indigo: 'primary',
  purple: 'primary',
  emerald: 'success',
  amber: 'warning',
  rose: 'danger',
  gray: 'neutral',
}
</script>
