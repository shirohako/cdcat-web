<script setup lang="ts">
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { COMMON_LANGUAGES, LANGUAGES, languageKeywords, READINGS } from '~/utils/contentLanguages'

/**
 * A searchable select of content languages (BCP 47 tags) for names, lyrics and the like, not limited to the interface
 * languages. The common ones, the listed languages in `suggested` (e.g. those an album already uses) and, with
 * `readings`, romanizations and kana readings come first, then the other listed languages by name. Only listed
 * languages can be picked; a value already set to another one is kept and shown. Attributes go to the UiSelect button.
 */
const props = withDefaults(defineProps<{
  suggested?: string[]
  readings?: boolean
  placeholder?: string
  size?: 'xs' | 'sm' | 'md'
  invalid?: boolean
  disabled?: boolean
}>(), { suggested: () => [], placeholder: undefined, size: 'md' })

const model = defineModel<string>({ required: true })

const { t } = useI18n()
const { intlLocale } = useLocaleFormatting()
const { localeName } = useCatalogDisplay()

const option = (code: string, group: string): UiSelectOption<string> =>
  ({ value: code, label: localeName(code), hint: code, keywords: languageKeywords(code), group })

const options = computed(() => {
  const first = [...new Set([
    ...COMMON_LANGUAGES,
    ...props.suggested.filter(code => LANGUAGES.includes(code)),
    ...(props.readings ? READINGS : []),
    ...(model.value ? [model.value] : []),
  ])]
  const collator = new Intl.Collator(intlLocale.value)
  const rest = LANGUAGES.filter(code => !first.includes(code)).map(code => option(code, t('common.languages_all')))
    .sort((a, b) => collator.compare(a.label, b.label))
  return [...first.map(code => option(code, t('common.languages_common'))), ...rest]
})
</script>

<template>
  <UiSelect
    v-model="model"
    :options="options"
    :placeholder="placeholder ?? $t('common.select_language')"
    :size="size"
    :invalid="invalid"
    :disabled="disabled"
    searchable
    :search-placeholder="$t('common.search_language')"
  />
</template>
