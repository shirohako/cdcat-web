<template>
  <UiSelect
    :model-value="modelValue"
    :options="options"
    class="w-full"
    searchable
    :search-placeholder="$t('common.search_region')"
    v-bind="$attrs"
    @update:model-value="onchange"
  />
</template>

<script setup>
import { h } from 'vue'
import CommonFlag from '~/components/common/Flag.vue'

defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const onchange = (value) => {
  emit('update:modelValue', value)
}

// Countries and regions with a flag in public/flags (ISO 3166-1 alpha-2): about 5 million people or more and a real online
// music market, plus Macau and Puerto Rico, and EU for releases made for all of Europe. The two lists are kept the same;
// a code added here needs its flag there.
const mainCountryCodes = [
  // East Asia
  'JP', 'CN', 'KR', 'TW', 'HK', 'MO',
  // Southeast Asia
  'TH', 'ID', 'MY', 'PH', 'VN', 'SG',
  // South and Central Asia
  'IN', 'PK', 'BD', 'LK', 'KZ', 'UZ',
  // Middle East
  'TR', 'IL', 'SA', 'AE', 'IR', 'IQ', 'JO', 'LB',
  // Europe (EU: a release for the whole of Europe)
  'EU', 'GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'AT', 'CH', 'IT', 'ES', 'PT', 'SE', 'NO', 'DK', 'FI',
  'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'RS', 'UA', 'BY', 'RU',
  // North America
  'US', 'CA', 'MX',
  // Latin America and the Caribbean
  'BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'DO', 'BO', 'CR', 'PR',
  // Africa
  'EG', 'MA', 'DZ', 'TN', 'NG', 'GH', 'KE', 'TZ', 'ZA',
  // Oceania
  'AU', 'NZ',
]

// The value is the ISO code itself ("JP"); the label is always the English name, whatever the UI language.
const countries = mainCountryCodes.map(code => ({
  code,
  name: regionEnglishName(code),
})).sort((a, b) => a.name.localeCompare(b.name, 'en'))

const { t } = useI18n()
const { regionName } = useLocaleFormatting()

const options = computed(() => [
  { value: '', label: t('account_pages.preferences.select_region') },
  // Flags are images (public/flags), not emoji: Windows shows emoji flags as two letters.
  ...countries.map(c => ({ value: c.code, label: c.name, keywords: `${c.code} ${regionName(c.code)}`, icon: () => h(CommonFlag, { code: c.code }) })),
])
</script>
