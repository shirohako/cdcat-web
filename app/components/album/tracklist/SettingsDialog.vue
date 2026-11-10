<script setup lang="ts">
import type { CreditLinkStyle } from '~/composables/useCreditLinks'
import type { TracklistDensity, TracklistNumbering, TracklistPrefs } from '~/utils/tracklistView'
import { Check } from '@lucide/vue'
import { CREDIT_LINK_STYLES } from '~/composables/useCreditLinks'
import { TRACKLIST_NUMBERINGS } from '~/utils/tracklistView'

/** One 样式 on offer: a layout at one of its densities, shown as the layout's name with the density as a small tag. */
export interface TracklistStyleOption {
  key: string
  style: string
  density: TracklistDensity
  name: string
  tag: string
}

/**
 * The tracklist's settings: its 样式 (a tile with a small drawing each, in order, three to a row however many there
 * are), how credited names show the part that links (for the whole site) and how later discs number their tracks. The
 * artist hover card is always on. Changes apply at once, behind the dialog.
 */
const props = defineProps<{ styles: TracklistStyleOption[], prefs: TracklistPrefs }>()
const emit = defineEmits<{ update: [patch: Partial<TracklistPrefs>] }>()

const open = defineModel<boolean>({ required: true })
const { t } = useI18n()

// How credited names show the part that links: site-wide, not only the tracklist (useCreditLinks).
const { style: linkStyle, setStyle: setLinkStyle } = useCreditLinks()

/** The settings picked from a list of rows: a radio dot, the name and what it does, and a sample on the right. */
const choices = computed(() => [
  {
    key: 'links',
    title: t('album.tracklist.settings.links'),
    hint: t('album.tracklist.settings.links_hint'),
    value: linkStyle.value as string,
    choose: (key: string) => setLinkStyle(key as CreditLinkStyle),
    options: CREDIT_LINK_STYLES.map(key => ({ key, label: t(`album.tracklist.settings.link_${key}`), hint: t(`album.tracklist.settings.link_${key}_hint`) })),
  },
  {
    key: 'numbering',
    title: t('album.tracklist.settings.numbering'),
    hint: t('album.tracklist.settings.numbering_hint'),
    value: props.prefs.numbering as string,
    choose: (key: string) => emit('update', { numbering: key as TracklistNumbering }),
    options: TRACKLIST_NUMBERINGS.map(key => ({ key, label: t(`album.tracklist.settings.numbering_${key}`), hint: t(`album.tracklist.settings.numbering_${key}_hint`) })),
  },
])
// The numbering samples: disc 2's first tracks after a disc 1 of 12
const NUMBERING_SAMPLES: Record<TracklistNumbering, string> = { disc: '01 02 03', album: '13 14 15' }

const isCurrent = (option: TracklistStyleOption) => props.prefs.style === option.style && props.prefs.density === option.density
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
        :aria-checked="isCurrent(style)"
        class="relative grid gap-1.5 rounded-lg p-[0.4375rem] pb-2 text-center transition-[box-shadow,background-color] duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        :class="isCurrent(style) ? 'shadow-[inset_0_0_0_2px_var(--primary)]' : 'shadow-[inset_0_0_0_1px_var(--line)]'"
        @click="emit('update', { style: style.style, density: style.density })"
      >
        <AlbumTracklistThumb :layout="style.style" :density="style.density" class="w-full" />
        <span class="flex items-center justify-center gap-1 text-13 font-semibold leading-[1.125rem] text-title">{{ style.name }}<AlbumTracklistLabel size="mini">{{ style.tag }}</AlbumTracklistLabel></span>
        <span v-if="isCurrent(style)" class="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-on-primary" aria-hidden="true"><Check :size="11" :stroke-width="3" /></span>
      </button>
    </div>

    <template v-for="choice in choices" :key="choice.key">
      <p class="mb-0.5 mt-5 text-xs font-semibold text-meta">{{ choice.title }}</p>
      <p class="mb-2 text-xs leading-[1.125rem] text-meta">{{ choice.hint }}</p>
      <!-- One row each: a radio dot, the name and what it does, and a sample (on phones under the text): for the links a
           tag as the tracklist draws it (a printed name, only the artist's own name in it linked) in that style, for the
           numbering disc 2's first numbers -->
      <div role="radiogroup" :aria-label="choice.title" class="grid gap-1.5">
        <button
          v-for="option in choice.options"
          :key="option.key"
          type="button"
          role="radio"
          :aria-checked="choice.value === option.key"
          class="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 rounded-lg px-3 py-2.5 text-left sm:grid-cols-[auto_minmax(0,1fr)_auto] transition-[box-shadow,background-color] duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          :class="choice.value === option.key ? 'shadow-[inset_0_0_0_2px_var(--primary)]' : 'shadow-[inset_0_0_0_1px_var(--line)]'"
          @click="choice.choose(option.key)"
        >
          <span class="grid size-4 shrink-0 place-items-center rounded-full transition-colors duration-150" :class="choice.value === option.key ? 'bg-primary' : 'shadow-[inset_0_0_0_1.5px_var(--faint)]'" aria-hidden="true">
            <span v-if="choice.value === option.key" class="size-1.5 rounded-full bg-on-primary" />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold leading-5 text-title">{{ option.label }}</span>
            <span class="block text-xs leading-[1.125rem] text-meta">{{ option.hint }}</span>
          </span>
          <span
            :data-credit-links="choice.key === 'links' ? option.key : undefined"
            aria-hidden="true"
            class="col-start-2 inline-flex h-5 items-center justify-self-start rounded-md bg-black/[0.05] px-1.5 text-xs leading-5 text-title sm:col-start-3 sm:row-start-1 sm:justify-self-end dark:bg-white/[0.08]"
          >
            <template v-if="choice.key === 'links'"><span class="credit-plain">Silence&nbsp;</span><span class="credit-link">Deon Oh</span></template>
            <template v-else><span class="mr-1.5 text-meta">Disc 2</span><span class="tabular-nums">{{ NUMBERING_SAMPLES[option.key as TracklistNumbering] }}</span></template>
          </span>
        </button>
      </div>
    </template>

    <template #footer>
      <UiButton variant="primary" size="sm" @click="open = false">{{ t('album.tracklist.settings.done') }}</UiButton>
    </template>
  </UiDialog>
</template>
