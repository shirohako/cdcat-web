<template>
  <div class="flex flex-wrap items-center gap-2 text-xs">
    <span class="text-meta">{{ t(`${scope}.examples`) }}</span>
    <UiTooltip v-for="(format, index) in formats" :key="format.key" placement="bottom-start" :delay="150" :group="`${scope}-examples`" class="w-[26rem] max-w-[calc(100vw-2rem)]">
      <span tabindex="0" class="inline-flex h-6 cursor-help items-center gap-1 rounded-md bg-btn px-2 font-medium text-body hover:bg-btn-hover">
        <Icon name="lucide:file-text" class="size-3.5 text-meta" />{{ t(`${scope}.example`, { n: index + 1 }) }}
        <span class="font-normal text-meta">· {{ t(`${scope}.${format.key}_title`) }}</span>
      </span>
      <template #content>
        <p class="text-xs font-semibold text-title">{{ t(`${scope}.${format.key}_title`) }}</p>
        <pre class="mt-1.5 whitespace-pre-wrap rounded-md bg-sunken px-2.5 py-2 font-mono text-[11px] leading-4 text-title">{{ format.text }}</pre>
        <p class="mt-2 text-[11px] font-semibold text-title">{{ t(`${scope}.handles`) }}</p>
        <ul class="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-body">
          <li v-for="point in t(`${scope}.${format.key}_points`).split('\n')" :key="point">{{ point }}</li>
        </ul>
      </template>
    </UiTooltip>
  </div>
</template>

<script setup lang="ts">
/**
 * The formats a paste dialog reads, as a row of examples; each shows its text and what it handles on hover. The words
 * come from `<scope>.examples`, `.example`, `.handles` and each format's `<scope>.<key>_title` / `<key>_points`.
 */
defineProps<{
  formats: ReadonlyArray<{ key: string, text: string }>
  scope: string
}>()

const { t } = useI18n()
</script>
