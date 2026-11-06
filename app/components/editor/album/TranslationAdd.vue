<template>
  <UiButton :variant="primary ? 'primary' : 'add'" :size="primary ? 'md' : 'sm'" :icon="Plus" :class="primary ? 'shadow-xs active:translate-y-px' : ''" @click="start">
    {{ $t('editor.translate.new') }}
  </UiButton>

  <EditorModal v-model="dialog" :title="$t('editor.translate.new')" :description="$t('editor.translate.new_hint')" :icon="Languages" @submit="save">
    <div class="space-y-5">
      <fieldset>
        <legend class="mb-1.5 text-sm font-medium text-body">{{ $t('editor.names.question') }}</legend>
        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="key in GROUPS"
            :key="key"
            type="button"
            class="flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors"
            :class="group === key ? TITLE_GROUPS[key].active : 'border-line hover:bg-card-hover'"
            :aria-pressed="group === key"
            @click="group = key"
          >
            <span class="flex items-center gap-1.5 text-sm font-semibold" :class="group === key ? TITLE_GROUPS[key].text : 'text-title'">
              <component :is="TITLE_GROUPS[key].icon" :size="14" class="shrink-0" />{{ $t(`editor.names.${key}`) }}
            </span>
            <span class="text-[11px] leading-4 text-meta">{{ $t(`editor.names.${key}_hint`) }}</span>
          </button>
        </div>
      </fieldset>

      <div>
        <span class="mb-1.5 block text-sm font-medium text-body">{{ $t('catalog.field.locale') }}</span>
        <UiLanguageSelect v-model="locale" :readings="group !== 'official'" :aria-label="$t('catalog.field.locale')" size="sm" class="w-60" />
        <span v-if="problem" class="mt-1 block text-xs text-danger">{{ problem }}</span>
        <span v-else-if="kind === 'transliteration'" class="mt-1 block text-[11px] text-meta">{{ $t('editor.names.reading_note') }}</span>
      </div>

      <details class="group rounded-xl border border-warning/25 bg-warning/10 px-3.5 py-2.5 text-xs text-body">
        <summary class="flex cursor-pointer list-none items-center gap-1.5 font-semibold text-title">
          <Lightbulb :size="14" class="shrink-0 text-warning" />{{ $t('editor.names.tip_title') }}
          <ChevronDown :size="13" class="ml-auto shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <ul class="mt-2 list-disc space-y-1 pl-4 leading-5">
          <li v-for="line in TITLE_TIPS" :key="line">{{ $t(`editor.names.tip_${line}`) }}</li>
        </ul>
      </details>
    </div>
    <template #footer>
      <UiButton size="sm" class="ring-1 ring-inset ring-line shadow-xs active:translate-y-px" @click="dialog = false">{{ $t('common.cancel') }}</UiButton>
      <UiButton type="submit" variant="primary" size="sm" class="shadow-xs active:translate-y-px">{{ $t('editor.translate.add') }}</UiButton>
    </template>
  </EditorModal>
</template>

<script setup lang="ts">
import type { TitleGroup } from '~/utils/titleGroups'
import { ChevronDown, Languages, Lightbulb, Plus } from '@lucide/vue'
import { isReading } from '~/utils/contentLanguages'
import { TITLE_GROUPS, TITLE_TIPS } from '~/utils/titleGroups'

/**
 * 新建翻译: the button and the dialog for a new translation of the album's names (AlbumTranslateSection), asked as the
 * other-names dialog asks (EditorTitleRows): official names or a translation (a reading being a transliteration), and
 * the language. A translation the album already has is opened instead of made twice.
 */
const props = defineProps<{
  /** Translations the album already has, as "locale|kind" */
  taken: string[]
  /** The empty section's main button rather than the small one beside the tabs */
  primary?: boolean
}>()
const emit = defineEmits<{ add: [set: { locale: string, kind: 'official' | 'translation' | 'transliteration' }] }>()

const GROUPS = ['official', 'translation'] as const satisfies TitleGroup[]

const { t, locale: uiLocale } = useI18n()

const dialog = ref(false)
const group = ref<typeof GROUPS[number]>('translation')
const locale = ref('')
const tried = ref(false)

const kind = computed(() => group.value === 'official' ? 'official' : isReading(locale.value) ? 'transliteration' : 'translation')

const problem = computed(() => {
  if (!tried.value) return null
  if (!locale.value) return t('editor.names.locale_required')
  if (group.value === 'official' && isReading(locale.value)) return t('editor.names.official_reading')
  return null
})

const start = () => {
  const first = uiLocale.value !== 'ja' ? uiLocale.value : 'en'
  const takenLocales = new Set(props.taken.map(key => key.split('|')[0]))
  locale.value = [first, 'en', 'zh-Hans', 'zh-Hant', 'ko'].find(code => !takenLocales.has(code)) ?? ''
  group.value = 'translation'
  tried.value = false
  dialog.value = true
}

const save = () => {
  tried.value = true
  if (problem.value) return
  emit('add', { locale: locale.value, kind: kind.value })
  dialog.value = false
}
</script>
