<script setup lang="ts">
import { DEFAULT_HUE, HUE_PRESETS } from '~/composables/useAppearance'

/**
 * The navbar's appearance panel: dark or light, and the theme colour, picked from vivia's presets or anywhere on the
 * hue slider. Everything applies at once; the slider saves when it is let go.
 */
const { theme, hue, setTheme, previewHue, setHue, resetHue } = useAppearance()

const { t } = useI18n()
const themes = computed(() => [
  { value: 'dark' as const, label: t('appearance.dark'), icon: 'lucide:moon' },
  { value: 'light' as const, label: t('appearance.light'), icon: 'lucide:sun' },
])

// The slider's track shows the theme colour at every hue, as the swatches draw it.
const track = `linear-gradient(to right, ${Array.from({ length: 13 }, (_, index) => `oklch(0.75 0.14 ${index * 30})`).join(', ')})`

const sliderValue = (event: Event) => Number((event.target as HTMLInputElement).value)
</script>

<template>
  <div class="w-72 p-4">
    <p class="text-xs font-semibold tracking-wide text-meta">{{ $t('appearance.title') }}</p>
    <UiSegmented
      :model-value="theme"
      :items="themes"
      :label="$t('appearance.title')"
      block
      class="mt-2.5"
      @update:model-value="value => value && setTheme(value)"
    />

    <div class="mt-5 flex items-center justify-between">
      <p class="text-sm font-semibold text-title">{{ $t('appearance.color') }}</p>
      <button v-if="hue !== DEFAULT_HUE" type="button" class="link text-xs font-medium" @click="resetHue">
        {{ $t('appearance.reset') }}
      </button>
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="preset in HUE_PRESETS"
        :key="preset"
        type="button"
        class="size-6 rounded-md transition-transform duration-150 ease-out hover:scale-110"
        :class="{ 'ring-2 ring-title ring-offset-2 ring-offset-popover': preset === hue }"
        :style="{ backgroundColor: `oklch(0.75 0.14 ${preset})` }"
        :aria-label="$t('appearance.preset', { hue: preset })"
        :aria-pressed="preset === hue"
        @click="setHue(preset)"
      />
    </div>
    <input
      type="range"
      min="0"
      max="360"
      step="5"
      :value="hue"
      class="appearance-hue mt-4 w-full"
      :style="{ backgroundImage: track }"
      :aria-label="$t('appearance.color')"
      @input="previewHue(sliderValue($event))"
      @change="setHue(sliderValue($event))"
    >
    <p class="mt-2 text-xs tabular-nums text-meta">{{ $t('appearance.hue', { hue }) }}</p>
  </div>
</template>

<style scoped>
/* vivia's slider: a thin rounded track and a narrow bar of a thumb in the theme colour. */
.appearance-hue {
  height: 6px;
  appearance: none;
  border-radius: 3px;
  cursor: pointer;
}

.appearance-hue::-webkit-slider-thumb {
  width: 6px;
  height: 20px;
  appearance: none;
  border-radius: 3px;
  background: var(--primary);
  box-shadow: 0 0 0 2px var(--popover);
}

.appearance-hue::-moz-range-thumb {
  width: 6px;
  height: 20px;
  border: 0;
  border-radius: 3px;
  background: var(--primary);
  box-shadow: 0 0 0 2px var(--popover);
}
</style>
