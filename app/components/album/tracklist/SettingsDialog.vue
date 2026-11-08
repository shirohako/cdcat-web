<script setup lang="ts">
import type { Component } from 'vue'
import type { TracklistPrefs } from '~/utils/tracklistView'
import { Check } from '@lucide/vue'
import { CREDIT_LINK_STYLES } from '~/composables/useCreditLinks'

export interface TracklistStyleOption {
  key: string
  label: string
  hint: string
  icon: Component
}

/**
 * The tracklist's settings: its style (a tile each; more styles wrap onto more rows), how credited names show the part
 * that links (for the whole site), and the hover cards, which touch screens don't show since they can't hover.
 * Changes apply at once, behind the dialog.
 */
defineProps<{ styles: TracklistStyleOption[], prefs: TracklistPrefs }>()
const emit = defineEmits<{ update: [patch: Partial<TracklistPrefs>] }>()

const open = defineModel<boolean>({ required: true })
const { t } = useI18n()

// How credited names show the part that links: site-wide, not only the tracklist (useCreditLinks).
const { style: linkStyle, setStyle: setLinkStyle } = useCreditLinks()
const linkStyles = computed(() => CREDIT_LINK_STYLES.map(key => ({ key, label: t(`album.tracklist.settings.link_${key}`), hint: t(`album.tracklist.settings.link_${key}_hint`) })))
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
        <span class="text-13 font-semibold leading-[1.125rem] text-title">{{ style.label }}</span>
        <span class="text-11 leading-snug text-meta">{{ style.hint }}</span>
        <span v-if="prefs.style === style.key" class="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-on-primary" aria-hidden="true"><Check :size="11" :stroke-width="3" /></span>
      </button>
    </div>

    <p class="mb-0.5 mt-5 text-xs font-semibold text-meta">{{ t('album.tracklist.settings.links') }}</p>
    <p class="mb-2 text-xs leading-[1.125rem] text-meta">{{ t('album.tracklist.settings.links_hint') }}</p>
    <!-- One row each: a radio dot, the name and what it does, and a sample tag as the tracklist draws it (a printed name,
         only the artist's own name in it linked) in that style; on phones the sample goes under the text -->
    <div role="radiogroup" :aria-label="t('album.tracklist.settings.links')" class="grid gap-1.5">
      <button
        v-for="option in linkStyles"
        :key="option.key"
        type="button"
        role="radio"
        :aria-checked="linkStyle === option.key"
        class="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 rounded-lg px-3 py-2.5 text-left sm:grid-cols-[auto_minmax(0,1fr)_auto] transition-[box-shadow,background-color] duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        :class="linkStyle === option.key ? 'shadow-[inset_0_0_0_2px_var(--primary)]' : 'shadow-[inset_0_0_0_1px_var(--line)]'"
        @click="setLinkStyle(option.key)"
      >
        <span class="grid size-4 shrink-0 place-items-center rounded-full transition-colors duration-150" :class="linkStyle === option.key ? 'bg-primary' : 'shadow-[inset_0_0_0_1.5px_var(--faint)]'" aria-hidden="true">
          <span v-if="linkStyle === option.key" class="size-1.5 rounded-full bg-on-primary" />
        </span>
        <span class="min-w-0">
          <span class="block text-13.5 font-semibold leading-5 text-title">{{ option.label }}</span>
          <span class="block text-xs leading-[1.125rem] text-meta">{{ option.hint }}</span>
        </span>
        <span :data-credit-links="option.key" aria-hidden="true" class="col-start-2 inline-flex h-5 items-center justify-self-start rounded-md bg-black/[0.05] px-1.5 text-xs leading-5 text-title sm:col-start-3 sm:row-start-1 sm:justify-self-end dark:bg-white/[0.08]">
          <span class="credit-plain">Silence&nbsp;</span><span class="credit-link">Deon Oh</span>
        </span>
      </button>
    </div>

    <div class="[@media(hover:none)]:hidden">
      <p class="mb-1 mt-5 text-xs font-semibold text-meta">{{ t('album.tracklist.settings.cards') }}</p>
      <div class="divide-y divide-line">
        <UiSwitch :model-value="prefs.artistCard" class="w-full flex-row-reverse justify-between py-2.5" @update:model-value="value => emit('update', { artistCard: Boolean(value) })">
          <span class="block text-13.5 font-semibold leading-5 text-title">{{ t('album.tracklist.settings.artist_card') }}</span>
          <span class="block text-xs leading-[1.125rem] text-meta">{{ t('album.tracklist.settings.artist_card_hint') }}</span>
        </UiSwitch>
      </div>
    </div>

    <template #footer>
      <UiButton variant="primary" size="sm" @click="open = false">{{ t('album.tracklist.settings.done') }}</UiButton>
    </template>
  </UiDialog>
</template>
