<script setup lang="ts">
import type { Component } from 'vue'

/**
 * A text input on the .input primitive. Attributes such as type, placeholder or id go to the <input>; with an `icon`
 * the input sits in a wrapper, which takes the class and style instead.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  size?: 'xs' | 'sm' | 'md'
  invalid?: boolean
  icon?: string | Component
}>(), { size: 'md', icon: undefined })

const model = defineModel<string | number | null>()

const attrs = useAttrs()
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

const SIZES = { xs: 'input-xs', sm: 'input-sm', md: '' }
const ICON_OFFSETS = { xs: 'pl-7', sm: 'pl-8', md: 'pl-9' }
const ICON_POSITIONS = { xs: 'left-2 size-3.5', sm: 'left-2.5 size-4', md: 'left-3 size-4' }
</script>

<template>
  <div v-if="icon" class="relative" :class="attrs.class" :style="attrs.style">
    <UiIcon :icon="icon" class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-faint" :class="ICON_POSITIONS[size]" />
    <input
      v-model="model"
      v-bind="inputAttrs"
      class="input w-full"
      :class="[SIZES[size], ICON_OFFSETS[size], { 'input-error': invalid }]"
      :aria-invalid="invalid || undefined"
    >
  </div>
  <input
    v-else
    v-model="model"
    v-bind="attrs"
    class="input"
    :class="[SIZES[size], { 'input-error': invalid }]"
    :aria-invalid="invalid || undefined"
  >
</template>
