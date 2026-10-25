<script setup lang="ts">
import { HUE_PRESETS } from '~/composables/useAppearance'

/** The navbar's appearance panel: dark or light, and the theme colour, one of vivia's presets. Both apply at once. */
const { theme, hue, setTheme, setHue } = useAppearance()

const { t } = useI18n()
const themes = computed(() => [
  { value: 'dark' as const, label: t('appearance.dark'), icon: 'lucide:moon' },
  { value: 'light' as const, label: t('appearance.light'), icon: 'lucide:sun' },
])
</script>

<template>
  <div class="w-84 max-w-[calc(100vw-2rem)] p-4">
    <p class="text-xs font-semibold tracking-wide text-meta">{{ $t('appearance.title') }}</p>
    <UiSegmented
      :model-value="theme"
      :items="themes"
      :label="$t('appearance.title')"
      block
      class="mt-2.5"
      @update:model-value="value => value && setTheme(value)"
    />

    <p class="mt-5 text-sm font-semibold text-title">{{ $t('appearance.color') }}</p>
    <div class="mt-3 grid grid-cols-9 gap-2">
      <button
        v-for="preset in HUE_PRESETS"
        :key="preset"
        type="button"
        class="aspect-square rounded-md transition-transform duration-150 ease-out hover:scale-110"
        :class="{ 'ring-2 ring-title ring-offset-2 ring-offset-popover': preset === hue }"
        :style="{ backgroundColor: `oklch(0.75 0.14 ${preset})` }"
        :aria-label="$t('appearance.preset', { hue: preset })"
        :aria-pressed="preset === hue"
        @click="setHue(preset)"
      />
    </div>
  </div>
</template>
