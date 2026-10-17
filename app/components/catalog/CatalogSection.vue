<template>
  <section class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <div class="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="tones[tone].bg">
        <component :is="icon" :size="16" :class="tones[tone].icon" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ title }}</h2>
      <div class="ml-auto flex items-center gap-2 text-xs text-gray-400">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

type Tone = 'blue' | 'indigo' | 'pink' | 'amber' | 'emerald' | 'purple' | 'sky' | 'gray' | 'rose'

withDefaults(defineProps<{
  title: string
  icon: Component
  tone?: Tone
}>(), {
  tone: 'gray',
})

const tones: Record<Tone, { bg: string, icon: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500' },
  pink: { bg: 'bg-pink-50', icon: 'text-pink-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-500' },
  sky: { bg: 'bg-sky-50', icon: 'text-sky-600' },
  gray: { bg: 'bg-gray-100', icon: 'text-gray-500' },
  rose: { bg: 'bg-rose-50', icon: 'text-rose-500' },
}
</script>
