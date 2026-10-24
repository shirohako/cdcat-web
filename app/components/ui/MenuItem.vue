<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { NuxtLink } from '#components'
import { MENU_CLOSE } from './Menu.vue'

/** A row in a UiMenu: a link with `to`, else a button. Choosing it closes the menu. */
withDefaults(defineProps<{
  to?: RouteLocationRaw
  icon?: string | Component
  danger?: boolean
  active?: boolean
  disabled?: boolean
}>(), { to: undefined, icon: undefined })

const emit = defineEmits<{ click: [event: MouseEvent] }>()
const close = inject(MENU_CLOSE, () => {})

const choose = (event: MouseEvent) => {
  emit('click', event)
  close()
}
</script>

<template>
  <component
    :is="to && !disabled ? NuxtLink : 'button'"
    :to="to && !disabled ? to : undefined"
    :type="to && !disabled ? undefined : 'button'"
    :disabled="to && !disabled ? undefined : disabled"
    role="menuitem"
    class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-45"
    :class="danger
      ? 'text-danger hover:bg-danger/10'
      : active ? 'bg-primary/15 font-semibold text-primary' : 'text-body hover:bg-ghost-hover hover:text-title'"
    @click="choose"
  >
    <UiIcon v-if="icon" :icon="icon" class="size-4 shrink-0" />
    <span class="min-w-0 flex-1 truncate">
      <slot />
    </span>
    <slot name="trailing" />
  </component>
</template>
