<script setup lang="ts">
import type { Component } from 'vue'
import type { TracklistPrefs } from '~/utils/tracklistView'
import { Check } from '@lucide/vue'

export interface TracklistStyleOption {
  key: string
  label: string
  hint: string
  icon: Component
}

/**
 * The tracklist's settings: its style (a tile each; more styles wrap onto more rows) and the two hover cards, which
 * touch screens don't show since they can't hover. Changes apply at once, behind the dialog.
 */
defineProps<{ styles: TracklistStyleOption[], prefs: TracklistPrefs }>()
const emit = defineEmits<{ update: [patch: Partial<TracklistPrefs>] }>()

const open = defineModel<boolean>({ required: true })
const { t } = useI18n()
</script>

<template>
  <UiDialog v-model="open" size="sm" :title="t('album.tracklist.settings.title')" :description="t('album.tracklist.settings.description')">
    <p class="mb-2 text-xs font-semibold text-meta">{{ t('album.tracklist.settings.style') }}</p>
    <div role="radiogroup" :aria-label="t('album.tracklist.settings.style')" class="grid grid-cols-3 gap-2">
      <button
        v-for="style in styles"
        :key="style.key"
        type="button"
        role="radio"
        :aria-checked="prefs.style === style.key"
        class="relative grid justify-items-center gap-0.5 rounded-lg px-1.5 pb-2.5 pt-3 text-center transition-[box-shadow,background-color] duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        :class="prefs.style === style.key ? 'shadow-[inset_0_0_0_2px_var(--primary)]' : 'shadow-[inset_0_0_0_1px_var(--line)]'"
        @click="emit('update', { style: style.key })"
      >
        <UiIcon :icon="style.icon" class="mb-0.5 size-5" :class="prefs.style === style.key ? 'text-primary' : 'text-meta'" />
        <span class="text-[13px] font-semibold leading-[1.125rem] text-title">{{ style.label }}</span>
        <span class="text-[11px] leading-snug text-meta">{{ style.hint }}</span>
        <span v-if="prefs.style === style.key" class="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-on-primary" aria-hidden="true"><Check :size="11" :stroke-width="3" /></span>
      </button>
    </div>

    <div class="[@media(hover:none)]:hidden">
      <p class="mb-1 mt-5 text-xs font-semibold text-meta">{{ t('album.tracklist.settings.cards') }}</p>
      <div class="divide-y divide-line">
        <UiSwitch :model-value="prefs.trackCard" class="w-full flex-row-reverse justify-between py-2.5" @update:model-value="value => emit('update', { trackCard: Boolean(value) })">
          <span class="block text-[13.5px] font-semibold leading-5 text-title">{{ t('album.tracklist.settings.track_card') }}</span>
          <span class="block text-xs leading-[1.125rem] text-meta">{{ t('album.tracklist.settings.track_card_hint') }}</span>
        </UiSwitch>
        <UiSwitch :model-value="prefs.artistCard" class="w-full flex-row-reverse justify-between py-2.5" @update:model-value="value => emit('update', { artistCard: Boolean(value) })">
          <span class="block text-[13.5px] font-semibold leading-5 text-title">{{ t('album.tracklist.settings.artist_card') }}</span>
          <span class="block text-xs leading-[1.125rem] text-meta">{{ t('album.tracklist.settings.artist_card_hint') }}</span>
        </UiSwitch>
      </div>
    </div>

    <template #footer>
      <UiButton variant="primary" size="sm" @click="open = false">{{ t('album.tracklist.settings.done') }}</UiButton>
    </template>
  </UiDialog>
</template>
