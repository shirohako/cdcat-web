<script setup lang="ts">
/**
 * 开始之前: a new album's way from the search to approval, five steps in a row (a column on phones). The fourth, live
 * but awaiting review, wears the pending badge the album page shows.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const STEPS = [
  { key: 'search', icon: 'lucide:search', shift: 0 },
  { key: 'fill', icon: 'lucide:square-pen', shift: 50 },
  { key: 'submit', icon: 'lucide:send', shift: 100 },
  { key: 'live', icon: 'lucide:globe', shift: 150 },
  { key: 'approved', icon: 'lucide:badge-check', shift: 200 },
]
</script>

<template>
  <ol class="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0" aria-hidden="true">
    <template v-for="(step, index) in STEPS" :key="step.key">
      <li class="accent flex min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-card p-2.5 ring-1 ring-line sm:flex-col sm:text-center" :style="{ '--shift': step.shift }">
        <span class="relative grid size-9 shrink-0 place-items-center rounded-full bg-(--accent-soft) text-(--accent)">
          <Icon :name="step.icon" class="size-4.5" />
          <span class="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-(--accent) font-mono text-[9px] font-bold text-(--on-accent) ring-2 ring-card">{{ index + 1 }}</span>
        </span>
        <span class="min-w-0">
          <span class="block text-xs font-semibold text-title">{{ text[step.key] }}</span>
          <span class="mt-0.5 block text-[11px] leading-4 text-meta">{{ text[`${step.key}_note`] }}</span>
          <span v-if="step.key === 'live'" class="mt-1 inline-flex rounded-full bg-warning/15 px-1.5 py-px text-[10px] font-semibold text-warning">{{ t('pending.badge') }}</span>
        </span>
      </li>
      <li v-if="index < STEPS.length - 1" class="hidden w-5 shrink-0 items-center justify-center text-faint sm:flex" role="presentation">
        <Icon name="lucide:chevron-right" class="size-4" />
      </li>
    </template>
  </ol>
</template>
