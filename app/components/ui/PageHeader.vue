<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/** The title block at the top of a page: vivia's large title behind a bar, an optional way back, actions on the right. */
withDefaults(defineProps<{
  title: string
  subtitle?: string
  back?: { to: RouteLocationRaw, label: string }
}>(), { subtitle: undefined, back: undefined })
</script>

<template>
  <header class="flex flex-wrap items-end gap-x-6 gap-y-3">
    <div class="min-w-0 flex-1">
      <div v-if="back" class="mb-2 text-sm text-meta">
        <UiLink :to="back.to" muted class="inline-flex items-center gap-1">
          <Icon name="lucide:arrow-left" class="size-4" />
          {{ back.label }}
        </UiLink>
      </div>
      <h1 class="flex items-center gap-3 text-[28px] font-bold leading-tight tracking-tight text-title md:text-[32px]">
        <span class="h-[0.62em] w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        <span class="min-w-0">{{ title }}</span>
      </h1>
      <p v-if="subtitle" class="mt-2 text-sm text-meta">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
