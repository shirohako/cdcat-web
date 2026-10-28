<script setup lang="ts">
import type { ThemeColor } from '~/composables/useAppearance'
import { COLOR_PRESETS } from '~/composables/useAppearance'

/** The navbar's appearance panel: dark or light, and the theme colour, ink or one of vivia's presets. Both apply at once. */
const { theme, color, setTheme, setColor } = useAppearance()

const { t } = useI18n()
const themes = computed(() => [
  { value: 'dark' as const, label: t('appearance.dark'), icon: 'lucide:moon' },
  { value: 'light' as const, label: t('appearance.light'), icon: 'lucide:sun' },
])

/** A swatch: ink as it looks in the light theme, a hue as vivia shows it. */
const swatch = (preset: ThemeColor) => preset === 'ink' ? 'oklch(0.19 0.027 298)' : `oklch(0.75 0.14 ${preset})`
</script>

<template>
  <div class="p-4">
    <p class="text-xs font-semibold tracking-wide text-meta">{{ $t('appearance.title') }}</p>
    <UiSegmented
      :model-value="theme"
      :items="themes"
      :label="$t('appearance.title')"
      block
      class="mt-2.5"
      @update:model-value="value => value && setTheme(value)"
    />

    <p class="mt-5 text-xs font-semibold tracking-wide text-meta">{{ $t('appearance.color') }}</p>
    <!-- The chosen swatch gets a thin ring just off its edge, which the gaps leave room for. -->
    <div class="mt-2.5 grid grid-cols-10 gap-2">
      <button
        v-for="preset in COLOR_PRESETS"
        :key="preset"
        type="button"
        class="aspect-square rounded-md transition-transform duration-150 ease-out hover:scale-110"
        :class="preset === color ? 'ring-[1.5px] ring-title ring-offset-[1.5px] ring-offset-popover' : preset === 'ink' && 'ring-1 ring-inset ring-line'"
        :style="{ backgroundColor: swatch(preset) }"
        :aria-label="preset === 'ink' ? $t('appearance.ink') : $t('appearance.preset', { hue: preset })"
        :aria-pressed="preset === color"
        @click="setColor(preset)"
      />
    </div>
  </div>
</template>
