<script setup lang="ts">
import type { TracklistLanguage } from '~/types/album'
import { tracklistLanguageKey } from '~/utils/tracklistView'

/** Picks the language track titles are shown in: the original or any language the tracklist has names in. A pick applies and closes. */
const props = defineProps<{ languages: TracklistLanguage[] }>()

const open = defineModel<boolean>({ required: true })
const language = defineModel<string>('language', { required: true })

const { t } = useI18n()
const { localeName, enumLabel } = useCatalogDisplay()

const options = computed(() => [
  { key: '', name: t('album.tracklist.original'), kind: '', meta: '' },
  ...props.languages.map(item => ({
    key: tracklistLanguageKey(item),
    name: localeName(item.locale),
    kind: item.kind === 'transliteration' ? '' : enumLabel('title_kind', item.kind),
    meta: `${item.count}/${item.total}`,
  })),
])

const pick = (key: string) => {
  language.value = key
  open.value = false
}
</script>

<template>
  <UiDialog v-model="open" size="sm" :title="t('album.tracklist.language_title')" :description="t('album.tracklist.language_description')">
    <div role="radiogroup" :aria-label="t('album.tracklist.language_title')" class="-mx-2.5">
      <button
        v-for="option in options"
        :key="option.key"
        type="button"
        role="radio"
        :aria-checked="option.key === language"
        class="flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13.5px] text-title transition-colors duration-150 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
        @click="pick(option.key)"
      >
        <span class="size-4 shrink-0 rounded-full transition-shadow duration-150" :class="option.key === language ? 'shadow-[inset_0_0_0_5px_var(--primary)]' : 'shadow-[inset_0_0_0_1.5px_var(--faint)]'" aria-hidden="true" />
        <span :class="option.key === language && 'font-semibold'">{{ option.name }}</span>
        <span v-if="option.kind" class="text-[11px] text-meta">{{ option.kind }}</span>
        <span v-if="option.meta" class="ml-auto text-xs tabular-nums text-meta">{{ option.meta }}</span>
      </button>
    </div>
    <p class="mt-3 text-xs leading-relaxed text-meta">{{ t('album.tracklist.language_note') }}</p>
  </UiDialog>
</template>
